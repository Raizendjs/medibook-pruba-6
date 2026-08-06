import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../lib/supabase/server";

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient({ request, cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const token = body?.token;

  if (!token) {
    return new Response(JSON.stringify({ error: "Falta el token de la tarjeta" }), { status: 400 });
  }

  // 🔒 Nunca confiamos en un monto que venga del cliente: recalculamos el
  // total desde el carrito guardado en la base de datos.
  const { data: cartItems, error: cartError } = await supabase
    .from("cart_items")
    .select("id, listing_id, check_in, check_out, start_time, end_time, guests, total_price, listings(currency)")
    .eq("user_id", user.id);

  if (cartError || !cartItems || cartItems.length === 0) {
    return new Response(JSON.stringify({ error: "Tu carrito está vacío" }), { status: 400 });
  }

  const total = cartItems.reduce((sum, i: any) => sum + Number(i.total_price), 0);
  const currency = (cartItems[0] as any).listings?.currency ?? "USD";

  // 🔒 Validamos disponibilidad ANTES de cobrar. Si alguien más ya reservó
  // alguna de estas fechas mientras estaban en tu carrito, cortamos aquí y
  // nunca se le cobra nada a la tarjeta.
  const listingIds = [...new Set(cartItems.map((i: any) => i.listing_id))];

  // Usamos la función RPC (no la tabla directo): las políticas de "bookings"
  // solo dejan ver tus propias reservas o las de tus propiedades, así que
  // una consulta directa aquí no vería las reservas de OTROS usuarios y
  // dejaría pasar conflictos de fechas sin detectarlos.
  const { data: existingBookings, error: existingError } = await supabase.rpc(
    "get_bookings_for_listings",
    { p_listing_ids: listingIds }
  );

  if (existingError) {
    return new Response(
      JSON.stringify({ error: "No se pudo verificar disponibilidad. Intenta de nuevo." }),
      { status: 500 }
    );
  }

  function toMinutes(t: string | null) {
    if (!t) return null;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }

  function overlaps(
    aIn: string,
    aOut: string,
    aStart: string | null,
    aEnd: string | null,
    bIn: string,
    bOut: string,
    bStart: string | null,
    bEnd: string | null
  ) {
    if (!(aIn < bOut && bIn < aOut)) return false;
    // Mismo día exacto: comparamos también el rango de horas.
    if (aIn === bIn && aOut === bOut && aStart && aEnd && bStart && bEnd) {
      const aS = toMinutes(aStart)!;
      const aE = toMinutes(aEnd)!;
      const bS = toMinutes(bStart)!;
      const bE = toMinutes(bEnd)!;
      return aS < bE && bS < aE;
    }
    return true;
  }

  const conflict = cartItems.find((item: any) =>
    (existingBookings ?? []).some(
      (b: any) =>
        b.listing_id === item.listing_id &&
        overlaps(
          item.check_in,
          item.check_out,
          item.start_time,
          item.end_time,
          b.check_in,
          b.check_out,
          b.start_time,
          b.end_time
        )
    )
  );

  if (conflict) {
    return new Response(
      JSON.stringify({
        error:
          "Una de las fechas en tu carrito ya no está disponible (alguien más la reservó). No se te cobró nada — revisa tu carrito.",
      }),
      { status: 409 }
    );
  }

  const privateMerchantId = import.meta.env.KUSHKI_PRIVATE_MERCHANT_ID;
  const environment = import.meta.env.KUSHKI_ENV ?? "uat";

  if (!privateMerchantId) {
    return new Response(
      JSON.stringify({ error: "Falta configurar KUSHKI_PRIVATE_MERCHANT_ID en el servidor." }),
      { status: 500 }
    );
  }

  const chargeUrl =
    environment === "production"
      ? "https://api.kushkipagos.com/card/v1/charges"
      : "https://api-uat.kushkipagos.com/card/v1/charges";

  let kushkiResponse: any;
  try {
    const kushkiRes = await fetch(chargeUrl, {
      method: "POST",
      headers: {
        "Private-Merchant-Id": privateMerchantId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        amount: {
          // ⚠️ Ajusta este desglose de impuestos (IVA/ICE) según tu
          // configuración fiscal real en Ecuador. Por ahora todo el monto
          // se manda como "subtotalIva0" (exento) para no inventar tasas.
          subtotalIva: 0,
          subtotalIva0: total,
          ice: 0,
          iva: 0,
          currency,
        },
        contactDetails: {
          email: user.email,
        },
        fullResponse: true,
      }),
    });

    kushkiResponse = await kushkiRes.json();
  } catch (err: any) {
    return new Response(JSON.stringify({ error: `Error contactando a Kushki: ${err.message}` }), {
      status: 502,
    });
  }

  const approved =
    kushkiResponse?.ticketNumber || kushkiResponse?.transactionReference || kushkiResponse?.code === undefined;
  const isDeclined = !!kushkiResponse?.code;

  // Guardamos el pago SIEMPRE (aprobado o no), para tener registro completo.
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      user_id: user.id,
      amount: total,
      currency,
      status: isDeclined ? "declined" : "approved",
      kushki_transaction_id: kushkiResponse?.ticketNumber ?? kushkiResponse?.transactionReference ?? null,
      kushki_token: token,
      raw_response: kushkiResponse,
    })
    .select()
    .single();

  if (paymentError) {
    return new Response(JSON.stringify({ error: `No se pudo registrar el pago: ${paymentError.message}` }), {
      status: 500,
    });
  }

  if (isDeclined) {
    return new Response(
      JSON.stringify({
        error: kushkiResponse?.message ?? "El pago fue rechazado por el banco.",
        code: kushkiResponse?.code,
      }),
      { status: 402 }
    );
  }

  // ✅ Pago aprobado: creamos las reservas (quedan "pending" hasta que cada
  // anfitrión las confirme) y las ligamos al pago.
  const bookingsToInsert = cartItems.map((item: any) => ({
    listing_id: item.listing_id,
    user_id: user.id,
    check_in: item.check_in,
    check_out: item.check_out,
    start_time: item.start_time,
    end_time: item.end_time,
    guests: item.guests,
    total_price: item.total_price,
    status: "pending",
    payment_id: payment.id,
  }));

  const { error: bookingsError } = await supabase.from("bookings").insert(bookingsToInsert);

  if (bookingsError) {
    // El pago ya se cobró — esto es grave, lo dejamos bien registrado para
    // que un administrador lo resuelva manualmente (reembolso o soporte).
    return new Response(
      JSON.stringify({
        error:
          "El pago se aprobó pero hubo un problema creando tus reservas. Contacta a soporte con este número: " +
          (payment.kushki_transaction_id ?? payment.id),
      }),
      { status: 500 }
    );
  }

  // Vaciar el carrito
  await supabase
    .from("cart_items")
    .delete()
    .in("id", cartItems.map((i: any) => i.id));

  return new Response(JSON.stringify({ ok: true, paymentId: payment.id }), {
    headers: { "Content-Type": "application/json" },
  });
};

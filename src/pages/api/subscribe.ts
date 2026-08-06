import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../lib/supabase/server";

const MONTHLY_PRICE = 15;

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient({ request, cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "anfitrion") {
    return new Response(JSON.stringify({ error: "Solo los anfitriones pueden suscribirse." }), {
      status: 403,
    });
  }

  const body = await request.json().catch(() => null);
  const token = body?.token;

  if (!token) {
    return new Response(JSON.stringify({ error: "Falta el token de la tarjeta" }), { status: 400 });
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
          subtotalIva: 0,
          subtotalIva0: MONTHLY_PRICE,
          ice: 0,
          iva: 0,
          currency: "USD",
        },
        contactDetails: { email: user.email },
        fullResponse: true,
      }),
    });
    kushkiResponse = await kushkiRes.json();
  } catch (err: any) {
    return new Response(JSON.stringify({ error: `Error contactando a Kushki: ${err.message}` }), {
      status: 502,
    });
  }

  const isDeclined = !!kushkiResponse?.code;

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      user_id: user.id,
      amount: MONTHLY_PRICE,
      currency: "USD",
      status: isDeclined ? "declined" : "approved",
      payment_context: "monthly_subscription",
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
      JSON.stringify({ error: kushkiResponse?.message ?? "El pago fue rechazado por el banco." }),
      { status: 402 }
    );
  }

  // ✅ Pago aprobado: activamos/renovamos la suscripción por 30 días.
  // NOTA: esto cobra UNA VEZ y activa el periodo — no es un cobro
  // recurrente automático. Para renovación automática real hace falta
  // usar el producto de suscripciones de Kushki (necesita credenciales
  // de sandbox del comercio para configurarlo y probarlo).
  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + 30);

  const { error: subError } = await supabase.from("subscriptions").upsert(
    {
      host_id: user.id,
      plan: "monthly",
      status: "active",
      price: MONTHLY_PRICE,
      current_period_end: periodEnd.toISOString(),
    },
    { onConflict: "host_id" }
  );

  if (subError) {
    return new Response(
      JSON.stringify({
        error:
          "El pago se aprobó pero hubo un problema activando tu suscripción. Contacta a soporte con este número: " +
          (payment.kushki_transaction_id ?? payment.id),
      }),
      { status: 500 }
    );
  }

  return new Response(JSON.stringify({ ok: true, periodEnd: periodEnd.toISOString() }), {
    headers: { "Content-Type": "application/json" },
  });
};

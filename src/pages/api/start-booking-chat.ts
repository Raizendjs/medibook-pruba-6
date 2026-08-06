import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import { verifyRecaptcha } from "../../lib/recaptcha";

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient({ request, cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const bookingId = body?.bookingId;
  if (!bookingId) {
    return new Response(JSON.stringify({ error: "Falta el id de la reserva" }), { status: 400 });
  }

  const isHuman = await verifyRecaptcha(body?.recaptchaToken);
  if (!isHuman) {
    return new Response(
      JSON.stringify({ error: "Verificación de reCAPTCHA fallida. Intenta de nuevo." }),
      { status: 400 }
    );
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, user_id, status, listing_id, listings(host_id)")
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    return new Response(JSON.stringify({ error: "Reserva no encontrada" }), { status: 404 });
  }

  const hostId = (booking as any).listings?.host_id;
  const isGuest = booking.user_id === user.id;
  const isHost = hostId === user.id;

  if (!isGuest && !isHost) {
    return new Response(JSON.stringify({ error: "No tienes acceso a esta reserva" }), { status: 403 });
  }

  if (booking.status === "cancelled" || booking.status === "rejected") {
    return new Response(
      JSON.stringify({ error: "Esta reserva fue cancelada, no se puede iniciar el chat." }),
      { status: 400 }
    );
  }

  const guestId = booking.user_id;

  // ¿Ya existe la conversación para esta reserva/propiedad+huésped?
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("type", "booking")
    .eq("listing_id", booking.listing_id)
    .eq("requester_id", guestId)
    .maybeSingle();

  if (existing) {
    return new Response(JSON.stringify({ ok: true, conversationId: existing.id }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: created, error: createError } = await supabase
    .from("conversations")
    .insert({
      type: "booking",
      requester_id: guestId,
      host_id: hostId,
      listing_id: booking.listing_id,
      status: "active",
      activated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (createError || !created) {
    return new Response(
      JSON.stringify({ error: createError?.message ?? "No se pudo crear la conversación" }),
      { status: 500 }
    );
  }

  return new Response(JSON.stringify({ ok: true, conversationId: created.id }), {
    headers: { "Content-Type": "application/json" },
  });
};

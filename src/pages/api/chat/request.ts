import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { verifyRecaptcha } from "../../../lib/recaptcha";

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient({ request, cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const reason = body?.reason ?? null;
  const recaptchaToken = body?.recaptchaToken;

  const isHuman = await verifyRecaptcha(recaptchaToken);
  if (!isHuman) {
    return new Response(
      JSON.stringify({ error: "Verificación de reCAPTCHA fallida. Intenta de nuevo." }),
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      requester_id: user.id,
      status: "pending",
      reason,
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ data }), {
    headers: { "Content-Type": "application/json" },
  });
};

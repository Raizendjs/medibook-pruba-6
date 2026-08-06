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

  const { error } = await supabase.from("subscriptions").upsert(
    {
      host_id: user.id,
      plan: "per_transaction",
      status: "active",
      price: 0,
      current_period_end: null,
    },
    { onConflict: "host_id" }
  );

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};

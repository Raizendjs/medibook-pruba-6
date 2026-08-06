import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../../lib/supabase/server";

// ⚠️ Antes este endpoint devolvía TODOS los usuarios de Supabase Auth
// usando la service role key SIN NINGÚN chequeo de sesión ni de rol.
// Ahora se exige sesión + rol "administrador".
export const GET: APIRoute = async ({ request, cookies }) => {
  const supabaseServer = createSupabaseServerClient({ request, cookies });

  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  }

  const { data: profile } = await supabaseServer
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "administrador") {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 403 });
  }

  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return new Response(
      JSON.stringify({ error: "ENV missing (URL or SERVICE_ROLE_KEY)" }),
      { status: 500 }
    );
  }

  const supabaseAdmin = createClient(url, key);
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data.users), {
    headers: { "Content-Type": "application/json" },
  });
};

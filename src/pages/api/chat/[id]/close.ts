import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export const POST: APIRoute = async ({ request, cookies, params, redirect }) => {
  const supabase = createSupabaseServerClient({ request, cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect("/login/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "administrador") {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 403 });
  }

  await supabase
    .from("conversations")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", params.id);

  return redirect("/admin/chats/");
};

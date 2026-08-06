import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../lib/supabase/server";
 
export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient({ request, cookies });
 
  await supabase.auth.signOut();
 
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/login/",
    },
  });
};
 
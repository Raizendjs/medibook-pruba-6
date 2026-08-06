import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../../../../../lib/supabase/server";

const VALID_ROLES = ["usuario", "anfitrion", "administrador"];

async function requireAdmin(request: Request, cookies: any, targetId: string | undefined) {
  const supabase = createSupabaseServerClient({ request, cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "administrador") {
    return { error: new Response(JSON.stringify({ error: "No autorizado" }), { status: 403 }) };
  }

  if (targetId === user.id) {
    return {
      error: new Response(
        JSON.stringify({ error: "No puedes editar/eliminar tu propia cuenta desde aquí." }),
        { status: 400 }
      ),
    };
  }

  return { user };
}

export const POST: APIRoute = async ({ request, cookies, params }) => {
  const targetId = params.id;
  const auth = await requireAdmin(request, cookies, targetId);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const updates: Record<string, string> = {};

  if (typeof body?.full_name === "string") updates.full_name = body.full_name;
  if (body?.status === "activo" || body?.status === "suspendido") updates.status = body.status;
  if (typeof body?.role === "string" && VALID_ROLES.includes(body.role)) updates.role = body.role;

  if (Object.keys(updates).length === 0) {
    return new Response(JSON.stringify({ error: "Nada que actualizar" }), { status: 400 });
  }

  const supabaseAdmin = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL!,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update(updates)
    .eq("id", targetId)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ data }), {
    headers: { "Content-Type": "application/json" },
  });
};

// Borrado real de la cuenta — distinto de suspender. Si el usuario tiene
// reservas o propiedades asociadas, la base de datos rechaza el borrado
// (protección propia de las foreign keys) y devolvemos ese error tal cual,
// sugiriendo suspender en su lugar.
export const DELETE: APIRoute = async ({ request, cookies, params }) => {
  const targetId = params.id;
  const auth = await requireAdmin(request, cookies, targetId);
  if (auth.error) return auth.error;

  if (!targetId) {
    return new Response(JSON.stringify({ error: "Falta el id del usuario" }), { status: 400 });
  }

  const supabaseAdmin = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL!,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabaseAdmin.auth.admin.deleteUser(targetId);

  if (error) {
    const isForeignKeyIssue = /foreign key|violat/i.test(error.message);
    return new Response(
      JSON.stringify({
        error: isForeignKeyIssue
          ? "No se puede eliminar: este usuario tiene reservas y/o propiedades asociadas. Suspéndelo en vez de eliminarlo, o primero reasigna/elimina esas reservas y propiedades."
          : error.message,
      }),
      { status: 400 }
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};

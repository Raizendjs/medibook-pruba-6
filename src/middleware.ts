import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "./lib/supabase/server";

export type AppRole = "usuario" | "anfitrion" | "administrador";

const HOME_BY_ROLE: Record<AppRole, string> = {
  usuario: "/perfil/",
  anfitrion: "/perfil/",
  administrador: "/admin/",
};

const ROUTE_ROLES: Array<{ prefix: string; roles: AppRole[] }> = [
  { prefix: "/dashboard", roles: ["usuario"] },
  { prefix: "/mis-reservas-host", roles: ["anfitrion"] }, // debe ir ANTES que /mis-reservas
  { prefix: "/mis-reservas", roles: ["usuario"] },
  { prefix: "/carrito", roles: ["usuario"] },
  { prefix: "/checkout", roles: ["usuario"] },
  { prefix: "/suscripcion", roles: ["usuario", "anfitrion"] },
  { prefix: "/mis-propiedades", roles: ["anfitrion"] },
  { prefix: "/admin", roles: ["administrador"] },
];

const LOGIN_ONLY_ROUTES = ["/solicitar-rol", "/post-login", "/ayuda", "/mensajes", "/perfil"];

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";

  if (pathname.startsWith("/auth/callback")) {
    return next();
  }

  const supabase = createSupabaseServerClient({
    request: context.request,
    cookies: context.cookies,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  context.locals.user = user;
  context.locals.profile = null;
  context.locals.role = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name, avatar_url, status, profile_completed")
      .eq("id", user.id)
      .single();

    context.locals.profile = profile ?? null;
    context.locals.role = (profile?.role as AppRole | undefined) ?? null;

    if (
      profile?.status === "suspendido" &&
      pathname !== "/cuenta-suspendida" &&
      !pathname.startsWith("/api/")
    ) {
      return context.redirect("/cuenta-suspendida/");
    }
  }

  const matched = ROUTE_ROLES.find((r) => matchesPrefix(pathname, r.prefix));

  if (matched) {
    if (!user) {
      return context.redirect("/login/");
    }

    const role = context.locals.role;

    if (!role || !matched.roles.includes(role)) {
      return context.redirect(role ? HOME_BY_ROLE[role] : "/login/");
    }

    return next();
  }

  if (LOGIN_ONLY_ROUTES.some((prefix) => matchesPrefix(pathname, prefix))) {
    if (!user) {
      return context.redirect("/login/");
    }
    return next();
  }

  return next();
});

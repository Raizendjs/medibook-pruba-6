import { createServerClient } from "@supabase/ssr";
import { parseCookieHeader } from "@supabase/ssr";

export function createSupabaseServerClient({ request, cookies }) {
  const url = new URL(request.url);
  const isHttps = url.protocol === "https:";

  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get("cookie") ?? "");
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookies.set(name, value, {
                ...options,
                path: "/",
                sameSite: "lax",
                secure: isHttps, // false en localhost http, true en producción https
                httpOnly: false, // debe ser accesible desde el navegador para que el cliente lea la sesión
              });
            } catch (err) {
              // Pasa cuando Supabase refresca el token en segundo plano (p. ej.
              // porque tanto el middleware como la página vuelven a llamar
              // getUser()) y esa notificación llega DESPUÉS de que la página ya
              // terminó de enviarse — ahí Astro ya no deja tocar las cookies de
              // esa respuesta. No hay nada que "arreglar" para esa respuesta
              // puntual (se reintentará solo en el siguiente request), así que
              // no vale la pena tumbar la página por esto.
              console.warn(
                `No se pudo fijar la cookie "${name}" (la respuesta ya se había enviado):`,
                err instanceof Error ? err.message : err
              );
            }
          });
        },
      },
    }
  );
}
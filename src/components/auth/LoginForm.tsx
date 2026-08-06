import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = new FormData(e.currentTarget);

    const email = String(form.get("email"));
    const password = String(form.get("password"));

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    window.location.href = "/post-login/";
  }

  async function loginGoogle() {
    setGoogleLoading(true);

    // ✅ CORREGIDO: redirige al callback (que procesa el "code"),
    // no directo al dashboard. El callback ya se encarga de mandar
    // al usuario a /dashboard/ una vez creada la sesión.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback/`,
      },
    });

    if (error) {
      setGoogleLoading(false);
      alert(error.message);
    }
  }

  return (
    <div className="space-y-6">

      {/* GOOGLE */}

      <button
        type="button"
        onClick={loginGoogle}
        disabled={googleLoading}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 48 48"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="#FFC107"
            d="M43.611 20.083H42V20H24v8h11.303C33.655 32.657 29.244 36 24 36c-6.627 0-12-5.373-12-12S17.373 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.27 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"
          />
          <path
            fill="#FF3D00"
            d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.27 4 24 4c-7.682 0-14.347 4.337-17.694 10.691z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.143 35.091 26.679 36 24 36c-5.223 0-9.623-3.329-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
          />
          <path
            fill="#1976D2"
            d="M43.611 20.083H42V20H24v8h11.303c-1.12 3.118-3.497 5.561-6.084 7.57l6.19 5.238C34.971 41.091 44 34 44 24c0-1.341-.138-2.651-.389-3.917z"
          />
        </svg>

        {googleLoading
          ? "Redirigiendo..."
          : "Continuar con Google"}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
        </div>

        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-slate-400 dark:bg-slate-950">
            o continúa con email
          </span>
        </div>
      </div>

      {/* LOGIN */}

      <form onSubmit={login} className="space-y-5">

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Email
          </label>

          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="correo@ejemplo.com"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Contraseña
          </label>

          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary-600 py-3 font-medium text-white transition hover:bg-primary-700 disabled:opacity-50"
        >
          {loading
            ? "Iniciando sesión..."
            : "Iniciar sesión"}
        </button>

      </form>

    </div>
  );
}
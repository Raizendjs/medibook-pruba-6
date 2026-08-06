import { useState } from "react";
import { supabase } from "../../lib/supabase";

type SignupRole = "usuario" | "anfitrion";

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [role, setRole] = useState<SignupRole>("usuario");

  async function register(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = new FormData(e.currentTarget);

    const name = String(form.get("name"));
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          full_name: name,
          // El trigger de la base de datos solo acepta 'usuario' o 'anfitrion'
          // aquí; el rol 'administrador' nunca se puede auto-asignar.
          role,
        },
      },
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    window.location.href = "/login/";
  }

  async function registerGoogle() {
    setGoogleLoading(true);

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
        onClick={registerGoogle}
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
      <p className="text-center text-xs text-slate-400">
        Con Google te registras como usuario. Si quieres ser anfitrión, luego
        podrás solicitar el cambio de rol desde tu cuenta.
      </p>

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

      {/* REGISTRO */}

      <form onSubmit={register} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Quiero registrarme como
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("usuario")}
              aria-pressed={role === "usuario"}
              className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                role === "usuario"
                  ? "border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300"
                  : "border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              Usuario
              <span className="mt-1 block text-xs font-normal opacity-70">
                Quiero reservar espacios
              </span>
            </button>

            <button
              type="button"
              onClick={() => setRole("anfitrion")}
              aria-pressed={role === "anfitrion"}
              className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                role === "anfitrion"
                  ? "border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300"
                  : "border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              Anfitrión
              <span className="mt-1 block text-xs font-normal opacity-70">
                Quiero publicar propiedades
              </span>
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Nombre
          </label>

          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Tu nombre"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

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
            Password
          </label>

          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="********"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary-600 py-3 font-medium text-white transition hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

    </div>
  );
}

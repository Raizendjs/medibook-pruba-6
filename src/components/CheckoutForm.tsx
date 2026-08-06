import { useState } from "react";
import { Kushki } from "@kushki/js";

type Step = "validating" | "charging" | "confirming";

const STEPS: { key: Step; label: string; icon: string }[] = [
  { key: "validating", label: "Validando los datos de tu tarjeta", icon: "🔍" },
  { key: "charging", label: "Procesando el pago de forma segura", icon: "💳" },
  { key: "confirming", label: "Confirmando tu reserva", icon: "✅" },
];

export default function CheckoutForm({ total, currency }: { total: number; currency: string }) {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvc, setCvc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<Step>("validating");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const merchantId = (import.meta as any).env?.PUBLIC_KUSHKI_MERCHANT_ID as string | undefined;
  const inTestEnvironment = (import.meta as any).env?.PUBLIC_KUSHKI_ENV !== "production";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!merchantId) {
      setError("Falta configurar PUBLIC_KUSHKI_MERCHANT_ID (llave pública de Kushki).");
      return;
    }

    setSubmitting(true);
    setStep("validating");

    const kushki = new Kushki({ merchantId, inTestEnvironment });

    kushki.requestToken(
      {
        amount: total,
        currency: currency as any,
        card: {
          name,
          number: number.replace(/\s/g, ""),
          cvc,
          expiryMonth,
          expiryYear,
        },
      },
      async (response: any) => {
        if (response.code) {
          setError(`${response.message ?? "No se pudo procesar la tarjeta."} (${response.code})`);
          setSubmitting(false);
          return;
        }

        setStep("charging");

        // Token generado — ahora se lo mandamos a nuestro backend para
        // hacer el cobro real (nunca se hace el cobro desde el navegador).
        const res = await fetch("/api/checkout/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: response.token }),
        });

        const body = await res.json().catch(() => ({}));

        if (!res.ok) {
          setSubmitting(false);
          setError(body?.error ?? "No se pudo completar el pago.");
          return;
        }

        setStep("confirming");
        // Pequeña pausa para que la animación de "confirmando" se
        // alcance a ver antes de redirigir; da la sensación de que
        // el proceso terminó en vez de saltar de golpe.
        await new Promise((resolve) => setTimeout(resolve, 700));

        setSubmitting(false);
        setSuccess(true);
        setTimeout(() => {
          window.location.href = "/mis-reservas/";
        }, 1600);
      }
    );
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/30 p-8 text-center">
        <div className="text-4xl mb-3 animate-bounce">✅</div>
        <p className="font-semibold text-green-800 dark:text-green-300">¡Pago aprobado!</p>
        <p className="text-sm text-green-700 dark:text-green-400 mt-1">
          Redirigiendo a tus reservas...
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition";

  if (submitting) {
    const currentIndex = STEPS.findIndex((s) => s.key === step);
    return (
      <div className="rounded-2xl border border-neutral-200 dark:border-slate-800 dark:bg-slate-900 p-8 shadow-sm">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-primary-100 dark:border-primary-950" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-xl">
              {STEPS[currentIndex]?.icon}
            </div>
          </div>
          <p className="font-semibold text-neutral-900 dark:text-white">Procesando tu pago</p>
          <p className="text-sm text-neutral-500 dark:text-slate-400 mt-1">
            No cierres ni recargues esta página, esto toma solo unos segundos.
          </p>
        </div>

        <ul className="space-y-3 max-w-xs mx-auto">
          {STEPS.map((s, i) => {
            const done = i < currentIndex;
            const active = i === currentIndex;
            return (
              <li key={s.key} className="flex items-center gap-3 text-sm">
                <span
                  className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${
                    done
                      ? "bg-green-500 text-white"
                      : active
                        ? "bg-primary-600 text-white animate-pulse"
                        : "bg-neutral-200 dark:bg-slate-700 text-neutral-400"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span
                  className={
                    done
                      ? "text-neutral-400 dark:text-slate-500 line-through decoration-neutral-300"
                      : active
                        ? "text-neutral-900 dark:text-white font-medium"
                        : "text-neutral-400 dark:text-slate-500"
                  }
                >
                  {s.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-neutral-200 dark:border-slate-800 dark:bg-slate-900 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-neutral-900 dark:text-white">Datos de la tarjeta</p>
        <span className="text-xs text-neutral-400">🔒 Pago seguro con Kushki</span>
      </div>

      <div>
        <label className="block text-xs font-semibold text-neutral-700 dark:text-slate-300 mb-1">
          Nombre en la tarjeta
        </label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} placeholder="Como aparece en la tarjeta" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-neutral-700 dark:text-slate-300 mb-1">
          Número de tarjeta
        </label>
        <input
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          required
          inputMode="numeric"
          maxLength={19}
          className={inputClass}
          placeholder="0000 0000 0000 0000"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-slate-300 mb-1">Mes</label>
          <input value={expiryMonth} onChange={(e) => setExpiryMonth(e.target.value)} required maxLength={2} className={inputClass} placeholder="MM" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-slate-300 mb-1">Año</label>
          <input value={expiryYear} onChange={(e) => setExpiryYear(e.target.value)} required maxLength={2} className={inputClass} placeholder="YY" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-slate-300 mb-1">CVC</label>
          <input value={cvc} onChange={(e) => setCvc(e.target.value)} required maxLength={4} className={inputClass} placeholder="123" />
        </div>
      </div>

      {!merchantId && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          ⚠️ Falta configurar PUBLIC_KUSHKI_MERCHANT_ID para poder cobrar.
        </p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        className="w-full rounded-xl bg-[#FF385C] hover:bg-[#E31C5F] text-white font-semibold px-4 py-3 transition disabled:opacity-50"
      >
        Pagar {currency} {total.toFixed(2)}
      </button>
    </form>
  );
}

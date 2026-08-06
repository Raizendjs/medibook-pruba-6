import { useState } from "react";
import { Kushki } from "@kushki/js";

type Step = "validating" | "charging" | "confirming";

const STEPS: { key: Step; label: string; icon: string }[] = [
  { key: "validating", label: "Validando los datos de tu tarjeta", icon: "🔍" },
  { key: "charging", label: "Procesando el pago de forma segura", icon: "💳" },
  { key: "confirming", label: "Activando tu suscripción", icon: "✅" },
];

interface SubscriptionCardProps {
  currentPlan: "monthly" | "per_transaction" | null;
  currentPeriodEnd: string | null;
}

export default function SubscriptionCard({ currentPlan, currentPeriodEnd }: SubscriptionCardProps) {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvc, setCvc] = useState("");
  const [showCardForm, setShowCardForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<Step>("validating");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [switchingToTransaction, setSwitchingToTransaction] = useState(false);

  const merchantId = (import.meta as any).env?.PUBLIC_KUSHKI_MERCHANT_ID as string | undefined;
  const inTestEnvironment = (import.meta as any).env?.PUBLIC_KUSHKI_ENV !== "production";

  const isActiveMonthly =
    currentPlan === "monthly" &&
    currentPeriodEnd &&
    new Date(currentPeriodEnd).getTime() > Date.now();

  async function handleSubscribe(e: React.FormEvent) {
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
        amount: 15,
        currency: "USD" as any,
        card: { name, number: number.replace(/\s/g, ""), cvc, expiryMonth, expiryYear },
      },
      async (response: any) => {
        if (response.code) {
          setError(`${response.message ?? "No se pudo procesar la tarjeta."} (${response.code})`);
          setSubmitting(false);
          return;
        }

        setStep("charging");

        const res = await fetch("/api/subscribe/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: response.token }),
        });
        const resBody = await res.json().catch(() => ({}));

        if (!res.ok) {
          setSubmitting(false);
          setError(resBody?.error ?? "No se pudo activar la suscripción.");
          return;
        }

        setStep("confirming");
        await new Promise((r) => setTimeout(r, 600));
        setSubmitting(false);
        setSuccess(true);
        setTimeout(() => window.location.reload(), 1200);
      }
    );
  }

  async function usePerTransaction() {
    setSwitchingToTransaction(true);
    setError(null);
    const res = await fetch("/api/plan-per-transaccion/", { method: "POST" });
    setSwitchingToTransaction(false);
    if (res.ok) {
      window.location.reload();
    } else {
      setError("No se pudo cambiar el plan. Intenta de nuevo.");
    }
  }

  const inputClass =
    "w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* PLAN MENSUAL */}
      <div className={`rounded-2xl border-2 p-6 ${isActiveMonthly ? "border-primary-600 bg-primary-50/40" : "border-neutral-200"}`}>
        <div className="flex items-center justify-between">
          <p className="font-bold text-neutral-900">Suscripción mensual</p>
          {isActiveMonthly && (
            <span className="text-[11px] font-semibold bg-primary-600 text-white px-2 py-0.5 rounded-full">
              Plan activo
            </span>
          )}
        </div>
        <p className="text-2xl font-extrabold text-neutral-900 mt-2">
          $15 <span className="text-sm font-normal text-neutral-500">/ mes</span>
        </p>
        <ul className="mt-4 space-y-2 text-sm text-neutral-600">
          <li>✓ 10% de descuento en el precio de arriendo para tus clientes</li>
          <li>✓ Preferencia de publicidad dentro de la plataforma</li>
          <li>✓ Seguro de responsabilidad civil con precio preferencial</li>
        </ul>

        {isActiveMonthly ? (
          <p className="text-xs text-neutral-500 mt-4">
            Vence el {new Date(currentPeriodEnd!).toLocaleDateString()}
          </p>
        ) : showCardForm ? (
          submitting ? (
            <div className="mt-4 text-center py-4">
              <div className="relative w-10 h-10 mx-auto mb-2">
                <div className="absolute inset-0 rounded-full border-4 border-primary-100" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-600 animate-spin" />
              </div>
              <p className="text-xs text-neutral-500">
                {STEPS.find((s) => s.key === step)?.label}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="mt-4 space-y-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre en la tarjeta" required className={inputClass} />
              <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Número de tarjeta" required maxLength={19} className={inputClass} />
              <div className="grid grid-cols-3 gap-2">
                <input value={expiryMonth} onChange={(e) => setExpiryMonth(e.target.value)} placeholder="MM" required maxLength={2} className={inputClass} />
                <input value={expiryYear} onChange={(e) => setExpiryYear(e.target.value)} placeholder="YY" required maxLength={2} className={inputClass} />
                <input value={cvc} onChange={(e) => setCvc(e.target.value)} placeholder="CVC" required maxLength={4} className={inputClass} />
              </div>
              <button type="submit" className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition-colors">
                Pagar $15 y activar
              </button>
            </form>
          )
        ) : (
          <button
            onClick={() => setShowCardForm(true)}
            className="w-full mt-4 bg-neutral-900 hover:bg-neutral-700 text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition-colors"
          >
            Suscribirme
          </button>
        )}
      </div>

      {/* POR TRANSACCIÓN */}
      <div className={`rounded-2xl border-2 p-6 ${!isActiveMonthly ? "border-primary-600 bg-primary-50/40" : "border-neutral-200"}`}>
        <div className="flex items-center justify-between">
          <p className="font-bold text-neutral-900">Pago por transacción</p>
          {!isActiveMonthly && (
            <span className="text-[11px] font-semibold bg-primary-600 text-white px-2 py-0.5 rounded-full">
              Plan activo
            </span>
          )}
        </div>
        <p className="text-2xl font-extrabold text-neutral-900 mt-2">$0 <span className="text-sm font-normal text-neutral-500">de base</span></p>
        <ul className="mt-4 space-y-2 text-sm text-neutral-600">
          <li>✓ Sin costo fijo mensual</li>
          <li>✓ Solo se te cobra cuando alguien arrienda tu espacio</li>
          <li>✕ Sin descuento ni preferencia de publicidad</li>
        </ul>
        {isActiveMonthly && (
          <button
            onClick={usePerTransaction}
            disabled={switchingToTransaction}
            className="w-full mt-4 rounded-xl border border-neutral-300 text-sm font-medium py-2.5 hover:border-neutral-900 transition-colors disabled:opacity-50"
          >
            {switchingToTransaction ? "Cambiando..." : "Cambiar a este plan"}
          </button>
        )}
      </div>

      {error && (
        <div className="md:col-span-2 rounded-xl bg-[#FFF0F1] border border-[#FFD3D8] px-4 py-3">
          <p className="text-sm text-[#FF385C] font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="md:col-span-2 rounded-xl bg-[#F0FAF0] border border-[#CDEECB] px-4 py-3">
          <p className="text-sm text-[#008A05] font-medium">¡Suscripción activada!</p>
        </div>
      )}
    </div>
  );
}

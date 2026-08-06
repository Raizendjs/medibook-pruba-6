import { useState } from "react";
import Recaptcha from "../Recaptcha";

export default function StartBookingChatButton({
  bookingId,
  label,
}: {
  bookingId: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (submitting) return;
    setOpen(false);
    setToken(null);
    setError(null);
  }

  async function confirm() {
    if (!token) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/start-booking-chat/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, recaptchaToken: token }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok || !data.conversationId) {
      setError(data?.error ?? "No se pudo abrir el chat.");
      setToken(null);
      return;
    }

    window.location.href = `/mensajes/${data.conversationId}/`;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-primary-600 hover:text-primary-700 border border-primary-200 rounded-full px-3 py-1.5"
      >
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              Verificación rápida
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Confirma que no eres un robot para abrir el chat.
            </p>

            <Recaptcha onVerify={setToken} />

            {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                disabled={submitting}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-3 py-2 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={!token || submitting}
                className="text-xs font-medium bg-primary-600 text-white rounded-full px-4 py-2 hover:bg-primary-700 disabled:opacity-50"
              >
                {submitting ? "Abriendo..." : "Continuar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

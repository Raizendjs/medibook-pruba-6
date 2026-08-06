import { useState } from "react";
import Recaptcha from "../Recaptcha";

type AppRole = "usuario" | "anfitrion" | "administrador";

type RoleRequest = {
  id: string;
  requested_role: AppRole;
  status: "pending" | "approved" | "rejected";
  reason: string | null;
  admin_note: string | null;
  created_at: string;
};

const ROLE_LABELS: Record<AppRole, string> = {
  usuario: "Usuario",
  anfitrion: "Anfitrión",
  administrador: "Administrador",
};

const STATUS_LABELS: Record<RoleRequest["status"], { label: string; className: string }> = {
  pending: { label: "Pendiente", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  approved: { label: "Aprobada", className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  rejected: { label: "Rechazada", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
};

export default function RoleRequestForm({
  currentRole,
  initialRequests,
}: {
  currentRole: AppRole;
  initialRequests: RoleRequest[];
}) {
  // 🔒 "administrador" nunca es seleccionable acá: ese rol solo se asigna
  // a mano desde Supabase. Aquí solo se puede pedir cambiar entre
  // usuario ⇄ anfitrion (y, si ya eres administrador, bajar a cualquiera).
  const otherRoles = (["usuario", "anfitrion"] as AppRole[]).filter(
    (r) => r !== currentRole
  );

  const [targetRole, setTargetRole] = useState<AppRole | null>(otherRoles[0] ?? null);
  const [reason, setReason] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [requests, setRequests] = useState<RoleRequest[]>(initialRequests);

  const hasPending = requests.some((r) => r.status === "pending");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!targetRole) {
      setError("Selecciona una opción primero.");
      return;
    }
    if (!recaptchaToken) {
      setError("Marca la casilla de verificación antes de enviar.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const res = await fetch("/api/role-requests/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestedRole: targetRole,
        reason: reason || null,
        recaptchaToken,
      }),
    });

    const body = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(body?.error ?? "No se pudo enviar la solicitud.");
      return;
    }

    setSuccess(true);
    setReason("");
    setRecaptchaToken(null);
    if (body?.data) setRequests((prev) => [body.data as RoleRequest, ...prev]);
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">Tú eres</p>
        <p className="text-lg font-semibold text-slate-900 dark:text-white">
          {ROLE_LABELS[currentRole]}
        </p>
      </div>

      {hasPending ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          Ya tienes una solicitud de cambio de rol pendiente de revisión. Un
          administrador debe aprobarla o rechazarla antes de que puedas
          enviar una nueva.
        </div>
      ) : otherRoles.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
          No hay otro rol disponible para solicitar.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {otherRoles.length === 1 ? "Vas a solicitar cambiar a" : "Rol que quiero solicitar"}
            </label>
            <div className={`grid gap-3 ${otherRoles.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
              {otherRoles.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setTargetRole((prev) => (prev === r ? null : r))}
                  aria-pressed={targetRole === r}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    targetRole === r
                      ? "border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {ROLE_LABELS[r]}
                  {otherRoles.length === 1 && (
                    <span className="ml-2 text-xs opacity-70">
                      {targetRole === r ? "✓ seleccionado" : "toca para seleccionar"}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="reason" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Cuéntanos por qué (opcional)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Ej: administro las propiedades de mi familia y necesito acceso de anfitrión..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-primary-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Verificación
            </label>
            <Recaptcha onVerify={setRecaptchaToken} />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Solicitud enviada. Un administrador la revisará pronto.
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !targetRole || !recaptchaToken}
            className="w-full rounded-xl bg-primary-600 py-3 font-medium text-white transition hover:bg-primary-700 disabled:opacity-50"
          >
            {submitting
              ? "Enviando..."
              : targetRole
              ? `Solicitar cambio a ${ROLE_LABELS[targetRole]}`
              : "Selecciona una opción"}
          </button>
        </form>
      )}

      {requests.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Historial de solicitudes
          </h2>
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">
                    {ROLE_LABELS[r.requested_role]}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                  {r.admin_note && (
                    <p className="mt-1 text-xs text-slate-500">Nota: {r.admin_note}</p>
                  )}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_LABELS[r.status].className}`}>
                  {STATUS_LABELS[r.status].label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

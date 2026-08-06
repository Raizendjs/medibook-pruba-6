import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminUserEditor({
  userId,
  initialName,
  initialStatus,
}: {
  userId: string;
  initialName: string;
  initialStatus: "activo" | "suspendido";
}) {
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingSuspend, setConfirmingSuspend] = useState(false);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name: name })
      .eq("id", userId);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setMessage("Nombre actualizado.");
  }

  async function toggleStatus() {
    const newStatus = status === "activo" ? "suspendido" : "activo";
    setSaving(true);
    setError(null);
    setMessage(null);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", userId);

    setSaving(false);
    setConfirmingSuspend(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setStatus(newStatus);
    setMessage(
      newStatus === "suspendido"
        ? "Cuenta suspendida. La persona no podrá usar la app, pero su historial queda intacto."
        : "Cuenta reactivada."
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={saveName} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm text-slate-900 dark:text-white"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-primary-600 text-white px-4 py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          Guardar nombre
        </button>
      </form>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Estado de la cuenta:{" "}
          <span className={status === "activo" ? "text-green-600" : "text-red-500"}>
            {status === "activo" ? "Activa" : "Suspendida"}
          </span>
        </p>
        <p className="text-xs text-slate-500 mb-3">
          Suspender NO borra nada: solo bloquea el acceso a la app. Todo su
          historial (reservas, propiedades, chats) queda guardado.
        </p>

        {confirmingSuspend ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 dark:text-slate-400">¿Confirmas?</span>
            <button
              onClick={toggleStatus}
              disabled={saving}
              className="rounded-lg bg-red-500 text-white px-3 py-1.5 text-xs font-semibold hover:bg-red-600"
            >
              Sí, {status === "activo" ? "suspender" : "reactivar"}
            </button>
            <button
              onClick={() => setConfirmingSuspend(false)}
              className="text-xs text-slate-500 hover:underline"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingSuspend(true)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${
              status === "activo" ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {status === "activo" ? "Suspender cuenta" : "Reactivar cuenta"}
          </button>
        )}
      </div>
    </div>
  );
}

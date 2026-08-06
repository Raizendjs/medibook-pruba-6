import { useState } from "react";

const ROLE_LABELS: Record<string, string> = {
  usuario: "Usuario",
  anfitrion: "Anfitrión",
  administrador: "Administrador",
};

export default function AdminUserEdit({
  userId,
  initialName,
  initialStatus,
  initialRole,
}: {
  userId: string;
  initialName: string;
  initialStatus: "activo" | "suspendido";
  initialRole: "usuario" | "anfitrion" | "administrador";
}) {
  const [name, setName] = useState(initialName);
  const [role, setRole] = useState(initialRole);
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  async function save(updates: { full_name?: string; status?: "activo" | "suspendido"; role?: string }, successMsg: string) {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const res = await fetch(`/api/admin/usuarios/${userId}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    const body = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(body?.error ?? "No se pudo guardar.");
      return;
    }

    if (updates.status) setStatus(updates.status);
    setSuccess(successMsg);
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);

    const res = await fetch(`/api/admin/usuarios/${userId}/`, { method: "DELETE" });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      setDeleting(false);
      setDeleteError(body?.error ?? "No se pudo eliminar la cuenta.");
      return;
    }

    window.location.href = "/admin/usuarios/";
  }

  return (
    <div className="space-y-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Nombre
        </label>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
          />
          <button
            onClick={() => save({ full_name: name }, "Nombre actualizado.")}
            disabled={saving}
            className="rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            Guardar
          </button>
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Rol
        </label>
        <div className="flex gap-2">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
            className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
          >
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              if (role !== initialRole && !confirm(`¿Cambiar el rol a "${ROLE_LABELS[role]}"?`)) return;
              save({ role }, "Rol actualizado.");
            }}
            disabled={saving || role === initialRole}
            className="rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            Guardar
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}

      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Estado de la cuenta</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {status === "activo"
              ? "La cuenta puede iniciar sesión con normalidad."
              : "La cuenta está suspendida: no puede usar la app, pero su historial se conserva."}
          </p>
        </div>
        {status === "activo" ? (
          <button
            onClick={() => {
              if (confirm("¿Suspender esta cuenta? Se conserva todo su historial y se puede reactivar cuando quieras.")) {
                save({ status: "suspendido" }, "Cuenta suspendida.");
              }
            }}
            disabled={saving}
            className="shrink-0 rounded-lg bg-amber-500 text-white px-3 py-1.5 text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
          >
            Suspender
          </button>
        ) : (
          <button
            onClick={() => save({ status: "activo" }, "Cuenta reactivada.")}
            disabled={saving}
            className="shrink-0 rounded-lg bg-green-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            Reactivar
          </button>
        )}
      </div>

      {/* Eliminar cuenta: distinto de suspender, y de verdad borra al usuario */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
        <p className="text-sm font-medium text-red-600 dark:text-red-400">Zona de peligro</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
          Elimina la cuenta por completo (no se puede deshacer). Si el usuario tiene reservas o
          propiedades, no se va a poder eliminar hasta que se resuelvan — en ese caso, mejor
          suspéndela en vez de eliminarla.
        </p>

        {!confirmingDelete ? (
          <button
            onClick={() => {
              setConfirmingDelete(true);
              setDeleteError(null);
              setDeleteText("");
            }}
            className="rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 px-3 py-1.5 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Eliminar cuenta
          </button>
        ) : (
          <div className="space-y-2 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
            <p className="text-sm text-red-700 dark:text-red-300">
              Esto borra la cuenta de <strong>{initialName}</strong> para siempre. Escribe{" "}
              <strong>ELIMINAR</strong> para confirmar.
            </p>
            <input
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder="ELIMINAR"
              className="w-full rounded-lg border border-red-300 dark:border-red-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
            />
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting || deleteText !== "ELIMINAR"}
                className="rounded-lg bg-red-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-red-700 disabled:opacity-40"
              >
                {deleting ? "Eliminando..." : "Sí, eliminar definitivamente"}
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="rounded-lg text-slate-600 dark:text-slate-300 px-3 py-1.5 text-sm font-medium hover:text-slate-900 dark:hover:text-white"
              >
                Cancelar
              </button>
            </div>
            {deleteError && <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

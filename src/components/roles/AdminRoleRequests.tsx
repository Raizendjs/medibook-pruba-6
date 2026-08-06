import { useState } from "react";
import { supabase } from "../../lib/supabase";

type AppRole = "usuario" | "anfitrion" | "administrador";

export type PendingRoleRequest = {
  id: string;
  user_id: string;
  previous_role: AppRole;
  requested_role: AppRole;
  reason: string | null;
  created_at: string;
  requester_email: string | null;
  requester_name: string | null;
};

const ROLE_LABELS: Record<AppRole, string> = {
  usuario: "Usuario",
  anfitrion: "Anfitrión",
  administrador: "Administrador",
};

export default function AdminRoleRequests({
  initialRequests,
}: {
  initialRequests: PendingRoleRequest[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function review(id: string, approve: boolean) {
    setBusyId(id);
    setError(null);

    const note = approve ? null : window.prompt("Motivo del rechazo (opcional):") || null;

    const { error: rpcError } = await supabase.rpc("review_role_change_request", {
      request_id: id,
      approve,
      note,
    });

    setBusyId(null);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    setRequests((prev) => prev.filter((r) => r.id !== id));
  }

  if (requests.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No hay solicitudes de cambio de rol pendientes.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-500">{error}</p>}

      {requests.map((r) => (
        <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-200">
              {r.requester_name || r.requester_email || r.user_id}
            </p>
            <p className="text-xs text-slate-500">
              {ROLE_LABELS[r.previous_role]} → {ROLE_LABELS[r.requested_role]}
            </p>
            {r.reason && <p className="mt-1 text-xs text-slate-500 max-w-md">"{r.reason}"</p>}
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => review(r.id, true)}
              disabled={busyId === r.id}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              Aprobar
            </button>
            <button
              onClick={() => review(r.id, false)}
              disabled={busyId === r.id}
              className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
            >
              Rechazar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

import { useState } from "react";
import { supabase } from "../../lib/supabase";

type UserOption = { id: string; name: string; email: string | null };

type PendingConversation = {
  id: string;
  requester_id: string;
  reason: string | null;
  created_at: string;
  requesterName: string;
};

export default function AdminChatList({
  adminId,
  initialPending,
  users,
  preselectedUserId,
}: {
  adminId: string;
  initialPending: PendingConversation[];
  users: UserOption[];
  preselectedUserId?: string;
}) {
  const [pending, setPending] = useState(initialPending);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedUserId, setSelectedUserId] = useState(preselectedUserId ?? "");
  const [starting, setStarting] = useState(false);

  async function activate(id: string) {
    setBusyId(id);
    setError(null);

    const { error: updateError } = await supabase
      .from("conversations")
      .update({ status: "active", admin_id: adminId, activated_at: new Date().toISOString() })
      .eq("id", id);

    setBusyId(null);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    window.location.href = `/admin/chats/${id}/`;
  }

  async function startDirectChat() {
    if (!selectedUserId) return;
    setStarting(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("conversations")
      .insert({
        requester_id: selectedUserId,
        admin_id: adminId,
        status: "active",
        activated_at: new Date().toISOString(),
      })
      .select()
      .single();

    setStarting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    window.location.href = `/admin/chats/${data.id}/`;
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
          Empezar un chat directo
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
          >
            <option value="">Selecciona un usuario...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} {u.email ? `(${u.email})` : ""}
              </option>
            ))}
          </select>
          <button
            onClick={startDirectChat}
            disabled={!selectedUserId || starting}
            className="rounded-xl bg-primary-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {starting ? "Iniciando..." : "Iniciar chat"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div>
        <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
          Solicitudes de chat pendientes
        </p>
        {pending.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No hay solicitudes de ayuda pendientes.
          </p>
        ) : (
          <div className="space-y-3">
            {pending.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {c.requesterName}
                  </p>
                  {c.reason && <p className="mt-1 text-xs text-slate-500 max-w-md">"{c.reason}"</p>}
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(c.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => activate(c.id)}
                  disabled={busyId === c.id}
                  className="shrink-0 rounded-lg bg-primary-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  {busyId === c.id ? "..." : "Iniciar chat"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

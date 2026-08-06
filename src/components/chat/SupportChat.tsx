import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Recaptcha from "../Recaptcha";
import ChatWindow from "./ChatWindow";

type ConversationStatus = "pending" | "active" | "closed";

type Conversation = {
  id: string;
  status: ConversationStatus;
  admin_id: string | null;
  reason: string | null;
};

export default function SupportChat({
  currentUserId,
  initialConversation,
  initialMessages,
  adminName,
  adminAvatar,
}: {
  currentUserId: string;
  initialConversation: Conversation | null;
  initialMessages: { id: string; conversation_id: string; sender_id: string; body: string; created_at: string }[];
  adminName: string | null;
  adminAvatar?: string | null;
}) {
  const [conversation, setConversation] = useState<Conversation | null>(initialConversation);
  const [reason, setReason] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversation || conversation.status === "closed") return;

    const channel = supabase
      .channel(`conversation-status-${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `id=eq.${conversation.id}`,
        },
        (payload) => {
          setConversation((prev) =>
            prev ? { ...prev, status: (payload.new as any).status, admin_id: (payload.new as any).admin_id } : prev
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id]);

  async function requestChat(e: React.FormEvent) {
    e.preventDefault();

    if (!recaptchaToken) {
      setError("Marca la casilla de verificación antes de enviar.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/chat/request/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reason || null, recaptchaToken }),
    });

    const body = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(body?.error ?? "No se pudo enviar la solicitud.");
      return;
    }

    setConversation(body.data);
  }

  if (conversation?.status === "active") {
    return (
      <ChatWindow
        conversationId={conversation.id}
        currentUserId={currentUserId}
        otherPartyName={adminName ?? "Administrador"}
        otherPartyAvatar={adminAvatar}
        isActive
        initialMessages={initialMessages}
      />
    );
  }

  if (conversation?.status === "pending") {
    return (
      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 p-6 text-sm text-amber-800 dark:text-amber-200 flex items-start gap-3">
        <span className="text-2xl">⏳</span>
        <div>
          <p className="font-medium">Tu solicitud está en cola</p>
          <p className="mt-1 opacity-90">
            Un administrador la tomará en cuanto pueda y el chat se activará
            aquí mismo, en tiempo real, sin que tengas que recargar la página.
          </p>
        </div>
      </div>
    );
  }

  if (conversation?.status === "closed") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Tu chat anterior fue cerrado. Puedes pedir uno nuevo si necesitas
          más ayuda.
        </p>
        <button
          onClick={() => {
            setConversation(null);
            setRecaptchaToken(null);
            setReason("");
            setError(null);
          }}
          className="rounded-xl bg-primary-600 text-white px-4 py-2 text-sm font-medium hover:bg-primary-700"
        >
          Solicitar nuevo chat
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={requestChat} className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
          ¿En qué necesitas ayuda? (opcional)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Cuéntanos brevemente tu problema..."
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500"
        />
      </div>

      <Recaptcha onVerify={setRecaptchaToken} />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !recaptchaToken}
        className="w-full rounded-xl bg-primary-600 py-3 font-medium text-white transition hover:bg-primary-700 disabled:opacity-50"
      >
        {submitting ? "Enviando..." : "Solicitar chat de ayuda"}
      </button>
    </form>
  );
}

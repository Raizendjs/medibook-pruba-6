import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { avatarColorFor } from "../../lib/avatarColor";

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at?: string | null;
  attachment_path?: string | null;
};

const EMOJIS = [
  "😀", "😂", "😅", "😉", "😊", "😍", "🤔", "😢", "😮", "😡",
  "👍", "👎", "🙏", "👏", "🙌", "💪", "❤️", "🔥", "🎉", "✅",
  "❓", "❗", "⏰", "📌", "😴", "😎", "🥳", "🤝", "👋", "💬",
];

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5MB

// "Ding" sintetizado con Web Audio API — sin archivo de audio externo.
// Silencioso a propósito si el navegador bloquea audio (autoplay policy).
function playIncomingSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.32);
    osc.onended = () => ctx.close();
  } catch {
    // Autoplay bloqueado u otro problema de audio: no es crítico, se ignora.
  }
}

// Imagen adjunta: el bucket es privado, así que la URL firmada se
// resuelve del lado del cliente al momento de mostrarla (no se guarda
// en la base de datos, evitando que expire).
function AttachmentImage({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    supabase.storage
      .from("chat-attachments")
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (!cancelled && data?.signedUrl) setUrl(data.signedUrl);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!url) {
    return <div className="w-44 h-32 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />;
  }

  return (
    <a href={url} target="_blank" rel="noreferrer" className="block">
      <img
        src={url}
        alt="Imagen adjunta"
        className="max-w-[220px] max-h-[220px] rounded-lg object-cover"
      />
    </a>
  );
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback para navegadores muy viejos sin crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function ChatWindow({
  conversationId,
  currentUserId,
  otherPartyId,
  otherPartyName,
  otherPartyAvatar,
  isActive,
  initialMessages,
  variant = "booking",
}: {
  conversationId: string;
  currentUserId: string;
  otherPartyId?: string;
  otherPartyName: string;
  otherPartyAvatar?: string | null;
  isActive: boolean;
  initialMessages: Message[];
  /** "support" = chat de ayuda con un administrador (look oficial, con
   * etiqueta). "booking" = chat normal entre huésped y anfitrión. */
  variant?: "support" | "booking";
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isNearBottomRef = useRef(true);
  const isFirstRenderRef = useRef(true);
  const [showNewMessagePill, setShowNewMessagePill] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const otherTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastTypingSentRef = useRef(0);

  // Une un mensaje "real" (venido de Supabase, por realtime o por la
  // respuesta del insert) al estado, usando SIEMPRE el id como única
  // fuente de verdad. Como el id lo generamos en el navegador (uuid)
  // ANTES de insertar y se lo mandamos a Postgres como parte de la fila,
  // no hay ambigüedad posible entre el mensaje "optimista" y el real:
  // son literalmente el mismo id, así lleguen por dos caminos distintos
  // (la respuesta del insert y el evento de realtime) o en cualquier orden.
  function upsertRealMessage(real: Message) {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === real.id);
      if (idx === -1) return [...prev, real];
      const next = [...prev];
      next[idx] = { ...next[idx], ...real };
      return next;
    });
    setPendingIds((prev) => {
      if (!prev.has(real.id)) return prev;
      const next = new Set(prev);
      next.delete(real.id);
      return next;
    });
  }

  useEffect(() => {
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as Message;
          if (row.sender_id !== currentUserId) {
            playIncomingSound();
            setOtherTyping(false);
          }
          upsertRealMessage(row);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, read_at: updated.read_at } : m))
          );
        }
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        if ((payload.payload as { userId?: string })?.userId === currentUserId) return;
        setOtherTyping(true);
        if (otherTypingTimeoutRef.current) clearTimeout(otherTypingTimeoutRef.current);
        otherTypingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 2500);
      })
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      if (otherTypingTimeoutRef.current) clearTimeout(otherTypingTimeoutRef.current);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Avisa al otro participante que "estoy escribiendo", como máximo una
  // vez cada 1.5s mientras se sigue tecleando (el que recibe borra el
  // aviso solo si no llega nada nuevo en 2.5s — no hace falta un evento
  // explícito de "dejé de escribir").
  function notifyTyping() {
    const now = Date.now();
    if (now - lastTypingSentRef.current < 1500) return;
    lastTypingSentRef.current = now;
    channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: currentUserId },
    });
  }

  // Auto-scroll "inteligente": si ya estás viendo el final del chat, los
  // mensajes nuevos te siguen bajando solos. Si te subiste a leer historial,
  // no te interrumpe — en su lugar muestra un aviso de "nuevo mensaje".
  function handleMessagesScroll() {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceFromBottom < 80;
    if (isNearBottomRef.current) setShowNewMessagePill(false);
  }

  function scrollToBottomNow() {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowNewMessagePill(false);
  }

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
      return;
    }
    if (isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      setShowNewMessagePill(true);
    }
  }, [messages.length]);

  // Textarea auto-expandible (hasta un máximo, luego scrollea internamente).
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 128) + "px";
  }, [text]);

  // Marcar como leídos los mensajes del otro participante cuando el
  // chat está abierto (esto dispara el "visto" del lado que envió).
  useEffect(() => {
    const unread = messages.filter((m) => m.sender_id !== currentUserId && !m.read_at && !pendingIds.has(m.id));
    if (unread.length === 0) return;

    const ids = unread.map((m) => m.id);
    supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", ids)
      .then(() => {
        setMessages((prev) =>
          prev.map((m) => (ids.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m))
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, currentUserId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    await doSend();
  }

  async function doSend() {
    const body = text.trim();
    if (!body || sending) return;

    const id = makeId();
    const optimistic: Message = {
      id,
      conversation_id: conversationId,
      sender_id: currentUserId,
      body,
      created_at: new Date().toISOString(),
      read_at: null,
    };
    setMessages((prev) => [...prev, optimistic]);
    setPendingIds((prev) => new Set(prev).add(id));
    setSending(true);
    setText("");
    setShowEmojiPicker(false);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        id,
        conversation_id: conversationId,
        sender_id: currentUserId,
        body,
      })
      .select()
      .single();

    setSending(false);

    if (error || !data) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setText(body);
      return;
    }

    upsertRealMessage(data as Message);
  }

  function insertEmoji(emoji: string) {
    setText((prev) => prev + emoji);
  }

  async function handleAttachImage(file: File) {
    if (!file.type.startsWith("image/")) {
      setAttachError("Solo se pueden adjuntar imágenes.");
      return;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setAttachError("La imagen no puede pesar más de 5MB.");
      return;
    }

    setAttachError(null);
    setUploadingImage(true);

    const id = makeId();
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${conversationId}/${id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("chat-attachments")
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      setUploadingImage(false);
      setAttachError("No se pudo subir la imagen.");
      return;
    }

    const body = text.trim();
    const optimistic: Message = {
      id,
      conversation_id: conversationId,
      sender_id: currentUserId,
      body,
      created_at: new Date().toISOString(),
      read_at: null,
      attachment_path: path,
    };
    setMessages((prev) => [...prev, optimistic]);
    setPendingIds((prev) => new Set(prev).add(id));
    setText("");

    const { data, error } = await supabase
      .from("messages")
      .insert({
        id,
        conversation_id: conversationId,
        sender_id: currentUserId,
        body,
        attachment_path: path,
      })
      .select()
      .single();

    setUploadingImage(false);

    if (error || !data) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setAttachError("No se pudo enviar la imagen.");
      return;
    }

    upsertRealMessage(data as Message);
  }

  const initial = otherPartyName?.[0]?.toUpperCase() ?? "?";
  const isSupport = variant === "support";
  const accentColor = avatarColorFor(otherPartyName || "?");
  const myAccentColor = avatarColorFor(currentUserId);

  return (
    <div
      className={`flex flex-col h-[560px] overflow-hidden shadow-sm ${
        isSupport
          ? "rounded-xl border-2 border-slate-900 dark:border-slate-100"
          : "rounded-3xl border border-slate-200 dark:border-slate-700"
      } bg-white dark:bg-neutral-900`}
    >
      {/* HEADER */}
      {isSupport ? (
        <div className="bg-slate-900 dark:bg-black text-white">
          <div className="flex items-center gap-1.5 px-4 pt-2.5">
            <span className="text-sm">🛡️</span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-300">
              Centro de Ayuda Medibookit
            </span>
          </div>
          <div className="flex items-center gap-3 px-4 pb-3 pt-1.5">
            {otherPartyAvatar ? (
              <img
                src={otherPartyAvatar}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white"
                alt={otherPartyName}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center font-bold ring-2 ring-white">
                🛡️
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate flex items-center gap-1">
                Te atiende {otherPartyName || "un administrador"}
                <span title="Administrador verificado" className="text-sky-400">✔️</span>
              </p>
              <p className="text-[11px] text-slate-300 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-slate-500"}`} />
                {otherTyping ? "Escribiendo..." : connected ? "Administrador en línea" : "Conectando..."}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3.5 bg-slate-50 dark:bg-neutral-800 border-b border-slate-200 dark:border-slate-700">
          {otherPartyId ? (
            <a href={`/perfil/${otherPartyId}/`} className="shrink-0 hover:opacity-80 transition-opacity">
              {otherPartyAvatar ? (
                <img
                  src={otherPartyAvatar}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-white dark:ring-neutral-900 shadow-sm"
                  alt={otherPartyName}
                />
              ) : (
                <div className={`w-11 h-11 rounded-full ${accentColor} flex items-center justify-center font-bold text-white shadow-sm`}>
                  {initial}
                </div>
              )}
            </a>
          ) : otherPartyAvatar ? (
            <img
              src={otherPartyAvatar}
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-full object-cover ring-2 ring-white dark:ring-neutral-900 shadow-sm"
              alt={otherPartyName}
            />
          ) : (
            <div className={`w-11 h-11 rounded-full ${accentColor} flex items-center justify-center font-bold text-white shadow-sm`}>
              {initial}
            </div>
          )}
          <div className="flex-1 min-w-0">
            {otherPartyId ? (
              <a href={`/perfil/${otherPartyId}/`} className="text-sm font-bold truncate text-neutral-900 dark:text-white hover:underline block">
                {otherPartyName}
              </a>
            ) : (
              <p className="text-sm font-bold truncate text-neutral-900 dark:text-white">{otherPartyName}</p>
            )}
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-neutral-300 dark:bg-neutral-600"}`} />
              {otherTyping ? "Escribiendo..." : connected ? "En línea" : "Conectando..."}
            </p>
          </div>
        </div>
      )}

      {/* MENSAJES */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={messagesContainerRef}
          onScroll={handleMessagesScroll}
          className={`h-full overflow-y-auto px-4 py-4 space-y-3 ${isSupport ? "bg-white dark:bg-slate-950" : "bg-slate-50 dark:bg-neutral-900"}`}
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-2 opacity-60">
              <span className="text-3xl">💬</span>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Todavía no hay mensajes. ¡Escribe el primero!
              </p>
            </div>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            const pending = pendingIds.has(m.id);
            return (
              <div
                key={m.id}
                className={`flex flex-col animate-[message-in_0.25s_ease-out] ${mine ? "items-end" : "items-start"}`}
              >
                {isSupport && (
                  <span className={`text-[10px] font-bold uppercase tracking-wide mb-1 px-1 ${mine ? "text-slate-500 dark:text-slate-400" : "text-primary-700 dark:text-primary-400"}`}>
                    {mine ? "Tú" : `🛡️ ${otherPartyName || "Administrador"}`}
                  </span>
                )}
                <div
                  className={`max-w-[75%] px-3.5 py-2 text-sm shadow-sm ${
                    mine
                      ? isSupport
                        ? "rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-br-md"
                        : `rounded-[20px] ${myAccentColor} text-white rounded-br-md`
                      : isSupport
                        ? "rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-md border-2 border-slate-200 dark:border-slate-600"
                        : "rounded-[20px] bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-md border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {m.attachment_path && (
                    <div className={m.body ? "mb-1.5" : ""}>
                      <AttachmentImage path={m.attachment_path} />
                    </div>
                  )}
                  {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                  <p
                    className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${
                      mine
                        ? isSupport
                          ? "text-white/70 dark:text-slate-500"
                          : "text-white/70"
                        : "text-slate-400"
                    }`}
                  >
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {mine && (
                      <span
                        title={pending ? "Enviando" : m.read_at ? "Visto" : "Enviado"}
                        className={m.read_at ? "text-sky-300" : isSupport ? "text-white/60 dark:text-slate-400" : "text-white/60"}
                      >
                        {pending ? "🕐" : m.read_at ? "✓✓" : "✓"}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {showNewMessagePill && (
          <button
            type="button"
            onClick={scrollToBottomNow}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-primary-600 text-white text-xs font-medium pl-3.5 pr-3 py-1.5 shadow-lg hover:bg-primary-700 transition"
          >
            Nuevo mensaje <span aria-hidden>↓</span>
          </button>
        )}
      </div>

      {/* INPUT */}
      {isActive ? (
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 dark:border-slate-700 dark:bg-neutral-900">
          {attachError && (
            <p className="px-3 pt-2 text-xs text-red-500">{attachError}</p>
          )}
          <form onSubmit={sendMessage} className={`relative flex items-end gap-2 p-3 ${isSupport ? "bg-slate-50 dark:bg-slate-900/60 border-t-2 border-slate-900 dark:border-slate-100" : ""}`}>
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-full left-3 mb-2 grid grid-cols-6 gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 shadow-lg z-10 dark:bg-neutral-900"
              >
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="text-lg leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowEmojiPicker((v) => !v)}
              aria-label="Emojis"
              className="rounded-full w-10 h-10 flex items-center justify-center text-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
            >
              😊
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAttachImage(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              aria-label="Adjuntar imagen"
              className="rounded-full w-10 h-10 flex items-center justify-center text-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0 disabled:opacity-40"
            >
              {uploadingImage ? "⏳" : "🖼️"}
            </button>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                notifyTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  doSend();
                }
              }}
              rows={1}
              placeholder="Escribe un mensaje... (Shift+Enter para salto de línea)"
              className="flex-1 resize-none max-h-32 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-800 transition dark:border-slate-600 dark:bg-slate-900"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className={`rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-40 transition shrink-0 ${
                isSupport
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-200"
                  : `${myAccentColor} text-white hover:opacity-90`
              }`}
              aria-label="Enviar"
            >
              ➤
            </button>
          </form>
        </div>
      ) : (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-500 dark:bg-neutral-900">
          Esta conversación está cerrada.
        </div>
      )}
    </div>
  );
}

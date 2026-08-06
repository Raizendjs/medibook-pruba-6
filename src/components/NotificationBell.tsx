import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  subscribeNotifications,
  subscribeNewNotification,
  getNotifications,
  markAllRead as markAllReadInStore,
  markRead as markReadInStore,
  type AppNotification as Notification,
} from "../lib/notificationsStore";

const ICONS: Record<string, string> = {
  chat: "💬",
  payment: "💳",
  booking: "📅",
  profile: "📝",
  system: "🔔",
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

export default function NotificationBell({ userId }: { userId: string }) {
  // Store compartido: un solo fetch + un solo canal realtime por userId,
  // sin importar cuántos <NotificationBell> haya montados (desktop + mobile
  // comparten exactamente los mismos datos y la misma conexión).
  const subscribe = useCallback(
    (onChange: () => void) => subscribeNotifications(userId, onChange),
    [userId]
  );
  const getSnapshot = useCallback(() => getNotifications(userId), [userId]);
  // El 3er argumento (getServerSnapshot) es obligatorio para que esto no
  // truene durante el render en servidor de Astro (SSR) — sin él, React
  // no sabe qué mostrar antes de hidratar en el navegador. Como en el
  // servidor no hay conexión realtime todavía, devuelve lo mismo que el
  // snapshot normal (el store arranca con un array vacío y estable).
  const notifications = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const [open, setOpen] = useState(false);
  const [ringing, setRinging] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const ringTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Animación de "sonar": solo con notificaciones nuevas por realtime,
  // nunca con la carga inicial (el store distingue ambos casos).
  useEffect(() => {
    const unsubscribe = subscribeNewNotification(userId, () => {
      setRinging(true);
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = setTimeout(() => setRinging(false), 1000);
    });
    return () => {
      unsubscribe();
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    };
  }, [userId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAllRead() {
    await markAllReadInStore(userId);
  }

  async function handleClickNotification(n: Notification) {
    if (!n.read) await markReadInStore(userId, n.id);
    setOpen(false);
    if (n.link) window.location.href = n.link;
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificaciones"
        className={`relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg transition-colors ${ringing ? "animate-[wiggle_0.4s_ease-in-out]" : ""}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={ringing ? "animate-bounce" : ""}
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-[#FF385C] text-white text-[10px] font-bold leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-[100] w-80 max-h-[420px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Notificaciones</p>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-2xl mb-1">🔔</p>
              <p className="text-sm text-slate-400">No tienes notificaciones todavía.</p>
            </div>
          ) : (
            <ul>
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => handleClickNotification(n)}
                    className={`w-full text-left flex gap-3 px-4 py-3 border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${!n.read ? "bg-primary-50/60 dark:bg-primary-950/20" : ""}`}
                  >
                    <span className="text-lg leading-none mt-0.5">{ICONS[n.type] ?? "🔔"}</span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {n.title}
                        </span>
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary-600 shrink-0" />}
                      </span>
                      {n.body && (
                        <span className="block text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {n.body}
                        </span>
                      )}
                      <span className="block text-[11px] text-slate-400 mt-1">{timeAgo(n.created_at)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

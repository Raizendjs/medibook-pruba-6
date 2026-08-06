import { supabase } from "./supabase";

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

type Listener = () => void;
type InsertListener = (n: AppNotification) => void;

type StoreEntry = {
  notifications: AppNotification[];
  loaded: boolean;
  listeners: Set<Listener>;
  insertListeners: Set<InsertListener>;
  channel: ReturnType<typeof supabase.channel> | null;
  refCount: number;
};

// Un solo store por userId compartido por TODAS las instancias de
// NotificationBell que estén montadas a la vez (navbar desktop + navbar
// mobile). Esto evita el bug de tener dos fetch y dos canales realtime
// abiertos al mismo tiempo compitiendo entre sí.
const stores = new Map<string, StoreEntry>();

function getEntry(userId: string): StoreEntry {
  let entry = stores.get(userId);
  if (!entry) {
    entry = {
      notifications: [],
      loaded: false,
      listeners: new Set(),
      insertListeners: new Set(),
      channel: null,
      refCount: 0,
    };
    stores.set(userId, entry);
  }
  return entry;
}

function notify(entry: StoreEntry) {
  entry.listeners.forEach((l) => l());
}

function startForUser(userId: string): StoreEntry {
  const entry = getEntry(userId);
  entry.refCount += 1;

  // Ya hay una carga/canal activo para este usuario: no dupliques nada.
  if (entry.channel) return entry;

  supabase
    .from("notifications")
    .select("id, type, title, body, link, read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30)
    .then(({ data }) => {
      entry.notifications = data ?? [];
      entry.loaded = true;
      notify(entry);
    });

  entry.channel = supabase
    .channel(`notifications-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new as AppNotification;
        if (entry.notifications.some((n) => n.id === row.id)) return;
        entry.notifications = [row, ...entry.notifications].slice(0, 30);
        notify(entry);
        entry.insertListeners.forEach((l) => l(row));
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const updated = payload.new as AppNotification;
        entry.notifications = entry.notifications.map((n) => (n.id === updated.id ? updated : n));
        notify(entry);
      }
    )
    .subscribe();

  return entry;
}

function stopForUser(userId: string) {
  const entry = stores.get(userId);
  if (!entry) return;
  entry.refCount -= 1;
  if (entry.refCount <= 0 && entry.channel) {
    supabase.removeChannel(entry.channel);
    stores.delete(userId);
  }
}

/** Para useSyncExternalStore: se suscribe y devuelve la función de limpieza. */
export function subscribeNotifications(userId: string, listener: Listener) {
  const entry = startForUser(userId);
  entry.listeners.add(listener);
  return () => {
    entry.listeners.delete(listener);
    stopForUser(userId);
  };
}

/** Snapshot estable (misma referencia si no hay cambios) para useSyncExternalStore. */
export function getNotifications(userId: string): AppNotification[] {
  return getEntry(userId).notifications;
}

/** Evento efímero: se dispara solo con INSERTs realtime nuevos (no con la carga inicial). */
export function subscribeNewNotification(userId: string, listener: InsertListener) {
  const entry = getEntry(userId);
  entry.insertListeners.add(listener);
  return () => {
    entry.insertListeners.delete(listener);
  };
}

export async function markAllRead(userId: string) {
  const entry = getEntry(userId);
  const unreadIds = entry.notifications.filter((n) => !n.read).map((n) => n.id);
  if (unreadIds.length === 0) return;
  entry.notifications = entry.notifications.map((n) => ({ ...n, read: true }));
  notify(entry);
  await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
}

export async function markRead(userId: string, notificationId: string) {
  const entry = getEntry(userId);
  entry.notifications = entry.notifications.map((n) =>
    n.id === notificationId ? { ...n, read: true } : n
  );
  notify(entry);
  await supabase.from("notifications").update({ read: true }).eq("id", notificationId);
}

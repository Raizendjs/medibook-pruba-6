import { useState } from "react";
import { supabase } from "../lib/supabase/client";
import { avatarColorFor } from "../lib/avatarColor";
import StartBookingChatButton from "./chat/StartBookingChatButton";
import GuestRatingButton from "./GuestRatingButton";

interface Booking {
  id: string;
  check_in: string;
  check_out: string;
  guests: number | null;
  total_price: number | null;
  status: string;
  userId: string;
  guestName: string | null;
  guestAvatar: string | null;
  guestPhone: string | null;
  guestCiRuc: string | null;
  guestProfessionalType: string | null;
  guestSpecialty: string | null;
  guestRating: number | null;
  guestRatingComment: string | null;
  listing: {
    id: string;
    title: string;
    city: string | null;
    country: string;
    currency: string;
    imageUrl: string | null;
  };
}

const PROFESSIONAL_LABELS: Record<string, string> = {
  medico: "Médico",
  odontologo: "Odontólogo",
  otro: "Otro profesional",
};

interface HostBookingsListProps {
  initialBookings: Booking[];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" });
}

function statusLabel(status: string) {
  switch (status) {
    case "pending":
      return {
        text: "Pendiente",
        classes: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50",
      };
    case "confirmed":
      return {
        text: "Confirmada",
        classes: "bg-[#F0FAF0] text-[#008A05] border-[#CDEECB] dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50",
      };
    case "cancelled":
      return {
        text: "Cancelada",
        classes: "bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
      };
    case "rejected":
      return {
        text: "Rechazada",
        classes: "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/50",
      };
    default:
      return {
        text: status,
        classes: "bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
      };
  }
}

export default function HostBookingsList({ initialBookings }: HostBookingsListProps) {
  const [bookings, setBookings] = useState(initialBookings);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  const pending = bookings.filter((b) => b.status === "pending");
  const rest = bookings.filter((b) => b.status !== "pending");

  async function updateStatus(bookingId: string, newStatus: "confirmed" | "rejected") {
    setLoadingId(bookingId);
    setErrorId(null);

    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", bookingId);

    if (error) {
      setErrorId(bookingId);
      setLoadingId(null);
      return;
    }

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );
    setLoadingId(null);
  }

  function renderCard(booking: Booking) {
    const badge = statusLabel(booking.status);
    const initials = booking.guestName
      ? booking.guestName
          .split(" ")
          .map((p) => p[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : booking.userId.slice(0, 2).toUpperCase();

    return (
      <div
        key={booking.id}
        className="rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 bg-white dark:bg-neutral-900"
      >
        <div className="flex gap-3">
          {/* Foto del listing */}
          
          <a  href={`/listings/${booking.listing.id}/`}
            className="shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800"
          >
            {booking.listing.imageUrl ? (
              <img
                src={booking.listing.imageUrl}
                alt={booking.listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-300 dark:text-neutral-600 text-xs">
                Sin foto
              </div>
            )}
          </a>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              
              <a  href={`/listings/${booking.listing.id}/`}
                className="font-semibold text-neutral-900 dark:text-white hover:underline truncate"
              >
                {booking.listing.title}
              </a>
              <span
                className={`shrink-0 text-xs font-medium border rounded-full px-2.5 py-0.5 ${badge.classes}`}
              >
                {badge.text}
              </span>
            </div>

            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
              {booking.listing.city
                ? `${booking.listing.city}, ${booking.listing.country}`
                : booking.listing.country}
            </p>

            <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-2">
              📅 {formatDate(booking.check_in)}
              {(booking as any).start_time && (booking as any).end_time && (
                <> · 🕐 {(booking as any).start_time.slice(0, 5)} - {(booking as any).end_time.slice(0, 5)}</>
              )}
            </p>

            {booking.total_price != null && (
              <p className="text-sm font-semibold text-neutral-900 dark:text-white mt-1">
                {booking.listing.currency} {booking.total_price}
              </p>
            )}

            {/* Nombre y avatar del huésped — clickeable, va a su perfil público */}
            <a
              href={`/perfil/${booking.userId}/`}
              className="flex items-center gap-2 mt-2 w-fit hover:opacity-80 transition-opacity"
            >
              <div className={`w-6 h-6 rounded-full overflow-hidden flex items-center justify-center shrink-0 ${booking.guestAvatar ? "bg-neutral-200 dark:bg-neutral-700" : avatarColorFor(booking.guestName ?? booking.userId)}`}>
                {booking.guestAvatar ? (
                  <img
                    src={booking.guestAvatar}
                    alt={booking.guestName ?? "Huésped"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-semibold text-white">
                    {initials}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 hover:underline">
                Reservado por: {booking.guestName ?? `${booking.userId.slice(0, 8)}…`}
              </p>
            </a>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {booking.status === "pending" && (
            <>
              <button
                onClick={() => updateStatus(booking.id, "confirmed")}
                disabled={loadingId === booking.id}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#008A05] text-white hover:opacity-90 transition disabled:opacity-50"
              >
                {loadingId === booking.id ? "..." : "Confirmar"}
              </button>
              <button
                onClick={() => updateStatus(booking.id, "rejected")}
                disabled={loadingId === booking.id}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#FF385C] text-white hover:bg-[#E31C5F] transition disabled:opacity-50"
              >
                {loadingId === booking.id ? "..." : "Rechazar"}
              </button>
            </>
          )}
          {booking.status !== "cancelled" && booking.status !== "rejected" && (
            <StartBookingChatButton bookingId={booking.id} label="💬 Escribir al cliente" />
          )}
          {booking.status === "confirmed" && (
            <GuestRatingButton
              bookingId={booking.id}
              guestId={booking.userId}
              existingRating={booking.guestRating}
              existingComment={booking.guestRatingComment}
            />
          )}
        </div>

        {errorId === booking.id && (
          <p className="text-xs text-[#FF385C] mt-2">
            No se pudo actualizar. Intenta de nuevo.
          </p>
        )}

        {/* Info completa del cliente que reserva — abajo de todo, como pidió Ricardo */}
        <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-xs text-neutral-600 dark:text-neutral-300">
          <p className="truncate">
            <span className="text-neutral-400 dark:text-neutral-500">Huésped: </span>
            {booking.guestName ?? "—"}
          </p>
          <p>
            <span className="text-neutral-400 dark:text-neutral-500">Personas: </span>
            {booking.guests ?? "—"}
          </p>
          <p>
            <span className="text-neutral-400 dark:text-neutral-500">Teléfono: </span>
            {booking.guestPhone ? (
              <a href={`tel:${booking.guestPhone}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                {booking.guestPhone}
              </a>
            ) : (
              "—"
            )}
          </p>
          <p>
            <span className="text-neutral-400 dark:text-neutral-500">CI/RUC: </span>
            {booking.guestCiRuc ?? "—"}
          </p>
          <p className="col-span-2 sm:col-span-2 truncate">
            <span className="text-neutral-400 dark:text-neutral-500">Profesión: </span>
            {booking.guestProfessionalType
              ? `${PROFESSIONAL_LABELS[booking.guestProfessionalType] ?? booking.guestProfessionalType}${
                  booking.guestSpecialty ? " — " + booking.guestSpecialty : ""
                }`
              : "—"}
          </p>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-900 dark:text-white font-semibold">
          Aún no tienes reservas en tus propiedades
        </p>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
          Cuando alguien reserve, aparecerá aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          Pendientes de respuesta
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No tienes reservas pendientes.</p>
        ) : (
          <div className="space-y-3">{pending.map(renderCard)}</div>
        )}
      </section>

      {rest.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Confirmadas, rechazadas y canceladas
          </h2>
          <div className="space-y-3 opacity-90">{rest.map(renderCard)}</div>
        </section>
      )}
    </div>
  );
}

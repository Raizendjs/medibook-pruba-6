import { useState } from "react";
import CancelBookingButton from "./CancelBookingButton";
import StartBookingChatButton from "./chat/StartBookingChatButton";
import ListingReviewButton from "./ListingReviewButton";

interface Booking {
  id: string;
  check_in: string;
  check_out: string;
  guests: number | null;
  total_price: number | null;
  status: string;
  myRating: number | null;
  myRatingComment: string | null;
  listing: {
    id: string;
    title: string;
    city: string | null;
    country: string;
    currency: string;
    coverUrl: string | null;
  };
}

interface BookingsListProps {
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
    default:
      return {
        text: status,
        classes: "bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
      };
  }
}

export default function BookingsList({ initialBookings }: BookingsListProps) {
  const [bookings, setBookings] = useState(initialBookings);

  const today = new Date().toISOString().split("T")[0];

  const upcoming = bookings.filter(
    (b) => b.status !== "cancelled" && b.check_out >= today
  );
  const past = bookings.filter(
    (b) => b.status === "cancelled" || b.check_out < today
  );

  function markCancelled(id: string) {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b))
    );
  }

  function renderCard(booking: Booking) {
    const badge = statusLabel(booking.status);
    const canCancel = booking.status !== "cancelled" && booking.check_out >= today;

    return (
      <div
        key={booking.id}
        className="flex gap-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4"
      >
        <a
          href={`/listings/${booking.listing.id}/`}
          className="shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800"
        >
          {booking.listing.coverUrl ? (
            <img
              src={booking.listing.coverUrl}
              alt={booking.listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400 dark:text-neutral-500 text-xs">
              Sin foto
            </div>
          )}
        </a>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <a
              href={`/listings/${booking.listing.id}/`}
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

          <div className="mt-3 flex flex-wrap gap-2">
            {canCancel && (
              <CancelBookingButton
                bookingId={booking.id}
                onCancelled={() => markCancelled(booking.id)}
              />
            )}
            {booking.status !== "cancelled" && booking.status !== "rejected" && (
              <StartBookingChatButton bookingId={booking.id} label="💬 Escribir al anfitrión" />
            )}
            {booking.status === "confirmed" && (
              <ListingReviewButton
                bookingId={booking.id}
                listingId={booking.listing.id}
                existingRating={booking.myRating}
                existingComment={booking.myRatingComment}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-900 dark:text-white font-semibold">Aún no tienes reservas</p>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
          Explora propiedades y reserva tu próximo viaje.
        </p>
        <a
          href="/listings/"
          className="inline-block mt-4 rounded-full bg-[#FF385C] hover:bg-[#E31C5F] text-white text-sm font-semibold px-6 py-2.5 transition-colors"
        >
          Explorar propiedades
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Próximas</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No tienes reservas próximas.</p>
        ) : (
          <div className="space-y-3">{upcoming.map(renderCard)}</div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Pasadas y canceladas
          </h2>
          <div className="space-y-3 opacity-75">{past.map(renderCard)}</div>
        </section>
      )}
    </div>
  );
}

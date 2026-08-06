import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

interface BookingWidgetProps {
  listingId: string;
  price: number;
  currency: string;
  viewerRole?: string | null;
}

interface BookedSlot {
  check_in: string;
  check_out: string;
  start_time: string | null;
  end_time: string | null;
}

// Franjas de media hora entre 07:00 y 21:00 — horario típico de
// atención de un consultorio. Ajusta este rango si tu clínica
// trabaja otros horarios.
const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = 7; h <= 21; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 21) slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
})();

function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export default function BookingWidget({ listingId, price, currency, viewerRole }: BookingWidgetProps) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadBookedSlots() {
      const { data } = await supabase.rpc("get_bookings_for_listings", {
        p_listing_ids: [listingId],
      });
      setBookedSlots(data ?? []);
      setLoadingSlots(false);
    }
    loadBookedSlots();
  }, [listingId]);

  function slotsOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
    return aStart < bEnd && bStart < aEnd;
  }

  function isSlotTaken(slotStart: string): boolean {
    if (!date) return false;
    const start = toMinutes(slotStart);
    const end = start + 30;
    return bookedSlots.some((b) => {
      if (b.check_in !== date) return false;
      const bStart = toMinutes(b.start_time ?? "00:00");
      const bEnd = toMinutes(b.end_time ?? "23:59");
      return slotsOverlap(start, end, bStart, bEnd);
    });
  }

  function hasOverlap(): boolean {
    if (!date || !startTime || !endTime) return false;
    const start = toMinutes(startTime);
    const end = toMinutes(endTime);
    return bookedSlots.some((b) => {
      if (b.check_in !== date) return false;
      const bStart = toMinutes(b.start_time ?? "00:00");
      const bEnd = toMinutes(b.end_time ?? "23:59");
      return slotsOverlap(start, end, bStart, bEnd);
    });
  }

  const durationHours = useMemo(() => {
    if (!startTime || !endTime) return 0;
    const diff = (toMinutes(endTime) - toMinutes(startTime)) / 60;
    return diff > 0 ? diff : 0;
  }, [startTime, endTime]);

  const total = Math.round(durationHours * price * 100) / 100;

  const endTimeOptions = useMemo(() => {
    if (!startTime) return [];
    return TIME_SLOTS.filter((t) => toMinutes(t) > toMinutes(startTime));
  }, [startTime]);

  function setFullDay() {
    setStartTime("08:00");
    setEndTime("18:00");
  }

  async function handleAddToCart() {
    setError(null);
    setSuccess(false);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setError("Debes iniciar sesión para reservar.");
      return;
    }

    if (!date || !startTime || !endTime) {
      setError("Elige el día y el rango de horas.");
      return;
    }

    if (durationHours <= 0) {
      setError("La hora de salida debe ser después de la hora de entrada.");
      return;
    }

    setSubmitting(true);

    // Revalidamos disponibilidad con datos frescos justo antes de agregar.
    const { data: freshSlots, error: freshError } = await supabase.rpc(
      "get_bookings_for_listings",
      { p_listing_ids: [listingId] }
    );

    if (freshError) {
      setError("No se pudo verificar disponibilidad. Intenta de nuevo.");
      setSubmitting(false);
      return;
    }

    setBookedSlots(freshSlots ?? []);

    const start = toMinutes(startTime);
    const end = toMinutes(endTime);
    const stillOverlaps = (freshSlots ?? []).some((b: BookedSlot) => {
      if (b.check_in !== date) return false;
      const bStart = toMinutes(b.start_time ?? "00:00");
      const bEnd = toMinutes(b.end_time ?? "23:59");
      return slotsOverlap(start, end, bStart, bEnd);
    });

    if (stillOverlaps) {
      setError("Ese horario ya está ocupado. Elige otro.");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("cart_items").insert({
      user_id: userData.user.id,
      listing_id: listingId,
      check_in: date,
      check_out: date,
      start_time: startTime,
      end_time: endTime,
      guests: 1,
      price_per_night: price,
      total_price: total,
    });

    setSubmitting(false);

    if (insertError) {
      if (insertError.message.includes("exclude") || insertError.code === "23P01") {
        setError("Ya tienes ese horario para este espacio en tu carrito.");
      } else {
        setError(`No se pudo agregar al carrito: ${insertError.message}`);
      }
      return;
    }

    setSuccess(true);
    setStartTime("");
    setEndTime("");
  }

  const inputClass =
    "w-full rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white/40 focus:border-transparent transition-shadow";

  if (viewerRole && viewerRole !== "usuario") {
    return (
      <div className="sticky top-6 rounded-2xl border border-neutral-200 dark:border-slate-700 dark:bg-slate-900 shadow-lg p-6">
        <p className="text-lg font-semibold text-neutral-900 dark:text-white">
          {currency} {price} <span className="text-sm font-normal text-neutral-500 dark:text-slate-400">/ hora</span>
        </p>
        <div className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 px-4 py-3">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {viewerRole === "anfitrion"
              ? "Estás en tu cuenta de anfitrión. Para reservar un espacio necesitas una cuenta de usuario."
              : "Las cuentas de administrador no pueden reservar espacios."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-6 rounded-2xl border border-neutral-200 dark:border-slate-700 dark:bg-slate-900 shadow-lg p-6">
      <p className="text-lg font-semibold text-neutral-900 dark:text-white">
        {currency} {price}{" "}
        <span className="text-sm font-normal text-neutral-500 dark:text-slate-400">/ hora</span>
      </p>

      <div className="mt-4">
        <label className="block text-xs font-semibold text-neutral-700 dark:text-slate-300 mb-1">
          Día
        </label>
        <input
          type="date"
          value={date}
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => {
            setDate(e.target.value);
            setStartTime("");
            setEndTime("");
          }}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-slate-300 mb-1">
            Desde
          </label>
          <select
            value={startTime}
            onChange={(e) => {
              setStartTime(e.target.value);
              setEndTime("");
            }}
            disabled={!date}
            className={`${inputClass} disabled:opacity-50`}
          >
            <option value="">--:--</option>
            {TIME_SLOTS.filter((t) => t !== "21:00").map((t) => (
              <option key={t} value={t} disabled={isSlotTaken(t)}>
                {t} {isSlotTaken(t) ? "· ocupado" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-slate-300 mb-1">
            Hasta
          </label>
          <select
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            disabled={!startTime}
            className={`${inputClass} disabled:opacity-50`}
          >
            <option value="">--:--</option>
            {endTimeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={setFullDay}
        disabled={!date}
        className="mt-2 text-xs font-medium text-primary-600 hover:text-primary-700 disabled:opacity-40"
      >
        Usar todo el día (08:00 - 18:00)
      </button>

      {loadingSlots && (
        <p className="text-xs text-neutral-400 dark:text-slate-500 mt-3">Cargando disponibilidad...</p>
      )}

      {!loadingSlots && hasOverlap() && (
        <p className="text-xs text-[#FF385C] dark:text-red-400 mt-3">
          Ese horario ya está ocupado.
        </p>
      )}

      {durationHours > 0 && (
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-slate-700 space-y-1">
          <div className="flex justify-between text-sm text-neutral-700 dark:text-slate-300">
            <span>
              {currency} {price} x {durationHours} {durationHours === 1 ? "hora" : "horas"}
            </span>
            <span>{currency} {total}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-neutral-900 dark:text-white pt-1">
            <span>Total</span>
            <span>{currency} {total}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl bg-[#FFF0F1] dark:bg-red-950/30 border border-[#FFD3D8] dark:border-red-900/50 px-3 py-2">
          <p className="text-xs text-[#FF385C] dark:text-red-300 font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-xl bg-[#F0FAF0] dark:bg-green-950/30 border border-[#CDEECB] dark:border-green-900/50 px-3 py-2">
          <p className="text-xs text-[#008A05] dark:text-green-400 font-medium">
            ¡Agregado al carrito!{" "}
            <a href="/carrito/" className="underline font-semibold">
              Ir al carrito
            </a>
          </p>
        </div>
      )}

      <button
        onClick={handleAddToCart}
        disabled={submitting || loadingSlots || durationHours <= 0}
        className="w-full mt-4 bg-[#FF385C] hover:bg-[#E31C5F] text-white font-semibold rounded-xl px-4 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Agregando..." : "Agregar al carrito"}
      </button>
    </div>
  );
}

import { useState } from "react";
import { supabase } from "../lib/supabase/client";
import { StarRatingInput, StarRatingDisplay } from "./StarRating";

export default function GuestRatingButton({
  bookingId,
  guestId,
  existingRating,
  existingComment,
}: {
  bookingId: string;
  guestId: string;
  existingRating?: number | null;
  existingComment?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(existingRating ?? 0);
  const [comment, setComment] = useState(existingComment ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(existingRating != null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (rating < 1) {
      setError("Elige al menos una estrella.");
      return;
    }
    setSaving(true);
    setError(null);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setError("Tenés que iniciar sesión.");
      setSaving(false);
      return;
    }

    const { error: upsertError } = await supabase.from("guest_ratings").upsert(
      {
        booking_id: bookingId,
        host_id: userData.user.id,
        guest_id: guestId,
        rating,
        comment: comment.trim() || null,
      },
      { onConflict: "booking_id" }
    );

    setSaving(false);
    if (upsertError) {
      const isMissingTable = /relation .* does not exist/i.test(upsertError.message);
      setError(
        isMissingTable
          ? "Falta correr la migración 020_bio_y_calificacion_huespedes.sql en tu base de Supabase (la tabla guest_ratings no existe todavía)."
          : `No se pudo guardar: ${upsertError.message}`
      );
      return;
    }
    setSaved(true);
    setOpen(false);
  }

  if (saved && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
      >
        <StarRatingDisplay rating={rating} showCount={false} size="sm" animate={false} />
        Editar calificación
      </button>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition"
      >
        ⭐ Calificar a este huésped
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 p-3 space-y-2 w-full">
      <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
        ¿Cómo fue tu experiencia con este huésped?
      </p>
      <StarRatingInput value={rating} onChange={setRating} size="md" disabled={saving} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Comentario (opcional)"
        rows={2}
        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white resize-none"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar calificación"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={saving}
          className="text-xs font-medium px-3 py-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

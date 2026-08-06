import { useState } from "react";
import { supabase } from "../lib/supabase";

interface CancelBookingButtonProps {
  bookingId: string;
  onCancelled: () => void;
}

export default function CancelBookingButton({
  bookingId,
  onCancelled,
}: CancelBookingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    if (updateError) {
      setError("No se pudo cancelar. Intenta de nuevo.");
      setLoading(false);
      return;
    }

    setLoading(false);
    onCancelled();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-600">¿Cancelar esta reserva?</span>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="text-xs font-semibold text-white bg-[#FF385C] hover:bg-[#E31C5F] rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
        >
          {loading ? "Cancelando..." : "Sí, cancelar"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="text-xs font-medium text-neutral-600 hover:text-neutral-900"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setConfirming(true)}
        className="text-xs font-semibold text-neutral-700 hover:text-[#FF385C] border border-neutral-300 hover:border-[#FF385C] rounded-lg px-3 py-1.5 transition-colors"
      >
        Cancelar reserva
      </button>
      {error && <p className="text-xs text-[#FF385C] mt-1">{error}</p>}
    </div>
  );
}
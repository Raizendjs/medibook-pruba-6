import { useState } from "react";
import { supabase } from "../lib/supabase";

interface Listing {
  id: string;
  title: string;
  city: string | null;
  country: string;
  price: number;
  currency: string;
  status: string;
  coverUrl: string | null;
}

interface MyListingsListProps {
  initialListings: Listing[];
}

export default function MyListingsList({ initialListings }: MyListingsListProps) {
  const [listings, setListings] = useState(initialListings);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggleStatus(id: string, currentStatus: string) {
    setLoadingId(id);
    setError(null);
    const newStatus = currentStatus === "active" ? "inactive" : "active";

    const { error: updateError } = await supabase
      .from("listings")
      .update({ status: newStatus })
      .eq("id", id);

    if (updateError) {
      setError("No se pudo cambiar el estado. Intenta de nuevo.");
      setLoadingId(null);
      return;
    }

    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
    );
    setLoadingId(null);
  }

  async function handleDelete(id: string) {
    setLoadingId(id);
    setError(null);

    const { error: deleteError } = await supabase
      .from("listings")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(
        "No se pudo eliminar. Si tiene reservas asociadas, primero desactívala."
      );
      setLoadingId(null);
      setConfirmingDeleteId(null);
      return;
    }

    setListings((prev) => prev.filter((l) => l.id !== id));
    setLoadingId(null);
    setConfirmingDeleteId(null);
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-900 font-semibold">
          Aún no has publicado propiedades
        </p>
        <p className="text-neutral-500 text-sm mt-1">
          Publica tu primer espacio para empezar a recibir reservas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3  ">
      {error && (
        <div className="rounded-xl bg-[#FFF0F1] border border-[#FFD3D8] px-4 py-3">
          <p className="text-sm text-[#FF385C] font-medium">{error}</p>
        </div>
      )}

      {listings.map((listing) => (
        <div
          key={listing.id}
          className="flex gap-4 rounded-2xl border  border-neutral-200 dark:border-gray-200 p-4"
        >
          <div className="shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-neutral-100">
            {listing.coverUrl ? (
              <img
                src={listing.coverUrl}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                Sin foto
              </div>
            )}
          </div>

          <div className="flex-1  min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-neutral-900 dark:text-white truncate">
                {listing.title}
              </p>
              <span
                className={`shrink-0 text-xs font-medium  border rounded-full px-2.5 py-0.5 ${
                  listing.status === "active"
                    ? "bg-[#F0FAF0] text-[#008A05] border-[#CDEECB]"
                    : "bg-neutral-100 text-neutral-500  border-neutral-200"
                }`}
              >
                {listing.status === "active" ? "Activa" : "Inactiva"}
              </span>
            </div>

            <p className="text-sm text-neutral-500  dark:text-stone-200 mt-0.5">
              {listing.city ? `${listing.city}, ${listing.country}` : listing.country}
            </p>
            <p className="text-sm font-semibold mt-1">
              {listing.currency} {listing.price}{" "}
              <span className="font-normal text-neutral-500">/ noche</span>
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              
              <a   href={`/mis-propiedades/editar/${listing.id}/`}
                className="text-xs font-semibold text-neutral-900 border border-neutral-300 hover:border-neutral-900 rounded-lg px-3 py-1.5 transition-colors"
              >
                Editar
              </a>

              <button
                onClick={() => toggleStatus(listing.id, listing.status)}
                disabled={loadingId === listing.id}
                className="text-xs font-semibold text-neutral-700 border border-neutral-300 hover:border-neutral-900 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
              >
                {listing.status === "active" ? "Desactivar" : "Activar"}
              </button>

              
              <a    href={`/listings/${listing.id}/`}
                target="_blank"
                className="text-xs font-semibold text-neutral-700 border border-neutral-300 hover:border-neutral-900 rounded-lg px-3 py-1.5 transition-colors"
              >
                Ver pública
              </a>

              {confirmingDeleteId === listing.id ? (
                <span className="flex items-center gap-2">
                  <span className="text-xs text-neutral-600">¿Eliminar?</span>
                  <button
                    onClick={() => handleDelete(listing.id)}
                    disabled={loadingId === listing.id}
                    className="text-xs font-semibold text-white bg-[#FF385C] hover:bg-[#E31C5F] rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                  >
                    Sí, eliminar
                  </button>
                  <button
                    onClick={() => setConfirmingDeleteId(null)}
                    className="text-xs font-medium text-neutral-600 hover:text-neutral-900"
                  >
                    Volver
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmingDeleteId(listing.id)}
                  className="text-xs font-semibold text-[#FF385C] hover:underline"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
import { useState } from "react";
import { supabase } from "../lib/supabase";
import ImageUploader from "./ImageUploader";
import LocationPicker from "./LocationPicker";
import { LISTING_CATEGORIES } from "../lib/listingCategories";
import { GUAYAQUIL_ZONES } from "../lib/guayaquilZones";

interface ExistingImage {
  id: string;
  url: string;
}

interface EditListingFormProps {
  listingId: string;
  initial: {
    title: string;
    category: string | null;
    zone: string | null;
    description: string | null;
    price: number;
    currency: string;
    country: string;
    city: string | null;
    address: string | null;
    lat: number | null;
    lng: number | null;
  };
  initialImages: ExistingImage[];
}

export default function EditListingForm({
  listingId,
  initial,
  initialImages,
}: EditListingFormProps) {
  const [title, setTitle] = useState(initial.title);
  const [category, setCategory] = useState(initial.category ?? "otro");
  const [zone, setZone] = useState(initial.zone ?? "otro");
  const [description, setDescription] = useState(initial.description ?? "");
  const [price, setPrice] = useState(String(initial.price));
  const [currency, setCurrency] = useState(initial.currency);
  const country = "Ecuador";
  const [city] = useState("Guayaquil");
  const [address, setAddress] = useState(initial.address ?? "");
  const [lat, setLat] = useState<number | null>(initial.lat ?? null);
  const [lng, setLng] = useState<number | null>(initial.lng ?? null);
  const [locating, setLocating] = useState(false);
  const [locateMessage, setLocateMessage] = useState<string | null>(null);
  const [images, setImages] = useState(initialImages);
  const [newImageUrls, setNewImageUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function removeExistingImage(imageId: string) {
    const { error: deleteError } = await supabase
      .from("listing_images")
      .delete()
      .eq("id", imageId);

    if (deleteError) {
      setError("No se pudo quitar la imagen.");
      return;
    }

    setImages((prev) => prev.filter((img) => img.id !== imageId));
  }

  function detectMyLocation() {
    if (!navigator.geolocation) {
      setLocateMessage("Tu navegador no soporta geolocalización.");
      return;
    }
    setLocating(true);
    setLocateMessage(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          if (data?.display_name) setAddress(data.display_name);
        } catch {
          // El pin ya quedó ubicado aunque falle la geocodificación inversa.
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setLocateMessage("No pudimos obtener tu ubicación actual. Revisa los permisos del navegador.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const parsedPrice = parseFloat(price);
    if (!title || isNaN(parsedPrice) || parsedPrice <= 0 || !city) {
      setError("Título, precio válido y ciudad son obligatorios.");
      setSubmitting(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("listings")
      .update({
        title,
        category,
        zone,
        description,
        price: parsedPrice,
        currency,
        country,
        city,
        address,
        lat,
        lng,
      })
      .eq("id", listingId);

    if (updateError) {
      setError(`Error guardando cambios: ${updateError.message}`);
      setSubmitting(false);
      return;
    }

    if (newImageUrls.length > 0) {
      const startIndex = images.length;
      const imageRows = newImageUrls.map((url, index) => ({
        listing_id: listingId,
        url,
        order_index: startIndex + index,
      }));

      const { error: imagesError } = await supabase
        .from("listing_images")
        .insert(imageRows);

      if (imagesError) {
        setError(`Cambios guardados, pero hubo un error con las imágenes nuevas: ${imagesError.message}`);
        setSubmitting(false);
        return;
      }
    }

    setSuccess(true);
    setSubmitting(false);
    setNewImageUrls([]);
  }

  const fieldBase =
    "rounded-xl border border-neutral-300 dark:border-neutral-600 px-4 py-3 text-sm text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-shadow";
  const inputClass = `w-full ${fieldBase}`;
  const labelClass = "block text-sm font-semibold text-neutral-900 dark:text-white mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-5">
        <div>
          <label className={labelClass}>Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className={labelClass}>Tipo de espacio</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            {LISTING_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Zona de Guayaquil</label>
          <select
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className={inputClass}
          >
            {GUAYAQUIL_ZONES.map((z) => (
              <option key={z.value} value={z.value}>
                {z.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} resize-none`}
            rows={4}
          />
        </div>
      </section>

      <hr className="border-neutral-200 dark:border-neutral-700" />

      <section>
        <label className={labelClass}>Precio por hora</label>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm dark:text-neutral-400">
              $
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))}
              className={`w-full ${fieldBase} pl-8`}
              required
            />
          </div>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={`w-28 shrink-0 ${fieldBase}`}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </section>

      <hr className="border-neutral-200 dark:border-neutral-700" />

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-neutral-900 dark:text-white">Ubicación</p>
          <button
            type="button"
            onClick={detectMyLocation}
            disabled={locating}
            className="text-xs font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1 disabled:opacity-50 dark:text-neutral-300 dark:hover:text-white"
          >
            {locating ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-neutral-300 border-t-neutral-700 rounded-full animate-spin dark:border-neutral-600" />
                Detectando...
              </>
            ) : (
              <>📍 Usar mi ubicación actual</>
            )}
          </button>
        </div>
        {locateMessage && <p className="text-xs text-amber-600">{locateMessage}</p>}

        <div className="flex gap-3">
          <div className="flex-1">
            <label className={labelClass}>País</label>
            <div className={`${inputClass} bg-neutral-100 text-neutral-500 flex items-center gap-2 cursor-not-allowed select-none`}>
              🇪🇨 <span>Ecuador</span>
            </div>
          </div>
          <div className="flex-1">
            <label className={labelClass}>Ciudad</label>
            <div className={`${inputClass} bg-neutral-100 text-neutral-500 flex items-center gap-2 cursor-not-allowed select-none`}>
              📍 <span>Guayaquil</span>
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>Dirección</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={inputClass}
          />
        </div>

      </section>

      <hr className="border-neutral-200 dark:border-neutral-700" />

      <section>
        <LocationPicker
          lat={lat}
          lng={lng}
          address={address}
          city={city}
          country={country}
          onChange={(newLat, newLng) => {
            setLat(newLat);
            setLng(newLng);
          }}
        />
      </section>

      <hr className="border-neutral-200 dark:border-neutral-700" />

      <section>
        <label className="block text-sm font-semibold text-neutral-900 mb-3 dark:text-white">
          Fotos actuales
        </label>
        {images.length === 0 ? (
          <p className="text-sm text-neutral-500 mb-4 dark:text-neutral-400">No tienes fotos todavía.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
            {images.map((img) => (
              <div key={img.id} className="relative group aspect-square">
                <img
                  src={img.url}
                  alt=""
                  className="w-full h-full object-cover rounded-xl shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(img.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow opacity-0 group-hover:opacity-100 transition-opacity dark:bg-neutral-900/85 dark:text-neutral-300"
                  aria-label="Quitar foto"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <ImageUploader
          onImagesUploaded={(urls) => setNewImageUrls((prev) => [...prev, ...urls])}
        />
      </section>

      {error && (
        <div className="rounded-xl bg-[#FFF0F1] border border-[#FFD3D8] px-4 py-3">
          <p className="text-sm text-[#FF385C] font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-[#F0FAF0] border border-[#CDEECB] px-4 py-3">
          <p className="text-sm text-[#008A05] font-medium">
            ¡Cambios guardados con éxito!
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white font-semibold rounded-xl px-4 py-3.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
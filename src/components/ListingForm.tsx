import { useEffect, useState } from "react";
import { LISTING_CATEGORIES } from "../lib/listingCategories";
import { GUAYAQUIL_ZONES } from "../lib/guayaquilZones";
import { supabase } from "../lib/supabase";
import ImageUploader from "./ImageUploader";
import LocationPicker from "./LocationPicker";

export default function ListingForm() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("otro");
  const [zone, setZone] = useState<string>("otro");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [city] = useState("Guayaquil");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(true);
  const [locateMessage, setLocateMessage] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const country = "Ecuador";

  // Al abrir el formulario, intentamos ubicar automáticamente la
  // propiedad en el mapa con la ubicación actual del navegador, y
  // rellenamos la dirección y ciudad usando geocodificación inversa
  // (OpenStreetMap/Nominatim, gratis). El usuario siempre puede
  // ajustar el pin o cambiar la ciudad manualmente después.
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocating(false);
      setLocateMessage("Tu navegador no soporta geolocalización. Marca la ubicación manualmente en el mapa.");
      return;
    }

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
          if (data?.display_name) {
            setAddress(data.display_name);
          }
        } catch {
          // Si falla la geocodificación inversa, dejamos que el usuario
          // escriba la dirección manualmente; el pin ya quedó ubicado.
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setLocateMessage(
          "No pudimos obtener tu ubicación automáticamente. Selecciona tu ciudad y marca el punto en el mapa."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setError("Debes iniciar sesión para publicar una propiedad.");
      setSubmitting(false);
      return;
    }

    if (!title || !price || !city) {
      setError("Título, precio y ciudad son obligatorios.");
      setSubmitting(false);
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError("Ingresa un precio válido.");
      setSubmitting(false);
      return;
    }

    if (lat == null || lng == null) {
      setError("Marca la ubicación de la propiedad en el mapa antes de publicar.");
      setSubmitting(false);
      return;
    }

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .insert({
        host_id: userData.user.id,
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
        status: "active",
      })
      .select()
      .single();

    if (listingError || !listing) {
      setError(`Error creando la propiedad: ${listingError?.message}`);
      setSubmitting(false);
      return;
    }

    if (imageUrls.length > 0) {
      const imageRows = imageUrls.map((url, index) => ({
        listing_id: listing.id,
        url,
        order_index: index,
      }));

      const { error: imagesError } = await supabase
        .from("listing_images")
        .insert(imageRows);

      if (imagesError) {
        setError(`Propiedad creada, pero hubo un error con las imágenes: ${imagesError.message}`);
        setSubmitting(false);
        return;
      }
    }

    setSuccess(true);
    setSubmitting(false);
    setTitle("");
    setDescription("");
    setPrice("");
    setAddress("");
    setLat(null);
    setLng(null);
    setImageUrls([]);
  }

  const fieldBase =
    "rounded-xl border border-neutral-300 dark:border-neutral-600 px-4 py-3 text-sm text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-shadow";
  const inputClass = `w-full ${fieldBase}`;
  const labelClass = "block text-sm font-semibold text-neutral-900 dark:text-white mb-1.5";

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight dark:text-white">
          Publica tu espacio
        </h1>
        <p className="text-sm text-neutral-500 mt-1 dark:text-neutral-400">
          Completa los detalles y súbelo en minutos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="space-y-5">
          <div>
            <label className={labelClass}>Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Depto luminoso cerca de la playa"
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
              placeholder="Cuéntale a tus huéspedes qué hace especial este lugar..."
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
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                  setPrice(cleaned);
                }}
                placeholder="0"
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
          <p className="text-sm font-semibold text-neutral-900 dark:text-white">Ubicación</p>

          {locating && (
            <p className="text-xs text-neutral-500 flex items-center gap-1.5 dark:text-neutral-400">
              <span className="inline-block w-3 h-3 border-2 border-neutral-300 border-t-neutral-700 rounded-full animate-spin dark:border-neutral-600" />
              Detectando tu ubicación actual...
            </p>
          )}
          {locateMessage && !locating && (
            <p className="text-xs text-amber-600">{locateMessage}</p>
          )}

          <div className="flex gap-3">
            <div className="flex-1">
              <label className={labelClass}>País</label>
              <div className={`${inputClass} bg-neutral-100 text-neutral-500 flex items-center gap-2 cursor-not-allowed select-none`}>
                🇪🇨 <span>Ecuador</span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 dark:text-neutral-500">Por ahora solo publicamos propiedades en Ecuador.</p>
            </div>
            <div className="flex-1">
              <label className={labelClass}>Ciudad</label>
              <div className={`${inputClass} bg-neutral-100 text-neutral-500 flex items-center gap-2 cursor-not-allowed select-none`}>
                📍 <span>Guayaquil</span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 dark:text-neutral-500">Elige la zona más abajo.</p>
            </div>
          </div>

          <div>
            <label className={labelClass}>Dirección</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Calle y número"
              className={inputClass}
            />
            <p className="text-xs text-neutral-400 mt-1 dark:text-neutral-500">
              Se autocompleta con tu ubicación, pero puedes corregirla.
            </p>
          </div>

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
          <ImageUploader
            onImagesUploaded={(urls) => setImageUrls((prev) => [...prev, ...urls])}
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
              ¡Propiedad publicada con éxito!
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white font-semibold rounded-xl px-4 py-3.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Publicando..." : "Publicar propiedad"}
        </button>
      </form>
    </div>
  );
}

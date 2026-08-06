import { useEffect, useRef, useState } from "react";

let leafletLoadingPromise: Promise<any> | null = null;

function loadLeaflet(): Promise<any> {
  if ((window as any).L) return Promise.resolve((window as any).L);
  if (leafletLoadingPromise) return leafletLoadingPromise;

  leafletLoadingPromise = new Promise((resolve, reject) => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const existing = document.getElementById("leaflet-js") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).L));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.id = "leaflet-js";
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => resolve((window as any).L);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return leafletLoadingPromise;
}

// Mensaje de error legible según el motivo real por el que falló la
// geolocalización del navegador (no todos los "no funciona" son lo mismo).
function describeGeoError(err: GeolocationPositionError): string {
  const insecure =
    typeof window !== "undefined" &&
    window.location.protocol !== "https:" &&
    window.location.hostname !== "localhost";

  if (insecure) {
    return "Tu navegador bloquea la ubicación porque este sitio no se está abriendo en https://. Accede a la página con https para poder usar tu ubicación.";
  }
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "Bloqueaste el permiso de ubicación para este sitio. Actívalo desde el ícono de candado/información en la barra de direcciones de tu navegador y vuelve a intentarlo.";
    case err.POSITION_UNAVAILABLE:
      return "Tu dispositivo no pudo determinar tu posición ahora mismo. Intenta de nuevo o marca el punto manualmente en el mapa.";
    case err.TIMEOUT:
      return "Tardó demasiado en obtener tu ubicación. Intenta de nuevo o marca el punto manualmente en el mapa.";
    default:
      return "No pudimos obtener tu ubicación. Marca el punto manualmente en el mapa.";
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await res.json();
    return data?.display_name ?? null;
  } catch {
    return null;
  }
}

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  address?: string;
  city?: string;
  country?: string;
  onChange: (lat: number, lng: number) => void;
  onAddressResolved?: (address: string) => void;
  /** Si es true, apenas se monta intenta ubicar automáticamente al usuario (solo si no hay lat/lng todavía). */
  autoLocate?: boolean;
}

export default function LocationPicker({
  lat,
  lng,
  address,
  city,
  country,
  onChange,
  onAddressResolved,
  autoLocate = false,
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    lat != null && lng != null ? { lat, lng } : null
  );

  useEffect(() => {
    let cancelled = false;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapRef.current) return;

        const initialCenter: [number, number] = coords
          ? [coords.lat, coords.lng]
          : [-1.8312, -78.1834]; // Centro de Ecuador, por defecto

        const map = L.map(mapRef.current, {
          center: initialCenter,
          zoom: coords ? 15 : 6,
        });
        mapInstance.current = map;

        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          attribution: "&copy; OpenStreetMap &copy; CARTO",
          maxZoom: 19,
        }).addTo(map);

        const marker = L.marker(initialCenter, { draggable: true }).addTo(map);
        markerInstance.current = marker;

        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          handleNewPoint(pos.lat, pos.lng);
        });

        map.on("click", (e: any) => {
          marker.setLatLng(e.latlng);
          handleNewPoint(e.latlng.lat, e.latlng.lng);
        });

        setTimeout(() => map.invalidateSize(), 150);

        // Auto-ubicar apenas se monta el mapa, si se pidió y todavía no
        // hay un punto marcado (típico al crear una propiedad nueva).
        if (autoLocate && !coords) {
          locateMe(true);
        }
      })
      .catch(() => setSearchError("No se pudo cargar el mapa. Revisa tu conexión."));

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function moveTo(newLat: number, newLng: number, zoom = 16) {
    setCoords({ lat: newLat, lng: newLng });
    if (mapInstance.current && markerInstance.current) {
      mapInstance.current.setView([newLat, newLng], zoom);
      markerInstance.current.setLatLng([newLat, newLng]);
    }
  }

  // Cada vez que el punto cambia (click, drag, búsqueda o geolocalización)
  // avisamos al padre Y tratamos de rellenar la dirección automáticamente.
  async function handleNewPoint(newLat: number, newLng: number) {
    setCoords({ lat: newLat, lng: newLng });
    onChange(newLat, newLng);
    if (onAddressResolved) {
      const resolved = await reverseGeocode(newLat, newLng);
      if (resolved) onAddressResolved(resolved);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = searchQuery.trim() || [address, city, country].filter(Boolean).join(", ");
    if (!query) {
      setSearchError("Escribe una dirección para buscar.");
      return;
    }

    setSearching(true);
    setSearchError(null);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
      );
      const results = await res.json();

      if (!results || results.length === 0) {
        setSearchError(
          "No encontramos esa dirección. Prueba con otra o marca el punto directamente en el mapa."
        );
        return;
      }

      const foundLat = parseFloat(results[0].lat);
      const foundLng = parseFloat(results[0].lon);
      moveTo(foundLat, foundLng);
      onChange(foundLat, foundLng);
      if (onAddressResolved && results[0].display_name) {
        onAddressResolved(results[0].display_name);
      }
    } catch {
      setSearchError("No se pudo buscar la dirección. Intenta de nuevo.");
    } finally {
      setSearching(false);
    }
  }

  function locateMe(silent = false) {
    if (!navigator.geolocation) {
      if (!silent) setSearchError("Tu navegador no soporta geolocalización.");
      return;
    }
    setLocating(true);
    if (!silent) setSearchError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        moveTo(latitude, longitude);
        handleNewPoint(latitude, longitude);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        // En modo silencioso (auto-ubicar al montar) no mostramos error:
        // es normal que el navegador no tenga permiso todavía y el
        // usuario puede marcar el punto manualmente sin problema.
        if (!silent) setSearchError(describeGeoError(err));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-neutral-900">Ubicación en el mapa</p>
        <button
          type="button"
          onClick={() => locateMe(false)}
          disabled={locating}
          className="text-xs font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1 disabled:opacity-50"
        >
          {locating ? "Ubicando..." : "📍 Usar mi ubicación actual"}
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar dirección para ubicarla en el mapa..."
          className="flex-1 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={searching}
          className="shrink-0 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-medium hover:border-neutral-900 transition-colors disabled:opacity-50"
        >
          {searching ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {searchError && (
        <p className="text-xs text-[#FF385C] bg-[#FFF0F1] border border-[#FFD3D8] rounded-lg px-3 py-2">
          {searchError}
        </p>
      )}

      <div
        ref={mapRef}
        className="relative isolate w-full h-[280px] rounded-xl overflow-hidden border border-neutral-300 bg-neutral-100"
      />

      <p className="text-xs text-neutral-500">
        {coords
          ? `📍 Pin ubicado en ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}. Puedes arrastrar el pin o hacer click en el mapa para ajustarlo.`
          : "Usa tu ubicación actual, busca una dirección, o haz click directamente en el mapa para marcar dónde está la propiedad."}
      </p>
    </div>
  );
}

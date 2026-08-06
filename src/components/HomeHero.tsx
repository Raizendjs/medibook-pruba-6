import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { supabase } from "../lib/supabase";

interface ListingPoint {
  id: string;
  title: string;
  price: number;
  currency: string;
  lat: number;
  lng: number;
  coverUrl: string | null;
  rating: number | null;
  reviewCount: number;
  city: string | null;
  country: string;
  distanceKm?: number | null;
}

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

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function HomeHero() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [points, setPoints] = useState<ListingPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Animación de entrada del hero (badge, título, texto, botón en cascada,
  // el mapa aparece con un leve zoom-in).
  useEffect(() => {
    const items = gsap.utils.toArray<HTMLElement>(".hero-anim");
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(
      items,
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 0.7, stagger: 0.12 }
    ).fromTo(
      ".hero-anim-map",
      { opacity: 0, scale: 0.96 },
      { opacity: 1, scale: 1, duration: 0.8 },
      "-=0.5"
    );
    return () => {
      tl.kill();
    };
  }, []);

  // Carga inicial: propiedades activas con ubicación, más sus reseñas.
  useEffect(() => {
    async function load() {
      const { data: listings } = await supabase
        .from("listings")
        .select("id, title, price, currency, city, country, lat, lng, listing_images(url, order_index)")
        .eq("status", "active")
        .not("lat", "is", null)
        .not("lng", "is", null)
        .order("created_at", { ascending: false })
        .limit(40);

      const ids = (listings ?? []).map((l: any) => l.id);
      const { data: reviews } = ids.length
        ? await supabase.from("reviews").select("listing_id, rating").in("listing_id", ids)
        : { data: [] as any[] };

      const ratingsMap: Record<string, { avg: number; count: number }> = {};
      (reviews ?? []).forEach((r: any) => {
        const b = ratingsMap[r.listing_id] ?? { avg: 0, count: 0 };
        b.avg = (b.avg * b.count + r.rating) / (b.count + 1);
        b.count += 1;
        ratingsMap[r.listing_id] = b;
      });

      const mapped: ListingPoint[] = (listings ?? []).map((l: any) => {
        const sorted = [...(l.listing_images ?? [])].sort((a: any, b: any) => a.order_index - b.order_index);
        return {
          id: l.id,
          title: l.title,
          price: l.price,
          currency: l.currency,
          city: l.city,
          country: l.country,
          lat: l.lat,
          lng: l.lng,
          coverUrl: sorted[0]?.url ?? null,
          rating: ratingsMap[l.id]?.avg ?? null,
          reviewCount: ratingsMap[l.id]?.count ?? 0,
        };
      });

      setPoints(mapped);
      setLoading(false);
    }
    load();
  }, []);

  // Dibuja/actualiza el mapa cuando cambian los puntos o la ubicación.
  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !mapRef.current) return;

      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }

      const GUAYAQUIL: [number, number] = [-2.1894, -79.8891];
      const center = userLocation ? [userLocation.lat, userLocation.lng] : GUAYAQUIL;

      const map = L.map(mapRef.current, {
        center,
        zoom: userLocation ? 13 : 12,
        zoomControl: true,
        scrollWheelZoom: true,
      });
      mapInstance.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap &copy; CARTO",
        maxZoom: 19,
      }).addTo(map);

      if (userLocation) {
        const userIcon = L.divIcon({
          className: "",
          html: '<div style="width:16px;height:16px;border-radius:9999px;background:#2563eb;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map).bindPopup("Tu ubicación");
      }

      const bounds: [number, number][] = userLocation ? [[userLocation.lat, userLocation.lng]] : [];

      points.forEach((p) => {
        const priceIcon = L.divIcon({
          className: "",
          html: `<div style="background:#111827;color:white;font-size:11px;font-weight:600;padding:4px 8px;border-radius:9999px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.3);display:inline-block">${p.currency} ${p.price}</div>`,
          iconAnchor: [20, 10],
        });
        const ratingHtml = p.rating ? `★ ${p.rating.toFixed(2)}` : "Nuevo";
        const popupHtml = `
          <a href="/listings/${p.id}/" style="display:block;width:200px;text-decoration:none;color:inherit;font-family:inherit">
            ${p.coverUrl ? `<img src="${p.coverUrl}" style="width:100%;height:120px;object-fit:cover;border-radius:10px;margin-bottom:6px" />` : ""}
            <div style="font-size:13px;font-weight:600;color:#111827;line-height:1.3">${p.title}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:2px">${ratingHtml}</div>
            <div style="font-size:13px;color:#111827;margin-top:4px"><strong>${p.currency} ${p.price}</strong> / hora</div>
          </a>`;
        L.marker([p.lat, p.lng], { icon: priceIcon }).addTo(map).bindPopup(popupHtml, { maxWidth: 220 });
        bounds.push([p.lat, p.lng]);
      });

      // Antes solo encuadraba todas las propiedades si ya tenías la
      // geolocalización activada — si no, el mapa se quedaba centrado en un
      // punto fijo de Guayaquil y varias propiedades podían quedar fuera de
      // la vista. Ahora siempre encuadra lo que haya (propiedades y, si la
      // hay, tu ubicación) para que todo sea visible desde el primer momento.
      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [points, userLocation]);

  const nearbyPoints = userLocation
    ? [...points]
        .map((p) => ({ ...p, distanceKm: distanceKm(userLocation.lat, userLocation.lng, p.lat, p.lng) }))
        .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
    : points;

  function findNearMe() {
    setLocateError(null);
    if (!navigator.geolocation) {
      setLocateError("Tu navegador no soporta geolocalización.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocateError("Bloqueaste el permiso de ubicación. Actívalo en el ícono 🔒 junto a la URL.");
        } else if (err.code === err.TIMEOUT) {
          setLocateError("Tardó demasiado en obtener tu ubicación. Intenta de nuevo.");
        } else {
          setLocateError("No pudimos obtener tu ubicación en este momento.");
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }

  // Antes SOLO se pedía la ubicación si tocabas el botón — ahora se intenta
  // una vez, sola, al entrar a la página. Si el usuario ya había bloqueado
  // el permiso antes, el navegador falla rápido y en silencio (no vuelve a
  // preguntar), así que esto no molesta a nadie que ya dijo que no.
  useEffect(() => {
    findNearMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-950">
      <div className="relative px-5 md:px-16 pt-28 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="hero-anim inline-flex items-center gap-1.5 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 text-xs font-semibold px-3 py-1.5 mb-5">
              ✦ Espacios médicos verificados en Guayaquil
            </span>
            <h1 className="hero-anim text-4xl sm:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-[1.05]">
              Tu consultorio, listo cuando lo necesitas en{" "}
              <span className="bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
                Medibookit
              </span>
            </h1>
            <p className="hero-anim text-neutral-600 dark:text-slate-400 mt-5 text-base sm:text-lg leading-relaxed max-w-xl">
              Reserva consultorios médicos, dentales y de fisioterapia por hora en Guayaquil —
              sin arriendos fijos, sin exclusividad. Encuentra el espacio verificado más cercano,
              agenda en minutos y paga solo por las horas que uses.
            </p>

            <button
              type="button"
              onClick={findNearMe}
              disabled={locating}
              className="hero-anim mt-8 inline-flex items-center gap-2 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-6 py-3.5 text-sm font-semibold shadow-lg shadow-neutral-900/10 hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              <span>📍</span>
              {locating ? "Buscando tu ubicación..." : "Encuentra espacios médicos cerca mío"}
            </button>
            {locateError && <p className="text-xs text-[#FF385C] mt-2">{locateError}</p>}
          </div>

          <div className="hero-anim-map rounded-3xl overflow-hidden border border-neutral-200 dark:border-slate-700 shadow-2xl shadow-neutral-900/10">
            <div ref={mapRef} className="relative isolate w-full h-[420px] bg-neutral-100 dark:bg-slate-800" />
          </div>
        </div>

        <div className="mt-14">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight mb-5">
            {userLocation ? "Espacios cerca de ti" : "Alojamientos cercanos"}
          </h2>

          {loading ? (
            <p className="text-sm text-neutral-400">Cargando...</p>
          ) : nearbyPoints.length === 0 ? (
            <p className="text-sm text-neutral-400">Todavía no hay propiedades con ubicación cargada.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-8">
              {nearbyPoints.slice(0, 12).map((p) => (
                <a key={p.id} href={`/listings/${p.id}/`} className="group block">
                  <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-neutral-100">
                    {p.coverUrl ? (
                      <img
                        src={p.coverUrl}
                        alt={p.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-neutral-400 text-sm">
                        Sin foto
                      </div>
                    )}
                    {typeof p.distanceKm === "number" && (
                      <span className="absolute top-2 left-2 rounded-full bg-white/95 backdrop-blur px-2.5 py-1 text-[11px] font-semibold text-neutral-900 shadow-sm flex items-center gap-1">
                        📍 {p.distanceKm < 1 ? `${Math.round(p.distanceKm * 1000)} m` : `${p.distanceKm.toFixed(1)} km`}
                      </span>
                    )}
                  </div>
                  <div className="mt-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{p.title}</p>
                      <span className="shrink-0 text-sm text-neutral-900 dark:text-white">
                        {p.rating ? `★ ${p.rating.toFixed(2)}` : <span className="text-neutral-500">Nuevo</span>}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-slate-400">
                      {p.city ? `${p.city}, ${p.country}` : p.country}
                    </p>
                    <p className="text-sm text-neutral-900 dark:text-white mt-1">
                      <span className="font-semibold">{p.currency} {p.price}</span>
                      <span className="text-neutral-500"> / hora</span>
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

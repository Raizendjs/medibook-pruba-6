// Ciudades principales de Ecuador con su coordenada aproximada (centro
// urbano). Se usa para el selector de ciudad en el formulario de
// propiedades y como respaldo cuando la geolocalización del navegador
// falla (el usuario elige su ciudad y usamos ese centro como referencia).
export const ECUADOR_CITIES = [
  { name: "Quito", lat: -0.1807, lng: -78.4678 },
  { name: "Guayaquil", lat: -2.1894, lng: -79.8891 },
  { name: "Cuenca", lat: -2.9006, lng: -79.0045 },
  { name: "Santo Domingo", lat: -0.2532, lng: -79.1750 },
  { name: "Machala", lat: -3.2581, lng: -79.9553 },
  { name: "Durán", lat: -2.1710, lng: -79.8320 },
  { name: "Manta", lat: -0.9677, lng: -80.7089 },
  { name: "Portoviejo", lat: -1.0546, lng: -80.4545 },
  { name: "Ambato", lat: -1.2417, lng: -78.6197 },
  { name: "Riobamba", lat: -1.6636, lng: -78.6546 },
  { name: "Quevedo", lat: -1.0225, lng: -79.4608 },
  { name: "Loja", lat: -3.9931, lng: -79.2042 },
  { name: "Ibarra", lat: 0.3517, lng: -78.1223 },
  { name: "Milagro", lat: -2.1349, lng: -79.5945 },
  { name: "Esmeraldas", lat: 0.9592, lng: -79.6540 },
  { name: "Babahoyo", lat: -1.8021, lng: -79.5346 },
  { name: "Latacunga", lat: -0.9333, lng: -78.6167 },
  { name: "Salinas", lat: -2.2109, lng: -80.9560 },
  { name: "Playas (General Villamil)", lat: -2.6333, lng: -80.3833 },
  { name: "Tena", lat: -0.9948, lng: -77.8135 },
  { name: "Puyo", lat: -1.4924, lng: -77.9847 },
  { name: "Nueva Loja (Lago Agrio)", lat: 0.0847, lng: -76.8867 },
  { name: "Azogues", lat: -2.7411, lng: -78.8469 },
  { name: "Otavalo", lat: 0.2340, lng: -78.2622 },
  { name: "Baños de Agua Santa", lat: -1.3928, lng: -78.4269 },
  { name: "Montañita", lat: -1.8422, lng: -80.7418 },
  { name: "Galápagos (Puerto Ayora)", lat: -0.7393, lng: -90.3145 },
] as const;

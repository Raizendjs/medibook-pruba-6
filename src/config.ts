// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'Medibookit';
export const SITE_DESCRIPTION =
  'Reserva consultorios médicos, dentales y de fisioterapia por hora en Guayaquil. Espacios verificados, disponibilidad en tiempo real y reserva en minutos.';
// ⚠️ Reemplaza por tu dominio real de producción cuando lo tengas.
export const SITE_URL = 'https://medibookit.com';
export const REPOSITORY_URL = '';

// Brand Settings
export const BRAND_NAME = 'Medibookit';
export const BRAND_LOGO_TEXT = 'M';

// Datos de contacto (usados en el footer y en el structured data / JSON-LD)
// ⚠️ Rellena con los datos reales de Medibookit (aún tienen placeholders).
export const CONTACT_INFO = {
  addressStreet: 'Tu dirección aquí',
  addressExtra: '',
  city: 'Guayaquil',
  region: 'Guayas',
  country: 'EC',
  phoneDisplay: '(+593) 00 000 0000',
  phoneE164: '+593000000000',
  website: SITE_URL,
};

// Social Links
// ⚠️ Estaban apuntando a las redes del autor original de la plantilla —
// las dejo vacías hasta que pongas las cuentas reales de Medibookit.
export const SOCIAL_LINKS = {
  twitter: '',
  github: '',
  linkedin: '',
};

// Navigation Links
export const NAV_LINKS = [
  { href: '/', label: 'Inicio' },

  {
    href: '/servicios/',
    label: 'Servicios',
    children: [
      {
        href: '/servicios/contentseries/',
        label: 'Contentseries'
      },
      {
        href: '/servicios/podcastcorporativo/',
        label: 'Codcast Corporativo'
      },
      {
        href: '/servicios/transmisionescoberturas/',
        label: 'Transmisiones y Coberturas'
      },
      {
        href: '/servicios/produccionaudiovisual/',
        label: 'Produccion audiovisual'
      },
      {
        href: '/servicios/estrategiacomunicacion/',
        label: 'Estrategia de comunicacion'
      },
      {
        href: '/servicios/marketingcontenidos/',
        label: 'Marketing de contenidos'
      },
      {
        href: '/servicios/dossiersestrategicos/',
        label: 'Dossiers estrategicos'
      },
      {
        href: '/servicios/desarrolloweb/',
        label: 'Desarrollo web'
      },
      {
        href: '/servicios/desarrolloaplicaciones/',
        label: 'Desarrollo de Aplicaciones'
      },
      {
        href: '/servicios/posicionamientoseo/',
        label: 'Posicionamiento seo'
      },


    ]
  },

  { href: '/casos/', label: 'Casos' },
  { href: '/contactos/', label: 'Contactos' },
  { href: '/blog/', label: 'Blog' }
];

// Footer Links
// 4 columnas con contenido pensado para Medibookit (alquiler de espacios médicos):
// navegación general, oferta para profesionales de salud, recursos y legal.
export const FOOTER_LINKS = [
  {
    title: 'Navegación',
    links: [
      { label: 'Inicio', href: '/' },
      { label: 'Espacios disponibles', href: '/espacios/' },
      { label: 'Cómo funciona', href: '/como-funciona/' },
      { label: 'Precios', href: '/precios/' },
    ],
  },
  {
    title: 'Para profesionales',
    links: [
      { label: 'Publica tu espacio', href: '/publica-tu-espacio/' },
      { label: 'Requisitos', href: '/requisitos/' },
      { label: 'Verificación de médicos', href: '/verificacion/' },
      { label: 'Recursos para anfitriones', href: '/recursos-anfitriones/' },
    ],
  },
  {
    title: 'Recursos',
    links: [
      { label: 'Blog', href: '/blog/' },
      { label: 'Centro de ayuda', href: '/ayuda/' },
      { label: 'Preguntas frecuentes', href: '/faq/' },
      { label: 'Contacto', href: '/contactos/' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Política de privacidad', href: '/privacidad/' },
      { label: 'Términos y condiciones', href: '/terminos/' },
      { label: 'Política de cookies', href: '/cookies/' },
    ],
  },
];
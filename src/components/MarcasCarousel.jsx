const marcas = [
  { nombre: "Marca 1", logo: "/Bancoguayaquil.svg" },
  { nombre: "Marca 2", logo: "/bancobolivaiano.svg" },
  { nombre: "Marca 3", logo: "/bancopasifico.svg" },
  { nombre: "Marca 4", logo: "/bancopichincha.svg" },
  { nombre: "Marca 5", logo: "/MEGAMAXI.svg" },
  { nombre: "Marca 6", logo: "/SUPERMAXI.svg" },
  { nombre: "Marca 7", logo: "/uees.svg" },
  { nombre: "Marca 8", logo: "/Ecotec.svg" },
];

const items = [...marcas, ...marcas, ...marcas];

export default function MarcasCarousel() {
  return (
    <section
      style={{
        width: "100%",
        padding: "4rem 0",
        overflow: "hidden",
        fontFamily: "inherit",
      }}
    >
      <style>{`
        @keyframes scrollLeft {
          from { transform: translateX(0); }
          to { transform: translateX(-33.333%); }
        }

        .mc-track {
          display:flex;
          align-items:center;
          width:max-content;
          animation:scrollLeft 22s linear infinite;
        }

        /* PAUSA SIN REACT */
        .mc-track:hover{
          animation-play-state:paused;
        }

        .mc-item{
          display:flex;
          align-items:center;
          justify-content:center;
          padding:0 48px;
          border-right:1px solid #e2e8f0;
          flex-shrink:0;
          opacity:.45;
          filter:grayscale(1);
          transition:.25s;
        }

        .mc-item:hover{
          opacity:1;
          filter:grayscale(0);
        }

        .mc-item img{
          height:36px;
          width:auto;
          display:block;
          object-fit:contain;
          user-select:none;
          pointer-events:none;
        }

      
      `}</style>

      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          textAlign: "center",
          paddingBottom: 36,
          paddingInline: 24,
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: ".15em",
            textTransform: "uppercase",
            color: "#b91c1c",
            marginBottom: 10,
          }}
        >
          Confían en nosotros
        </p>

        <h2 className="text-black dark:text-white uppercase"
          style={{
            fontSize: "clamp(1.6rem,3.5vw,2.4rem)",
            fontWeight: 800,
            margin: 0,
          }}
        >
          Marcas que confían en Forever Studio
        </h2>

        <p 
        className="text-black dark:text-stone-500"
          style={{
            marginTop: 12,
            
            maxWidth: 420,
            marginInline: "auto",
          }}
        >
          Empresas de toda Latinoamérica que decidieron comunicar mejor.
        </p>
      </div>

      <div
        style={{
          position: "relative",
          width: "100%",
          overflow: "hidden",
        }}
      >
        <div
          className="mc-fade-left"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 80,
            zIndex: 2,
            pointerEvents: "none",
          }}
        />

        <div className="mc-track" style={{ padding: "8px 0" }}>
          {items.map((marca, i) => (
            <div key={i} className="mc-item">
              <img
                src={marca.logo}
                alt={marca.nombre}
                draggable={false}
                loading="eager"
              />
            </div>
          ))}
        </div>

        <div
          className="mc-fade-right"
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 80,
            zIndex: 2,
            pointerEvents: "none",
          }}
        />
      </div>
    </section>
  );
}
import { useEffect, useRef, useState } from "react";

const CARDS = [
  {
    id: "reputacion",
    icon: "📈",
    iconBg: "#FCEBEB",
    iconColor: "#A32D2D",
    barColor: "#E24B4A",
    target: 70,
    suffix: "%",
    prefix: "+",
    bar: 70,
    label: "Mejora en reputación de marca",
  },
  {
    id: "interaccion",
    icon: "👥",
    iconBg: "#E6F1FB",
    iconColor: "#185FA5",
    barColor: "#378ADD",
    target: 200,
    suffix: "%",
    prefix: "+",
    bar: 100,
    label: "Más interacción con la audiencia",
  },
  {
    id: "audiencia",
    icon: "📡",
    iconBg: "#EAF3DE",
    iconColor: "#3B6D11",
    barColor: "#639922",
    target: 5,
    suffix: "M",
    prefix: "+",
    bar: 85,
    label: "Personas en audiencia potencial",
  },
];

function useCountUp(target, active, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    }
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return value;
}

function StatCard({ card, index, active }) {
  const [visible, setVisible] = useState(false);
  const [barWidth, setBarWidth] = useState(0);
  const count = useCountUp(card.target, active);

  useEffect(() => {
    if (!active) return;
    const t1 = setTimeout(() => setVisible(true), index * 110);
    const t2 = setTimeout(() => setBarWidth(card.bar), index * 110 + 180);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active, index, card.bar]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: "var(--surface-2, #ffffff)",
        border: "0.5px solid var(--border, #e5e7eb)",
        borderRadius: 12,
        padding: "1.2rem 1.4rem",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.4s ease ${index * 0.1}s, transform 0.4s cubic-bezier(0.22,1,0.36,1) ${index * 0.1}s`,
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: 20,
          background: card.iconBg,
          color: card.iconColor,
        }}
        aria-hidden="true"
      >
        {card.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 30,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {card.prefix}{count}{card.suffix}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-secondary, #6b7280)",
            marginTop: 4,
          }}
        >
          {card.label}
        </div>
        <div
          style={{
            height: 3,
            borderRadius: 2,
            marginTop: 10,
            background: "var(--border, #e5e7eb)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 2,
              background: card.barColor,
              width: `${barWidth}%`,
              transition: "width 1.1s cubic-bezier(0.4,0,0.2,1)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function CtaButton() {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: hovered ? "#fff" : "var(--text-accent, #185fa5)",
        border: "0.5px solid var(--border-accent, #185fa5)",
        borderRadius: "var(--radius, 8px)",
        padding: "10px 18px",
        cursor: "pointer",
        background: hovered ? "var(--fill-accent, #185fa5)" : "transparent",
        transition: "background 0.18s, color 0.18s",
      }}
    >
      Ver casos de éxito
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{
          transition: "transform 0.18s",
          transform: hovered ? "translateX(3px)" : "translateX(0)",
        }}
      >
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </button>
  );
}

export default function ResultadosSection() {
  const [active, setActive] = useState(false);
  const cardsRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setActive(true);
      },
      { threshold: 0.2 }
    );
    if (cardsRef.current) observer.observe(cardsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      style={{
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
        maxWidth: 1380,
        margin: "0 auto 5rem",
        padding: "2.5rem 0",
      }}
    >
      <h2 className="sr-only">
        Sección de resultados: métricas de impacto en comunicación y posicionamiento.
      </h2>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "2.5rem",
          minHeight: 480,
        }}
      >
        {/* ── Texto ── */}
        <div style={{ flex: "1 1 260px", padding: "1rem 0" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--text-accent, #185fa5)",
              marginBottom: "1rem",
            }}
          >
            <span
              style={{
                width: 22,
                height: 2,
                background: "var(--fill-accent, #185fa5)",
                borderRadius: 2,
                flexShrink: 0,
              }}
            />
            Resultados que se ven
          </div>

          <h3
            style={{
              fontSize: "clamp(22px, 3.2vw, 36px)",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              color: "var(--text-primary)",
              margin: "0 0 1rem",
            }}
          >
            Una estrategia bien ejecutada genera{" "}
            <em
              style={{
                fontStyle: "normal",
                color: "var(--text-accent, #185fa5)",
              }}
            >
              resultados medibles.
            </em>
          </h3>

          <p
            style={{
              fontSize: 13,
              fontWeight: 400,
              color: "var(--text-secondary, #6b7280)",
              lineHeight: 1.75,
              margin: "0 0 1.75rem",
              maxWidth: "40ch",
            }}
          >
            Datos basados en mejoras promedio obtenidas por nuestros clientes en
            sus indicadores de comunicación y posicionamiento.
          </p>

          <CtaButton />
        </div>

        {/* ── Tarjetas ── */}
        <div
          ref={cardsRef}
          style={{
            flex: "1 1 300px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: "1rem 0",
          }}
        >
          {CARDS.map((card, i) => (
            <StatCard key={card.id} card={card} index={i} active={active} />
          ))}
        </div>
      </div>
    </section>
  );
}
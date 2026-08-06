/**
 * MetodoSection v6 — JSX para Astro (client:load)
 * ─────────────────────────────────────────────────
 * • Cards más grandes y espaciosas (420px × 560px desktop)
 * • Textos con padding generoso, nunca pegados al borde
 * • Modo claro / oscuro vía .dark en <html>
 * • GSAP para animación de entrada del HEAD (import estático, no dinámico)
 * • Scroll horizontal nativo (el mismo patrón que ya funciona)
 * • Animaciones de cards con CSS .s-anim / .s-in
 */

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ─── DATA ──────────────────────────────────────────────────────────────── */
const STEPS = [
  {
    num: "01",
    title: "Diagnóstico",
    tagline: "Entendemos antes de actuar",
    desc: "Analizamos tu marca, entorno competitivo y audiencia para saber exactamente dónde estás parado y hacia dónde tienes que ir.",
    color: "#3b82f6",
    colorRgb: "59,130,246",
    items: ["Análisis de marca", "Entorno competitivo", "Audiencia objetiva", "Posicionamiento actual"],
    stat: "360°",
    statLabel: "Visión completa",
    img: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1000&q=85",
  },
  {
    num: "02",
    title: "Estrategia",
    tagline: "Definimos el camino exacto",
    desc: "Construimos el plan que conecta tu historia con las personas que necesitan escucharla, en el momento justo.",
    color: "#6366f1",
    colorRgb: "99,102,241",
    items: ["Plan de comunicación", "Objetivos SMART", "Narrativa de marca", "Posicionamiento"],
    stat: "100%",
    statLabel: "Alineación total",
    img: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1000&q=85",
  },
  {
    num: "03",
    title: "Producción",
    tagline: "Creamos contenido que impacta",
    desc: "Desde podcast hasta documentales. Producimos piezas que se quedan grabadas en la mente de tu audiencia.",
    color: "#ef4444",
    colorRgb: "239,68,68",
    items: ["Podcast & audio", "Videos & reels", "Coberturas en vivo", "Documentales"],
    stat: "+4h",
    statLabel: "Contenido semanal",
    img: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1000&q=85",
  },
  {
    num: "04",
    title: "Distribución",
    tagline: "Llegamos donde está tu audiencia",
    desc: "Radio, web, redes, prensa. Tu mensaje en todos los canales donde tu público vive, consume y decide.",
    color: "#f97316",
    colorRgb: "249,115,22",
    items: ["Web & SEO", "Radio & prensa", "Redes sociales", "PR & medios"],
    stat: "×12",
    statLabel: "Más alcance",
    img: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1000&q=85",
  },
  {
    num: "05",
    title: "Optimización",
    tagline: "Medimos, aprendemos y mejoramos",
    desc: "Los números dicen la verdad. Ajustamos cada variable hasta que los resultados hablen por sí solos.",
    color: "#10b981",
    colorRgb: "16,185,129",
    items: ["Métricas clave", "Resultados reales", "Mejora continua", "Reportes claros"],
    stat: "+284%",
    statLabel: "Engagement medio",
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&q=85",
  },
];

/* ─── COMPONENT ─────────────────────────────────────────────────────────── */
export default function MetodoSection() {
  const sectionRef = useRef(null);
  const stickyRef  = useRef(null);
  const trackRef   = useRef(null);
  const headRef    = useRef(null);

  const [progress, setProgress]   = useState(0);
  const [revealed, setRevealed]   = useState(STEPS.map(() => false));

  /* ── Layout + scroll ──────────────────────────────────────────────── */
  useEffect(() => {
    // Revelar primera card siempre
    setRevealed((p) => { const n = [...p]; n[0] = true; return n; });

    const section = sectionRef.current;
    const track   = trackRef.current;
    if (!section || !track) return;

    const isMobile = () => window.innerWidth < 768;

    function setupLayout() {
      if (isMobile()) { section.style.height = ""; return; }
      track.style.transform = "translateX(0px)";
      const vw     = window.innerWidth;
      const slides = Array.from(track.querySelectorAll(".m-slide"));
      const last   = slides[slides.length - 1];
      if (!last) return;
      const dist = Math.max(0, last.offsetLeft + last.offsetWidth - vw);
      section.style.height    = `calc(${dist}px + 100vh)`;
      section.dataset.travel  = String(dist);
    }

    function onScroll() {
      if (isMobile()) return;
      const dist = parseFloat(section.dataset.travel || "0");
      if (dist <= 0) return;
      const scrolled = -section.getBoundingClientRect().top;
      const prog     = Math.min(Math.max(scrolled / dist, 0), 1);
      setProgress(prog);
      const currentX = prog * dist;
      track.style.transform = `translateX(${-currentX}px)`;
      const vw = window.innerWidth;
      const slides = Array.from(track.querySelectorAll(".m-slide"));
      setRevealed(slides.map((s) => s.offsetLeft - currentX < vw * 0.86));
    }

    setupLayout();
    onScroll();

    const ro = new ResizeObserver(() => { setupLayout(); onScroll(); });
    ro.observe(document.documentElement);
    window.addEventListener("scroll", onScroll, { passive: true });

    // Mobile: IntersectionObserver
    let observers = [];
    if (isMobile()) {
      Array.from(track.querySelectorAll(".m-slide")).forEach((slide, i) => {
        const obs = new IntersectionObserver(
          ([e]) => { if (e.isIntersecting) setRevealed((p) => { const n=[...p]; n[i]=true; return n; }); },
          { threshold: 0.12 }
        );
        obs.observe(slide);
        observers.push(obs);
      });
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      ro.disconnect();
      observers.forEach((o) => o.disconnect());
    };
  }, []);

  /* ── GSAP — entrada del HEAD al hacer scroll hasta la sección ──────── */
  useEffect(() => {
    const head = headRef.current;
    if (!head) return;

    const els = head.querySelectorAll(".head-anim");
    gsap.set(els, { opacity: 0, y: 36 });

    const st = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top 80%",
      once: true,
      onEnter: () => {
        gsap.to(els, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.13,
          ease: "power3.out",
        });
      },
    });

    return () => st.kill();
  }, []);

  /* ── JSX ──────────────────────────────────────────────────────────── */
  return (
    <>
      {/* Barra de progreso */}
      <div
        aria-hidden="true"
        style={{ position:"fixed", top:0, left:0, width:"100%", height:"3px", zIndex:9999, pointerEvents:"none" }}
      >
        <div style={{
          height: "100%", width: "100%",
          background: "linear-gradient(90deg,#3b82f6,#6366f1,#ef4444,#f97316,#10b981)",
          transformOrigin: "left",
          transform: `scaleX(${progress})`,
          transition: "transform 0.08s linear",
        }} />
      </div>

      <section
        ref={sectionRef}
        className="metodo-section"
      >
        {/* ── Sticky ── */}
        <div ref={stickyRef} className="metodo-sticky">

          {/* ── HEAD ── */}
          <div ref={headRef} className="metodo-head">

            <div className="head-anim metodo-eyebrow">
              <span className="metodo-eyebrow-line" />
              <span className="metodo-eyebrow-text">Metodología</span>
              <span className="metodo-eyebrow-line" />
            </div>

            <h2 className="head-anim metodo-title">
              De la estrategia al{" "}
              <span className="metodo-gradient-text">impacto real</span>.
            </h2>

            <p className="head-anim metodo-subtitle">
              Cinco pasos que convierten marcas en referentes.
            </p>

            {/* Indicador de pasos */}
            <div className="head-anim metodo-steps-indicator">
              {STEPS.map((step, i) => (
                <button
                  key={i}
                  aria-label={`Paso ${step.num}: ${step.title}`}
                  className="metodo-step-dot"
                  style={{
                    width: revealed[i] ? "32px" : "8px",
                    background: revealed[i] ? step.color : undefined,
                  }}
                />
              ))}
            </div>
          </div>

          {/* ── TRACK ── */}
          <div ref={trackRef} className="metodo-track">
            <div style={{ flexShrink:0, width:"clamp(20px, 5vw, 80px)" }} aria-hidden="true" />

            {STEPS.map((step, i) => (
              <div key={step.num} className="m-slide">

                {/* CARD */}
                <div className="metodo-card">

                  {/* Imagen */}
                  <div className="metodo-card-img-wrap">
                    <img
                      src={step.img}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      className="metodo-card-img"
                    />
                    <div className="metodo-card-overlay" />
                    <div
                      className="metodo-card-color-wash"
                      style={{ background: `radial-gradient(ellipse at 50% 0%, rgba(${step.colorRgb},0.28) 0%, transparent 65%)` }}
                    />
                  </div>

                  {/* Contenido */}
                  <div className="metodo-card-content">

                    {/* Número + badge */}
                    <div className="metodo-card-top">
                      <span
                        className={`s-anim${revealed[i] ? " s-in" : ""} metodo-num`}
                        style={{ color: step.color, textShadow:`0 0 48px rgba(${step.colorRgb},0.55)`, "--d":"0s" }}
                      >
                        {step.num}
                      </span>
                      <span
                        className={`s-anim${revealed[i] ? " s-in" : ""} metodo-badge`}
                        style={{
                          color: step.color,
                          background: `rgba(${step.colorRgb},0.15)`,
                          border: `1px solid rgba(${step.colorRgb},0.35)`,
                          "--d": "0.06s",
                        }}
                      >
                        Paso {step.num}
                      </span>
                    </div>

                    {/* Texto principal */}
                    <div className="metodo-card-body">
                      <h3
                        className={`s-anim${revealed[i] ? " s-in" : ""} metodo-card-title`}
                        style={{ "--d":"0.12s" }}
                      >
                        {step.title}
                      </h3>
                      <p
                        className={`s-anim${revealed[i] ? " s-in" : ""} metodo-card-tagline`}
                        style={{ color: step.color, "--d":"0.18s" }}
                      >
                        {step.tagline}
                      </p>
                      <p
                        className={`s-anim${revealed[i] ? " s-in" : ""} metodo-card-desc`}
                        style={{ "--d":"0.24s" }}
                      >
                        {step.desc}
                      </p>
                    </div>

                    {/* Divisor */}
                    <div
                      className={`s-anim${revealed[i] ? " s-in" : ""} metodo-divider`}
                      style={{ background:`linear-gradient(90deg,rgba(${step.colorRgb},0.6),transparent)`, "--d":"0.3s" }}
                    />

                    {/* Items */}
                    <ul className="metodo-items">
                      {step.items.map((item, j) => (
                        <li
                          key={j}
                          className={`s-anim${revealed[i] ? " s-in" : ""} metodo-item`}
                          style={{ "--d":`${0.36 + j * 0.07}s` }}
                        >
                          <span className="metodo-item-dot" style={{ background: step.color }} />
                          {item}
                        </li>
                      ))}
                    </ul>

                    {/* Stat */}
                    <div
                      className={`s-anim${revealed[i] ? " s-in" : ""} metodo-stat`}
                      style={{ "--d":"0.62s" }}
                    >
                      <div>
                        <p className="metodo-stat-num" style={{ color: step.color }}>{step.stat}</p>
                        <p className="metodo-stat-label">{step.statLabel}</p>
                      </div>
                      <div className="metodo-dots" aria-hidden="true">
                        {STEPS.map((_, dot) => (
                          <span
                            key={dot}
                            className="metodo-dot"
                            style={{
                              width: dot === i ? "22px" : "5px",
                              background: dot === i ? step.color : undefined,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Borde inferior hover */}
                  <div className="metodo-card-border" style={{ background: step.color }} />
                </div>

                {/* Conector */}
                {i < STEPS.length - 1 && (
                  <div className="metodo-connector" aria-hidden="true">
                    <svg width="48" height="14" viewBox="0 0 48 14" fill="none">
                      <line x1="0" y1="7" x2="36" y2="7" stroke="currentColor" strokeWidth="1" strokeDasharray="5 4" />
                      <polygon points="33,2 47,7 33,12" fill="currentColor" />
                    </svg>
                  </div>
                )}
              </div>
            ))}

            <div style={{ flexShrink:0, width:"clamp(20px, 5vw, 80px)" }} aria-hidden="true" />
          </div>

          {/* Hint */}
          <div
            className="metodo-hint"
            aria-hidden="true"
            style={{ opacity: progress > 0.04 ? 0 : 1 }}
          >
            <span className="metodo-hint-text">Desliza para ver el método</span>
            <svg width="32" height="12" viewBox="0 0 32 12" fill="none" className="metodo-hint-arrow">
              <line x1="0" y1="6" x2="24" y2="6" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />
              <polygon points="22,1 32,6 22,11" fill="currentColor" fillOpacity="0.5" />
            </svg>
          </div>

        </div>
      </section>

      <style>{`
        /* ════════════════════════════════════
           TOKENS — light / dark
        ════════════════════════════════════ */
        .metodo-section {
          --bg:           #f8f8f6;
          --bg-card:      rgba(255,255,255,0.06);
          --text-primary: #0d0d0d;
          --text-muted:   #6b6b6b;
          --text-faint:   #a0a0a0;
          --border:       rgba(0,0,0,0.08);
          --connector:    #b0b0b0;
          --dot-idle:     rgba(0,0,0,0.15);
          --step-idle:    rgba(0,0,0,0.12);
          --eyebrow-line: rgba(0,0,0,0.15);
        }
        :is(.dark, [data-theme="dark"]) .metodo-section {
          --bg:           #060608;
          --bg-card:      rgba(255,255,255,0.03);
          --text-primary: #f0ede8;
          --text-muted:   rgba(255,255,255,0.45);
          --text-faint:   rgba(255,255,255,0.28);
          --border:       rgba(255,255,255,0.07);
          --connector:    rgba(255,255,255,0.25);
          --dot-idle:     rgba(255,255,255,0.12);
          --step-idle:    rgba(255,255,255,0.10);
          --eyebrow-line: rgba(255,255,255,0.18);
        }

        /* ════════════════════════════════════
           SECTION + STICKY
        ════════════════════════════════════ */
        .metodo-section {
          position: relative;
          background: var(--bg);
          transition: background 0.3s;
        }
        .metodo-sticky {
          position: sticky;
          top: 0;
          width: 100%;
          height: 100vh;
          overflow: hidden;
        }

        /* ════════════════════════════════════
           HEAD
        ════════════════════════════════════ */
        .metodo-head {
          position: absolute;
          top: 0; left: 0; right: 0;
          z-index: 20;
          padding: 48px clamp(24px, 6vw, 96px) 0;
          pointer-events: none;
        }
        .metodo-eyebrow {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
        }
        .metodo-eyebrow-line {
          display: block;
          height: 1px;
          width: 28px;
          background: var(--eyebrow-line);
        }
        .metodo-eyebrow-text {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--text-faint);
        }
        .metodo-title {
          font-size: clamp(1.9rem, 3.6vw, 3.4rem);
          font-weight: 900;
          line-height: 1.04;
          letter-spacing: -0.025em;
          color: var(--text-primary);
          margin: 0 0 10px;
        }
        .metodo-gradient-text {
          background-image: linear-gradient(90deg, #60a5fa, #818cf8, #f87171);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .metodo-subtitle {
          font-size: 14px;
          color: var(--text-muted);
          max-width: 300px;
          line-height: 1.65;
          margin: 0 0 20px;
        }

        /* Steps indicator (puntos arriba del head) */
        .metodo-steps-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          pointer-events: all;
        }
        .metodo-step-dot {
          height: 4px;
          border-radius: 999px;
          background: var(--step-idle);
          border: none;
          padding: 0;
          cursor: default;
          transition: width 0.4s ease, background 0.4s ease;
        }

        /* ════════════════════════════════════
           TRACK
        ════════════════════════════════════ */
        .metodo-track {
          position: absolute;
          top: 0; left: 0;
          height: 100%;
          display: flex;
          align-items: center;
          will-change: transform;
          padding-top: 172px;
        }

        /* ════════════════════════════════════
           SLIDE
        ════════════════════════════════════ */
        .m-slide {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          height: 100%;
        }

        /* ════════════════════════════════════
           CARD
        ════════════════════════════════════ */
        .metodo-card {
          position: relative;
          display: flex;
          flex-direction: column;
          width: 420px;
          height: 560px;
          border-radius: 24px;
          overflow: hidden;
          box-shadow:
            0 0 0 1px var(--border),
            0 40px 80px rgba(0,0,0,0.18);
          transition: box-shadow 0.4s ease, transform 0.4s ease;
          cursor: default;
        }
        .metodo-card:hover {
          transform: translateY(-4px);
          box-shadow:
            0 0 0 1px var(--border),
            0 56px 96px rgba(0,0,0,0.28);
        }

        /* Imagen */
        .metodo-card-img-wrap {
          position: absolute;
          inset: 0;
          z-index: 0;
        }
        .metodo-card-img {
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform 0.8s ease;
        }
        .metodo-card:hover .metodo-card-img {
          transform: scale(1.06);
        }
        .metodo-card-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(0,0,0,0.08) 0%,
            rgba(0,0,0,0.42) 30%,
            rgba(0,0,0,0.88) 65%,
            rgba(0,0,0,0.97) 100%
          );
        }
        .metodo-card-color-wash {
          position: absolute; inset: 0;
          opacity: 0;
          transition: opacity 0.6s ease;
        }
        .metodo-card:hover .metodo-card-color-wash { opacity: 1; }

        /* Contenido */
        .metodo-card-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 32px 36px 32px;
          gap: 0;
        }

        /* Top: número + badge */
        .metodo-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 0;
        }
        .metodo-num {
          font-size: 84px;
          font-weight: 900;
          line-height: 1;
          letter-spacing: -0.05em;
          user-select: none;
        }
        .metodo-badge {
          margin-top: 14px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 7px 14px;
          border-radius: 999px;
          white-space: nowrap;
        }

        /* Body */
        .metodo-card-body {
          margin-top: auto;
          margin-bottom: 20px;
        }
        .metodo-card-title {
          font-size: 1.9rem;
          font-weight: 900;
          letter-spacing: -0.025em;
          color: #fff;
          margin: 0 0 6px;
          line-height: 1.1;
        }
        .metodo-card-tagline {
          font-size: 13px;
          font-weight: 600;
          margin: 0 0 12px;
          line-height: 1.4;
        }
        .metodo-card-desc {
          font-size: 13px;
          color: rgba(255,255,255,0.52);
          line-height: 1.65;
          margin: 0;
        }

        /* Divisor */
        .metodo-divider {
          height: 1px;
          width: 100%;
          margin: 18px 0;
          flex-shrink: 0;
        }

        /* Items */
        .metodo-items {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px 16px;
          margin: 0 0 20px;
          padding: 0;
          list-style: none;
        }
        .metodo-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: rgba(255,255,255,0.62);
          line-height: 1.4;
        }
        .metodo-item-dot {
          flex-shrink: 0;
          width: 5px;
          height: 5px;
          border-radius: 999px;
          display: block;
        }

        /* Stat */
        .metodo-stat {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-top: auto;
          padding-top: 18px;
          border-top: 1px solid rgba(255,255,255,0.09);
        }
        .metodo-stat-num {
          font-size: 2.4rem;
          font-weight: 900;
          line-height: 1;
          letter-spacing: -0.04em;
          margin: 0;
        }
        .metodo-stat-label {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: rgba(255,255,255,0.3);
          margin: 5px 0 0;
        }
        .metodo-dots {
          display: flex;
          gap: 6px;
          padding-bottom: 4px;
        }
        .metodo-dot {
          height: 4px;
          border-radius: 999px;
          background: var(--dot-idle);
          display: block;
          transition: width 0.3s ease, background 0.3s ease;
        }

        /* Borde inferior hover */
        .metodo-card-border {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 3px;
          transform-origin: left;
          transform: scaleX(0);
          transition: transform 0.5s ease;
        }
        .metodo-card:hover .metodo-card-border { transform: scaleX(1); }

        /* ════════════════════════════════════
           CONECTOR
        ════════════════════════════════════ */
        .metodo-connector {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          padding: 0 20px;
          color: var(--connector);
          opacity: 0.4;
        }

        /* ════════════════════════════════════
           HINT
        ════════════════════════════════════ */
        .metodo-hint {
          position: absolute;
          bottom: 36px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          pointer-events: none;
          transition: opacity 0.5s ease;
          color: var(--text-faint);
        }
        .metodo-hint-text {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }
        .metodo-hint-arrow {
          animation: hintArrow 1.9s ease-in-out infinite;
        }
        @keyframes hintArrow {
          0%,100% { transform: translateX(0); }
          50%      { transform: translateX(6px); }
        }

        /* ════════════════════════════════════
           ANIMACIONES ENTRADA CARDS
        ════════════════════════════════════ */
        .s-anim {
          opacity: 0;
          transform: translateY(16px);
          transition:
            opacity  0.55s cubic-bezier(.22,1,.36,1) var(--d, 0s),
            transform 0.55s cubic-bezier(.22,1,.36,1) var(--d, 0s);
        }
        .s-anim.s-in {
          opacity: 1;
          transform: translateY(0);
        }

        /* ════════════════════════════════════
           MOBILE
        ════════════════════════════════════ */
        @media (max-width: 767px) {
          .metodo-sticky {
            position: static;
            height: auto;
            overflow: visible;
          }
          .metodo-section { height: auto !important; }
          .metodo-head {
            position: static;
            padding: 48px 24px 0;
          }
          .metodo-track {
            position: static !important;
            flex-direction: column;
            width: 100% !important;
            height: auto !important;
            padding: 32px 20px 64px !important;
            transform: none !important;
            gap: 28px;
          }
          .m-slide {
            flex-direction: column;
            height: auto;
            width: 100%;
          }
          .metodo-card {
            width: 100%;
            max-width: 440px;
            height: 540px;
          }
          .metodo-connector { display: none; }
          .metodo-hint { display: none; }
        }

        /* ════════════════════════════════════
           REDUCE MOTION
        ════════════════════════════════════ */
        @media (prefers-reduced-motion: reduce) {
          .s-anim {
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .metodo-card { transition: none !important; }
          .metodo-card-img { transition: none !important; }
          .metodo-hint-arrow { animation: none !important; }
        }
      `}</style>
    </>
  );
}
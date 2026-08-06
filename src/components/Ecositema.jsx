"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Iconos dibujados inline (sin depender de archivos /public que pueden faltar,
// venir rotos, o tener trazos muy finos para verse bien dentro del circulo)
function IconRadio() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12a8 8 0 0 1 14.5-4.6" />
      <circle cx="12" cy="15" r="5.5" />
      <circle cx="12" cy="15" r="1.3" fill="currentColor" stroke="none" />
      <path d="M9 6 12 12 17 5" />
    </svg>
  );
}

function IconWeb() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.4 2.3 3.6 5.3 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.3-3.6-8.5S9.6 5.8 12 3.5Z" />
    </svg>
  );
}

function IconMic() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8.5" y="2.5" width="7" height="12" rx="3.5" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3.5" />
      <path d="M8.5 21.5h7" />
    </svg>
  );
}

function IconStreaming() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 16.5V8.5L19 4v13" />
      <circle cx="6.5" cy="18.5" r="2" />
      <circle cx="17.5" cy="15" r="2" />
    </svg>
  );
}

function IconSocial() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="12" r="2.4" />
      <circle cx="18" cy="6" r="2.4" />
      <circle cx="18" cy="18" r="2.4" />
      <path d="M8.1 10.8 15.9 7.2" />
      <path d="M8.1 13.2 15.9 16.8" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M3.5 10h17" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <circle cx="8" cy="14.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="14.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const ITEMS = [
  { Icon: IconRadio, label: "Radio" },
  { Icon: IconWeb, label: "Portal Web" },
  { Icon: IconMic, label: "Podcast" },
  { Icon: IconStreaming, label: "Streaming" },
  { Icon: IconSocial, label: "Redes Sociales" },
  { Icon: IconCalendar, label: "Eventos" },
];

function Dots() {
  return (
    <div className="dots">
      <span></span><span></span><span></span><span></span><span></span>
    </div>
  );
}

function Group() {
  return (
    <div className="ecosistema-group">
      {ITEMS.map((item, i) => {
        const Icon = item.Icon;
        return (
          <div key={item.label} style={{ display: "contents" }}>
            <div className="ecosistema-item">
              <div className="ecosistema-icon-wrap">
                <div className="ecosistema-icon-ring" />
                <Icon />
              </div>
              <span>{item.label}</span>
            </div>
            {i < ITEMS.length - 1 && <Dots />}
          </div>
        );
      })}
    </div>
  );
}

export default function EcosistemaSection() {
  const sectionRef = useRef(null);
  const cardRef = useRef(null);
  const eyebrowRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const railRef = useRef(null);
  const trackRef = useRef(null);
  const scopeRef = useRef(null);
  const scopeLineRef = useRef(null);
  const haloRef = useRef(null);
  const particlesRef = useRef(null);
  const freqLinesRef = useRef(null);

  // Entrance animation, triggered once when the section reaches the viewport
  useEffect(() => {
    const itemEls = trackRef.current.querySelectorAll(".ecosistema-item");
    const particleEls = particlesRef.current.querySelectorAll(".ecosistema-particle");
    const freqEls = freqLinesRef.current.querySelectorAll(".ecosistema-freq-line");

    const ctx = gsap.context(() => {
      gsap.set(cardRef.current, { opacity: 0, y: 32 });
      gsap.set([eyebrowRef.current, subtitleRef.current], { opacity: 0 });
      gsap.set(titleRef.current, { opacity: 0, y: 16 });
      gsap.set(itemEls, { opacity: 0, y: 18, scale: 0.9 });
      gsap.set(scopeRef.current, { opacity: 0 });
      gsap.set(haloRef.current, { opacity: 0, scale: 0.7 });
      gsap.set(particleEls, { opacity: 0 });
      gsap.set(freqEls, { opacity: 0, scaleY: 0.3 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          once: true,
        },
      });

      tl.to(cardRef.current, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" })
        .to(haloRef.current, { opacity: 1, scale: 1, duration: 1.1, ease: "power2.out" }, "-=0.5")
        .to(eyebrowRef.current, { opacity: 1, duration: 0.4 }, "-=0.5")
        .to(titleRef.current, { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" }, "-=0.25")
        .to(subtitleRef.current, { opacity: 1, duration: 0.45 }, "-=0.3")
        .to(scopeRef.current, { opacity: 0.55, duration: 0.8 }, "-=0.4")
        .to(
          freqEls,
          { opacity: 0.5, scaleY: 1, duration: 0.5, stagger: 0.025, ease: "power1.out" },
          "-=0.6"
        )
        .to(
          itemEls,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.45,
            ease: "back.out(1.6)",
            stagger: { each: 0.045, from: "start" },
          },
          "-=0.5"
        )
        .to(
          particleEls,
          { opacity: 1, duration: 0.6, stagger: 0.08 },
          "-=0.3"
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Ambient background animations: scope wave, drifting particles, pulsing
  // frequency bars and a breathing halo behind the headline. These loop
  // continuously, independent of the entrance and the carousel scroll.
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Oscilloscope wave drifting sideways forever (the path is duplicated
      // end-to-end, so sliding exactly one segment width loops seamlessly)
      gsap.to(scopeLineRef.current, {
        x: -1000,
        duration: 6,
        ease: "none",
        repeat: -1,
      });

      // Halo behind the headline breathing slowly
      gsap.to(haloRef.current, {
        scale: 1.12,
        opacity: 0.85,
        duration: 3.4,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });

      // Frequency bars pulsing at slightly different speeds, like a live VU meter
      const freqEls = freqLinesRef.current.querySelectorAll(".ecosistema-freq-line");
      freqEls.forEach((el, i) => {
        gsap.to(el, {
          scaleY: gsap.utils.random(0.4, 1),
          duration: gsap.utils.random(0.6, 1.4),
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: i * 0.05,
        });
      });

      // Particles drifting upward and looping, like signal dust in the air
      const particleEls = particlesRef.current.querySelectorAll(".ecosistema-particle");
      particleEls.forEach((el, i) => {
        gsap.to(el, {
          y: "-=120",
          x: `+=${gsap.utils.random(-20, 20)}`,
          duration: gsap.utils.random(7, 13),
          ease: "none",
          repeat: -1,
          delay: i * 0.6,
          modifiers: {
            y: gsap.utils.unitize((v) => parseFloat(v) % 360, "px"),
          },
        });
        gsap.to(el, {
          opacity: gsap.utils.random(0.2, 0.7),
          duration: gsap.utils.random(1.5, 3),
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Infinite scroll loop (kept from the original, GSAP-driven so it can pause cleanly on hover)
  useEffect(() => {
    const track = trackRef.current;
    const rail = railRef.current;
    if (!track) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const trackWidth = track.scrollWidth / 2;

    const loopTween = gsap.to(track, {
      x: -trackWidth,
      duration: 32,
      ease: "none",
      repeat: -1,
    });

    const pause = () => loopTween.pause();
    const resume = () => loopTween.resume();

    rail.addEventListener("mouseenter", pause);
    rail.addEventListener("mouseleave", resume);

    return () => {
      loopTween.kill();
      rail.removeEventListener("mouseenter", pause);
      rail.removeEventListener("mouseleave", resume);
    };
  }, []);

  return (
    <section ref={sectionRef} className="ecosistema-section">
      <div ref={cardRef} className="ecosistema-card border bg-stone-100 dark:bg-stone-950 border-stone-200 shadow-2xl" >
        <div ref={haloRef} className="ecosistema-halo" />

        <div ref={freqLinesRef} className="ecosistema-freq-lines" aria-hidden="true">
          {Array.from({ length: 28 }).map((_, i) => (
            <span key={i} className="ecosistema-freq-line" />
          ))}
        </div>

        <div ref={particlesRef} className="ecosistema-particles" aria-hidden="true">
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="ecosistema-particle"
              style={{
                left: `${(i * 7.3) % 100}%`,
                bottom: `${(i * 11) % 90}%`,
              }}
            />
          ))}
        </div>

        <svg
          ref={scopeRef}
          className="ecosistema-scope"
          viewBox="0 0 1000 60"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <clipPath id="ecosistema-scope-clip">
              <rect x="0" y="0" width="1000" height="60" />
            </clipPath>
          </defs>
          <g ref={scopeLineRef} clipPath="url(#ecosistema-scope-clip)">
            <polyline
              points="0,30 40,24 80,36 120,18 160,32 200,22 240,34 280,20 320,30 360,26 400,32 440,18 480,30 520,24 560,34 600,20 640,30 680,26 720,32 760,20 800,30 840,24 880,34 920,22 960,30 1000,26"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <polyline
              points="1000,30 1040,24 1080,36 1120,18 1160,32 1200,22 1240,34 1280,20 1320,30 1360,26 1400,32 1440,18 1480,30 1520,24 1560,34 1600,20 1640,30 1680,26 1720,32 1760,20 1800,30 1840,24 1880,34 1920,22 1960,30 2000,26"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </g>
        </svg>

        <div className="ecosistema-text">
          <span ref={eyebrowRef} className="ecosistema-eyebrow">
            <span className="ecosistema-dot" />
            Nuestro Ecosistema
          </span>

          <h2 ref={titleRef} className="ecosistema-title text-black dark:text-white ">
            Más que la radio.
            <br />
            Mucho más.
          </h2>

          <p ref={subtitleRef} className="ecosistema-subtitle">
            Una sola señal, seis canales. Sintoniza cómo conectamos con
            nuestra audiencia, en cualquier formato, en cualquier momento.
          </p>
        </div>

        <div ref={railRef} className="ecosistema-rail">
          <div className="ecosistema-fade ecosistema-fade-l" />
          <div className="ecosistema-fade ecosistema-fade-r" />
          <div ref={trackRef} className="ecosistema-slider">
            <Group />
            <Group />
          </div>
        </div>

        <div className="ecosistema-footer">
          <div className="ecosistema-line" />
          <span>EN VIVO 24/7</span>
          <div className="ecosistema-line" />
        </div>
      </div>

      <style jsx>{`
        .ecosistema-section {
          padding: 2px 0 8px;
        }

        .ecosistema-card {
          position: relative;
          width: 100%;
          
          padding: 56px 24px 32px;
          overflow: hidden;
          color: #f5f1ea;
        }

        @media (min-width: 768px) {
          .ecosistema-card {
            padding: 64px 56px 40px;
          }
        }

        .ecosistema-halo {
          position: absolute;
          top: -120px;
          left: 50%;
          width: 480px;
          height: 480px;
          margin-left: -240px;
          border-radius: 999px;
          background: radial-gradient(
            circle,
            rgba(255, 107, 26, 0.16) 0%,
            rgba(255, 107, 26, 0.05) 45%,
            transparent 70%
          );
          pointer-events: none;
          z-index: 0;
        }

        .ecosistema-freq-lines {
          position: absolute;
          top: 0;
          right: 24px;
          display: flex;
          align-items: flex-end;
          gap: 3px;
          height: 40px;
          z-index: 1;
          pointer-events: none;
        }

        @media (max-width: 768px) {
          .ecosistema-freq-lines {
            display: none;
          }
        }

        .ecosistema-freq-line {
          width: 2px;
          height: 100%;
          border-radius: 2px;
          background: #ff6b1a;
          transform-origin: bottom center;
          transform: scaleY(0.4);
        }

        .ecosistema-particles {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          overflow: hidden;
        }

        .ecosistema-particle {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 999px;
          background: #ff6b1a;
          opacity: 0.4;
        }

        .ecosistema-scope {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 48px;
          color: #ff6b1a;
          opacity: 0;
          z-index: 1;
        }

        .ecosistema-text {
          position: relative;
          z-index: 2;
          max-width: 560px;
        }

        .ecosistema-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #ff6b1a;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .ecosistema-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          display: inline-block;
        }

        .ecosistema-title {
          margin-top: 14px;
          
          font-size: clamp(2rem, 5vw, 3rem);
          line-height: 1.05;
          letter-spacing: -0.01em;
          font-weight: 700;
        }

        .ecosistema-subtitle {
          margin-top: 16px;
          color: #a3a29c;
          font-size: 0.95rem;
          line-height: 1.65;
        }

        .ecosistema-rail {
          position: relative;
          z-index: 2;
          margin-top: 44px;
          overflow: hidden;
        }

        .ecosistema-fade {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 60px;
          z-index: 3;
          pointer-events: none;
        }

        .ecosistema-fade-l {
          left: 0;
          background: linear-gradient(90deg, #ffffSSSS, transparent);
        }


        .ecosistema-fade-r {
          right: 0;
          background: linear-gradient(270deg, #ffff, transparent);
        }

        /* Ajustar la transparencia para el modo oscuro */

.dark .ecosistema-fade-l {
  background: linear-gradient(
    to right,
    #141416 0%,
    rgba(20, 20, 22, 0) 100%
  );
}

.dark .ecosistema-fade-r {
  background: linear-gradient(
    to left,
    #141416 0%,
    rgba(20, 20, 22, 0) 100%
  );
}

        .ecosistema-slider {
          display: flex;
          width: max-content;
        }

        .ecosistema-group {
          display: flex;
          align-items: center;
        }

        .ecosistema-item {
          width: 148px;
          flex-shrink: 0;
          text-align: center;
          padding: 6px 4px;
        }

        .ecosistema-icon-wrap {
          position: relative;
          width: 68px;
          height: 68px;
          margin: 0 auto 14px;
          border-radius: 999px;
          background: #1b1b1e;
          border: 1px solid #2c2c30;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.25s ease, background 0.25s ease, transform 0.25s ease;
        }

        .ecosistema-icon-wrap svg {
          width: 28px;
          height: 28px;
          color: #ff6b1a;
          position: relative;
          z-index: 1;
        }

        .ecosistema-icon-ring {
          position: absolute;
          inset: -5px;
          border-radius: 999px;
          border: 1px solid #28282b;
          opacity: 0;
          transition: opacity 0.25s ease, transform 0.25s ease;
        }

        .ecosistema-item:hover .ecosistema-icon-wrap {
          border-color: #ff6b1a;
          background: #20180f;
          transform: translateY(-3px);
        }

        .ecosistema-item:hover .ecosistema-icon-ring {
          opacity: 1;
          border-color: rgba(255, 107, 26, 0.4);
          transform: scale(1.06);
        }

        .ecosistema-item span {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: 0.01em;
        }

        .dots {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 22px;
          flex-shrink: 0;
        }

        .dots span {
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: #3a3a3d;
          display: block;
        }

        .ecosistema-footer {
          margin-top: 28px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ecosistema-line {
          flex: 1;
          height: 1px;
          background: #232326;
        }

        .ecosistema-footer span {
          font-size: 0.68rem;
          color: #5c5b57;
          letter-spacing: 0.1em;
        }

        @media (max-width: 768px) {
          .ecosistema-item {
            width: 116px;
          }
        }
      `}</style>
    </section>
  );
}
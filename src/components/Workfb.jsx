"use client";
import { useEffect, useRef, useState } from "react";

const BARS = [
  { label: "Mensaje claro", w: 28 },
  { label: "Audiencia conectada", w: 31 },
  { label: "Conversión efectiva", w: 22 },
];

const PROBLEMS = [
  { title: "Mensaje difuso", desc: "Sin diferenciación real en el mercado" },
  { title: "Audiencia desconectada", desc: "No se identifica correctamente" },
  { title: "Fortalezas sin resultados", desc: "Las ventajas no se convierten en ventas" },
];

const CITIES = [
  { cx: 126, cy: 83,  r: 4,   delay: 0    },
  { cx: 108, cy: 117, r: 3,   delay: 0.4  },
  { cx: 100, cy: 165, r: 3.5, delay: 0.7  },
  { cx: 243, cy: 218, r: 5.5, delay: 1.0  },
  { cx: 176, cy: 288, r: 5,   delay: 1.3  },
  { cx: 103, cy: 288, r: 3.5, delay: 1.6  },
  { cx: 233, cy: 188, r: 3,   delay: 0.85 },
];

const CYCLE = [
  {
    label: "Mensaje difuso", desc: "Sin claridad en lo que se comunica",
    icon: <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="#b91c1c" strokeWidth={1.5}><path d="M15 3h6v6M14 10l7-7M9 21H3v-6M10 14l-7 7"/></svg>,
    border: "#fca5a5",
  },
  {
    label: "Audiencia perdida", desc: "No se llega a quien decide",
    icon: <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="#b91c1c" strokeWidth={1.5}><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
    border: "#fca5a5",
  },
  {
    label: "Sin conversión", desc: "Las fortalezas no generan resultados",
    icon: <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="#b91c1c" strokeWidth={1.5}><path d="M3 3l18 18M10.5 10.5A3 3 0 0113.5 13.5M6.5 6.5A9 9 0 0117.5 17.5"/></svg>,
    border: "#f87171",
  },
  {
    label: "Oportunidad perdida", desc: "El mercado crece, tu visibilidad no",
    icon: <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="#b91c1c" strokeWidth={1.5}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
    border: "#ef4444",
    highlight: true,
  },
];

function useInView(ref) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
  return visible;
}

function Counter({ target, run }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!run) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1400, 1);
      setVal(Math.round(p * p * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [run, target]);
  return <>{val}%</>;
}

const accent = {
  position: "absolute", top: 0, left: 0, right: 0, height: 3,
  background: "#b91c1c", transformOrigin: "left",
};

export default function ProblemaSection() {
  const sectionRef = useRef(null);
  const visible = useInView(sectionRef);

  const fu = (delay = 0) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "none" : "translateY(20px)",
    transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
  });

  const card = (delay = 0) => ({
    
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 28,
    position: "relative",
    overflow: "hidden",
    ...fu(delay),
  });

  const accentBar = (delay = 0) => ({
    ...accent,
    animation: visible ? `accentIn 0.7s ${delay}s ease both` : "none",
    transform: visible ? "scaleX(1)" : "scaleX(0)",
  });

  return (
    <section style={{ width: "100%", padding: "3.5rem 2.5rem", boxSizing: "border-box", fontFamily: "inherit" }}>
      <style>{`
        @keyframes ping { 75%,100%{transform:scale(2.4);opacity:0} }
        @keyframes accentIn { from{transform:scaleX(0)} to{transform:scaleX(1)} }
        @keyframes barGrow { from{width:0} to{width:var(--bar-w)} }
        @keyframes pingCity { 0%,100%{transform:scale(1);opacity:.12} 50%{transform:scale(2.4);opacity:0} }
      `}</style>

      <div ref={sectionRef}>
        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, ...fu(0.05) }}>
          <span style={{
            display: "block", width: 28, height: 2, background: "#b91c1c", flexShrink: 0,
            animation: visible ? "accentIn 0.5s 0.1s ease both" : "none",
            transformOrigin: "left", transform: visible ? "scaleX(1)" : "scaleX(0)",
          }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#b91c1c" }}>
            El problema
          </span>
        </div>

        {/* Headline */}
        <h2 className="uppercase" style={{ fontSize: "clamp(1.6rem,3.5vw,2.75rem)", fontWeight: 800, lineHeight: 1.1, margin: "0 0 1rem", ...fu(0.1) }}>
          Muchas organizaciones tienen un gran producto,{" "} <br />
          <span style={{ color: "#b91c1c" }}>pero nadie habla de ellas.</span>
        </h2>

        {/* Body */}
        <p style={{ fontSize: "1rem", lineHeight: 1.75, color: "#475569", maxWidth: 560, margin: "0 0 2.5rem", ...fu(0.18) }}>
          No conectan con su audiencia, no convierten sus fortalezas en resultados
          y su mensaje se pierde entre tanto ruido.
        </p>

        {/* Fila 1: 3 columnas */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>

          {/* Card A: Stat + Barras */}
          <div style={card(0.22)}>
            <div style={accentBar(0.3)} />
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 24 }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="#b91c1c" strokeWidth={1.5} strokeLinecap="round">
                  <circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                  <circle cx="19" cy="7" r="2" /><path d="M21 21v-1a2 2 0 00-2-2h-1" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "3rem", fontWeight: 800, color: "#b91c1c", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                  <Counter target={70} run={visible} />
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, lineHeight: 1.4 }}>
                  de empresas latinoamericanas con fallas en su comunicación
                </div>
              </div>
            </div>
            <div style={{ height: 1, background: "#f1f5f9", marginBottom: 20 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 20 }}>
              {BARS.map((b, i) => (
                <div key={b.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
                    <span>{b.label}</span><span>{b.w}%</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: "#f1f5f9", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 3, background: "#b91c1c",
                      width: visible ? b.w + "%" : "0%",
                      transition: `width 0.9s cubic-bezier(0.4,0,0.2,1) ${0.4 + i * 0.12}s`,
                    }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["Comunicación", "Latam", "Empresas"].map((tag) => (
                <span key={tag} style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 99, background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }}>
                  {tag}
                </span>
              ))}
            </div>
            <div style={{ position: "absolute", bottom: 14, right: 14, display: "inline-flex" }}>
              <span style={{ position: "absolute", width: 9, height: 9, borderRadius: "50%", background: "#b91c1c", opacity: 0.5, animation: "ping 1.6s cubic-bezier(0,0,.2,1) infinite" }} />
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#b91c1c", display: "block" }} />
            </div>
          </div>

          {/* Card B: Mapa */}
          <div style={card(0.32)}>
            <div style={accentBar(0.42)} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8" }}>Cobertura regional</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }}>Sudamérica</span>
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <svg viewBox="0 0 360 480" style={{ width: "100%", maxWidth: 260, height: "auto" }}>
                <path d="M108,55 L148,50 L163,65 L168,90 L153,105 L133,110 L113,100 L100,85 L102,67Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1"/>
                <path d="M153,50 L203,45 L218,55 L213,75 L193,85 L173,90 L163,65Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1"/>
                <path d="M218,55 L258,53 L266,70 L248,80 L223,77 L213,75Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1"/>
                <path d="M100,100 L133,110 L136,130 L118,135 L98,123Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1"/>
                <path d="M98,123 L136,130 L143,160 L138,195 L118,210 L93,200 L80,175 L83,150Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1"/>
                <path d="M138,195 L173,190 L180,215 L170,240 L143,245 L133,223Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1"/>
                <path d="M173,90 L193,85 L243,85 L278,95 L293,120 L296,160 L283,200 L263,230 L243,250 L223,260 L198,260 L180,245 L170,240 L180,215 L173,190 L138,195 L143,160 L136,130 L153,105 L173,110Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1"/>
                <path d="M170,240 L198,235 L203,255 L188,267 L170,263 L163,250Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1"/>
                <path d="M198,267 L218,263 L223,280 L206,290 L193,280Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1"/>
                <path d="M118,210 L143,245 L163,250 L170,263 L188,267 L193,280 L188,310 L178,350 L163,390 L148,420 L136,435 L128,405 L116,365 L113,325 L116,285 L120,253Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1"/>
                <path d="M93,200 L118,210 L120,253 L116,285 L113,325 L110,370 L103,410 L96,432 L88,427 L86,387 L88,347 L90,302 L90,257 L93,228Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1"/>
                {CITIES.map((c, i) => (
                  <g key={i}>
                    <circle cx={c.cx} cy={c.cy} r={c.r * 2.2} fill="#b91c1c"
                      style={{ animation: `pingCity 2s ${c.delay}s cubic-bezier(0,0,.2,1) infinite`, transformOrigin: `${c.cx}px ${c.cy}px` }}
                    />
                    <circle cx={c.cx} cy={c.cy} r={c.r} fill="#b91c1c"
                      style={{ opacity: visible ? 1 : 0, transition: `opacity 0.4s ease ${c.delay + 0.3}s` }}
                    />
                  </g>
                ))}
                <text x="134" y="81" fontSize="9" fill="#64748b" fontFamily="inherit">Bogotá</text>
                <text x="250" y="217" fontSize="9" fill="#64748b" fontFamily="inherit">São Paulo</text>
                <text x="184" y="286" fontSize="9" fill="#64748b" fontFamily="inherit">Bs. Aires</text>
              </svg>
            </div>
          </div>

          {/* Card C: Problemas + mini stats */}
          <div style={{ ...card(0.42), display: "flex", flexDirection: "column" }}>
            <div style={accentBar(0.52)} />
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 20 }}>Principales barreras</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {PROBLEMS.map((p) => (
                <div key={p.title} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca" }}>
                  <div style={{ width: 20, height: 20, borderRadius: 5, background: "#b91c1c", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    <svg viewBox="0 0 12 12" width={10} height={10} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round"><path d="M6 2v3.5M6 8h.01"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#991b1b", marginBottom: 2 }}>{p.title}</div>
                    <div style={{ fontSize: 12, color: "#b91c1c", lineHeight: 1.4 }}>{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ padding: 12, borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 3 }}>Países cubiertos</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1e293b", lineHeight: 1 }}>12+</div>
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 3 }}>Años de experiencia</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1e293b", lineHeight: 1 }}>8+</div>
              </div>
            </div>
          </div>
        </div>

        {/* Fila 2: Ciclo full ancho */}
        <div style={card(0.52)}>
          <div style={accentBar(0.62)} />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 24 }}>El ciclo del problema</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", position: "relative" }}>
            <div style={{ position: "absolute", top: 23, left: "12.5%", right: "12.5%", height: 1, background: "#fecaca" }} />
            {CYCLE.map((step, i) => (
              <div key={step.label} style={{
                display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
                gap: 8, position: "relative", zIndex: 1,
                opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(16px)",
                transition: `opacity 0.5s ease ${0.55 + i * 0.1}s, transform 0.5s ease ${0.55 + i * 0.1}s`,
              }}>
                <div style={{ width: 46, height: 46, borderRadius: 11, background: "#fef2f2", border: `1.5px solid ${step.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {step.icon}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: step.highlight ? "#b91c1c" : "#1e293b" }}>{step.label}</span>
                <span style={{ fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>{step.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
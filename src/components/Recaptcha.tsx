import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        container: HTMLElement,
        params: { sitekey: string; callback: (token: string) => void; "expired-callback"?: () => void }
      ) => number;
    };
    ___grecaptchaReadyPromise?: Promise<void>;
    ___onRecaptchaApiLoad?: () => void;
  }
}

// 🔑 Google avisa que su API está REALMENTE lista (con grecaptcha.render ya
// disponible) a través de este callback — no basta con esperar el evento
// "onload" del <script>, que dispara antes de tiempo y causaba el error
// "window.grecaptcha.render is not a function".
function loadRecaptchaScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.grecaptcha?.render) return Promise.resolve();
  if (window.___grecaptchaReadyPromise) return window.___grecaptchaReadyPromise;

  window.___grecaptchaReadyPromise = new Promise((resolve) => {
    window.___onRecaptchaApiLoad = () => resolve();

    const script = document.createElement("script");
    script.src =
      "https://www.google.com/recaptcha/api.js?onload=___onRecaptchaApiLoad&render=explicit";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });

  return window.___grecaptchaReadyPromise;
}

export default function Recaptcha({ onVerify }: { onVerify: (token: string | null) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);
  const [siteKey] = useState(
    () => (import.meta as any).env?.PUBLIC_RECAPTCHA_SITE_KEY as string | undefined
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!siteKey) return;

    let cancelled = false;

    loadRecaptchaScript().then(() => {
      if (cancelled || !containerRef.current || !window.grecaptcha || renderedRef.current) return;
      renderedRef.current = true;
      window.grecaptcha.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => onVerify(token),
        "expired-callback": () => onVerify(null),
      });
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  if (!siteKey) {
    return (
      <p className="text-xs text-amber-600 dark:text-amber-400">
        ⚠️ Falta configurar PUBLIC_RECAPTCHA_SITE_KEY para poder verificar que
        no eres un robot.
      </p>
    );
  }

  return <div ref={containerRef} className={ready ? "" : "h-[78px]"} />;
}

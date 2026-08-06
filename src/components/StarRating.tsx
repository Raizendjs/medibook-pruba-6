import { useState } from "react";

const SIZE_CLASSES: Record<"sm" | "md" | "lg", string> = {
  sm: "w-3.5 h-3.5",
  md: "w-5 h-5",
  lg: "w-8 h-8",
};

/**
 * Estrellas de solo lectura: muestran un promedio (con medias estrellas)
 * y aparecen animadas en cascada la primera vez que se montan.
 */
export function StarRatingDisplay({
  rating,
  count,
  size = "md",
  showCount = true,
  animate = true,
}: {
  rating: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  animate?: boolean;
}) {
  const sizeClass = SIZE_CLASSES[size];
  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="inline-flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} de 5 estrellas`}>
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = Math.max(0, Math.min(1, rating - (i - 1)));
          return (
            <span
              key={i}
              className={`relative inline-block ${sizeClass}`}
              style={animate ? { animation: `star-pop 0.45s cubic-bezier(.34,1.56,.64,1) both`, animationDelay: `${i * 70}ms` } : undefined}
            >
              <svg viewBox="0 0 24 24" className={`absolute inset-0 ${sizeClass} text-amber-200 dark:text-neutral-700`} fill="currentColor">
                <path d="M12 2.5l2.9 6.4 6.9.7-5.2 4.7 1.5 6.9L12 17.6l-6.1 3.6 1.5-6.9L2.2 9.6l6.9-.7L12 2.5z" />
              </svg>
              {fill > 0 && (
                <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                  <svg viewBox="0 0 24 24" className={`${sizeClass} text-amber-400`} fill="currentColor">
                    <path d="M12 2.5l2.9 6.4 6.9.7-5.2 4.7 1.5 6.9L12 17.6l-6.1 3.6 1.5-6.9L2.2 9.6l6.9-.7L12 2.5z" />
                  </svg>
                </span>
              )}
            </span>
          );
        })}
      </div>
      {showCount && (
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          {rating > 0 ? `${rating.toFixed(1)} · ${count ?? 0} reseña${count === 1 ? "" : "s"}` : "Sin reseñas todavía"}
        </span>
      )}
    </div>
  );
}

/**
 * Estrellas interactivas para calificar (1 a 5). onChange se dispara al
 * elegir una estrella; también anima en cascada al aparecer.
 */
export function StarRatingInput({
  value,
  onChange,
  size = "lg",
  disabled = false,
}: {
  value: number;
  onChange: (value: number) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const sizeClass = SIZE_CLASSES[size];
  const shown = hovered ?? value;

  return (
    <div className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={disabled}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onChange(i)}
          className={`${sizeClass} transition-transform hover:scale-125 disabled:cursor-not-allowed disabled:hover:scale-100`}
          style={{ animation: `star-pop 0.4s cubic-bezier(.34,1.56,.64,1) both`, animationDelay: `${i * 60}ms` }}
          aria-label={`Calificar con ${i} estrella${i === 1 ? "" : "s"}`}
        >
          <svg
            viewBox="0 0 24 24"
            className={`${sizeClass} ${i <= shown ? "text-amber-400" : "text-neutral-200 dark:text-neutral-700"} transition-colors`}
            fill="currentColor"
          >
            <path d="M12 2.5l2.9 6.4 6.9.7-5.2 4.7 1.5 6.9L12 17.6l-6.1 3.6 1.5-6.9L2.2 9.6l6.9-.7L12 2.5z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

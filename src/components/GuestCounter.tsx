interface GuestCounterProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export default function GuestCounter({
  value,
  onChange,
  min = 1,
  max = 20,
}: GuestCounterProps) {
  function decrement() {
    if (value > min) onChange(value - 1);
  }

  function increment() {
    if (value < max) onChange(value + 1);
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-neutral-300 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-neutral-900">Huéspedes</p>
        <p className="text-xs text-neutral-500">Número máximo permitido</p>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-neutral-300 text-neutral-600 text-lg leading-none disabled:opacity-30 disabled:cursor-not-allowed hover:border-neutral-900 hover:text-neutral-900 transition-colors"
          aria-label="Reducir huéspedes"
        >
          −
        </button>
        <span className="w-5 text-center text-sm font-medium text-neutral-900 tabular-nums">
          {value}
        </span>
        <button
          type="button"
          onClick={increment}
          disabled={value >= max}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-neutral-300 text-neutral-600 text-lg leading-none disabled:opacity-30 disabled:cursor-not-allowed hover:border-neutral-900 hover:text-neutral-900 transition-colors"
          aria-label="Aumentar huéspedes"
        >
          +
        </button>
      </div>
    </div>
  );
}
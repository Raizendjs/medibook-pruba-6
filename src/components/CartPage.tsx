import { useState } from "react";
import { supabase } from "../lib/supabase";

type CartItem = {
  id: string;
  check_in: string;
  check_out: string;
  start_time: string | null;
  end_time: string | null;
  price_per_night: number;
  total_price: number;
  listing: {
    id: string;
    title: string;
    city: string;
    country: string;
    currency: string;
    coverUrl: string | null;
  };
};

export default function CartPage({ initialItems }: { initialItems: CartItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function removeItem(id: string) {
    setRemovingId(id);
    const { error } = await supabase.from("cart_items").delete().eq("id", id);
    setRemovingId(null);
    if (!error) setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const total = items.reduce((sum, i) => sum + Number(i.total_price), 0);
  const currency = items[0]?.listing.currency ?? "USD";

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">🛒</div>
        <p className="text-neutral-900 dark:text-white font-semibold">Tu carrito está vacío</p>
        <p className="text-neutral-500 dark:text-slate-400 text-sm mt-1">
          Explora propiedades y agrega alguna para reservar.
        </p>
        <a
          href="/listings/"
          className="inline-block mt-4 rounded-xl bg-[#FF385C] text-white font-semibold px-5 py-2.5 text-sm hover:bg-[#E31C5F] transition"
        >
          Ver propiedades
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 rounded-2xl border border-neutral-200 dark:border-slate-800 dark:bg-slate-900 p-4"
          >
            <div className="shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-neutral-100 dark:bg-slate-800">
              {item.listing.coverUrl ? (
                <img src={item.listing.coverUrl} className="w-full h-full object-cover" alt={item.listing.title} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400 dark:text-slate-500 text-xs">
                  Sin foto
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-neutral-900 dark:text-white truncate">{item.listing.title}</p>
              <p className="text-sm text-neutral-500 dark:text-slate-400 mt-0.5">
                {item.listing.city}, {item.listing.country}
              </p>
              <p className="text-sm text-neutral-700 dark:text-slate-300 mt-2">
                📅 {item.check_in}
                {item.start_time && item.end_time && (
                  <> · 🕐 {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}</>
                )}
              </p>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white mt-1">
                {item.listing.currency} {item.total_price}
              </p>
            </div>

            <button
              onClick={() => removeItem(item.id)}
              disabled={removingId === item.id}
              className="self-start text-xs font-medium text-red-500 hover:underline disabled:opacity-50"
            >
              {removingId === item.id ? "..." : "Quitar"}
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-neutral-200 dark:border-slate-800 dark:bg-slate-900 p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500 dark:text-slate-400">Total ({items.length} reserva{items.length > 1 ? "s" : ""})</p>
          <p className="text-xl font-bold text-neutral-900 dark:text-white">{currency} {total.toFixed(2)}</p>
        </div>
        <a
          href="/checkout/"
          className="rounded-xl bg-[#FF385C] hover:bg-[#E31C5F] text-white font-semibold px-6 py-3 text-sm transition"
        >
          Proceder al pago
        </a>
      </div>
    </div>
  );
}

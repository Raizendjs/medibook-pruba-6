export const LISTING_CATEGORIES = [
  { value: "medico", label: "Consultorio médico", icon: "🩺" },
  { value: "dental", label: "Consultorio dental", icon: "🦷" },
  { value: "fisioterapia", label: "Fisioterapia", icon: "🏃" },
  { value: "psicologia", label: "Psicología", icon: "🧠" },
  { value: "otro", label: "Otro espacio", icon: "🏥" },
] as const;

export type ListingCategory = (typeof LISTING_CATEGORIES)[number]["value"];

export function categoryLabel(value: string | null | undefined): string {
  return LISTING_CATEGORIES.find((c) => c.value === value)?.label ?? "Otro espacio";
}

export function categoryIcon(value: string | null | undefined): string {
  return LISTING_CATEGORIES.find((c) => c.value === value)?.icon ?? "🏥";
}

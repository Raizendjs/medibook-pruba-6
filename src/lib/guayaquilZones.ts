export const GUAYAQUIL_ZONES = [
  { value: "via_samborondon", label: "Vía Samborondón" },
  { value: "kennedy", label: "Kennedy" },
  { value: "alborada", label: "Alborada" },
  { value: "centro", label: "Centro" },
  { value: "ceibos", label: "Los Ceibos" },
  { value: "urdesa", label: "Urdesa" },
  { value: "otro", label: "Otra zona" },
] as const;

export type GuayaquilZone = (typeof GUAYAQUIL_ZONES)[number]["value"];

export function zoneLabel(value: string | null | undefined): string {
  return GUAYAQUIL_ZONES.find((z) => z.value === value)?.label ?? "Otra zona";
}

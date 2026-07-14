import type { SalaryPeriod } from "@prisma/client";
import { SALARY_PERIOD_LABELS } from "./const";

export function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "právě teď";
  const m = Math.floor(s / 60);
  if (m < 60) return `před ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `před ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `před ${d} d`;
  return date.toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });
}

export function formatSalary(
  min: number | null,
  max: number | null,
  period: SalaryPeriod | null
): string | null {
  if (min == null && max == null) return null;
  const unit = period ? ` ${SALARY_PERIOD_LABELS[period]}` : " Kč";
  const fmt = (n: number) => n.toLocaleString("cs-CZ");
  if (min != null && max != null) return `${fmt(min)}–${fmt(max)}${unit}`;
  if (min != null) return `od ${fmt(min)}${unit}`;
  return `do ${fmt(max!)}${unit}`;
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("cs-CZ", { month: "numeric", year: "numeric" });
}

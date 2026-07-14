import { RESERVED_HANDLES } from "./const";

/** „Šéf Pepa Novák“ → „sef-pepa-novak“ */
export function slugifyHandle(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
  return base.length >= 3 ? base : `ucet-${base}`.slice(0, 30);
}

export function isValidHandle(handle: string): boolean {
  return /^[a-z0-9-]{3,30}$/.test(handle) && !RESERVED_HANDLES.has(handle);
}

"use client";

import { useEffect, useRef, useState } from "react";
import { BadgeCheck } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Input, Label, FieldHint } from "@/components/ui/Field";

export type InstitutionHit = {
  id: string;
  name: string;
  handle: string;
  city: string | null;
  verified: boolean;
  avatarImageId: string | null;
};

/**
 * Autocomplete podniků. Vyplní hidden input `institutionId`, pokud uživatel
 * vybere účet; jinak zůstává volný text v `institutionName` (UNLINKED záznam).
 */
export function InstitutionPicker({
  nameField = "institutionName",
  idField = "institutionId",
  defaultName = "",
  label = "Podnik",
}: {
  nameField?: string;
  idField?: string;
  defaultName?: string;
  label?: string;
}) {
  const [query, setQuery] = useState(defaultName);
  const [selectedId, setSelectedId] = useState<string>("");
  const [hits, setHits] = useState<InstitutionHit[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const search = (value: string) => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      if (value.trim().length < 2) {
        setHits([]);
        return;
      }
      try {
        const res = await fetch(`/api/search/institutions?q=${encodeURIComponent(value)}`);
        if (res.ok) {
          const data = await res.json();
          setHits(data.results ?? []);
          setOpen(true);
        }
      } catch {
        /* ticho */
      }
    }, 250);
  };

  return (
    <div className="relative" ref={boxRef}>
      <Label htmlFor={nameField}>{label}</Label>
      <Input
        id={nameField}
        name={nameField}
        value={query}
        required
        minLength={2}
        maxLength={80}
        autoComplete="off"
        placeholder="Začni psát název podniku…"
        onChange={(e) => {
          setQuery(e.target.value);
          setSelectedId("");
          search(e.target.value);
        }}
        onFocus={() => hits.length > 0 && setOpen(true)}
      />
      <input type="hidden" name={idField} value={selectedId} />
      {selectedId ? (
        <FieldHint>✓ Propojeno s účtem — podnik dostane žádost o potvrzení.</FieldHint>
      ) : (
        <FieldHint>Když podnik vybereš ze seznamu, požádáme ho o ověření. Volný text = neověřený záznam.</FieldHint>
      )}
      {open && hits.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 w-full overflow-hidden rounded-card border-2 border-vinyl bg-porcelain shadow-diner"
        >
          {hits.map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-chrome-light"
                onClick={() => {
                  setQuery(hit.name);
                  setSelectedId(hit.id);
                  setOpen(false);
                }}
              >
                <Avatar name={hit.name} imageId={hit.avatarImageId} size="sm" />
                <span className="min-w-0">
                  <span className="flex items-center gap-1 truncate text-sm font-extrabold">
                    {hit.name}
                    {hit.verified && <BadgeCheck className="size-4 shrink-0 text-teal" aria-label="Ověřený podnik" />}
                  </span>
                  <span className="block truncate text-xs text-smoke">
                    @{hit.handle}
                    {hit.city ? ` · ${hit.city}` : ""}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { ChefHat, Store } from "lucide-react";

const STEPS = {
  person: [
    { title: "Založ si profil", text: "Jméno, fotka, dovednosti a praxe. Žádné PDF životopisy — profil za tebe mluví pořád." },
    { title: "Nech si potvrdit praxi", text: "Podniky, kde jsi pracoval/a, ti potvrdí praxi i s referencí. Badge ✓ Ověřeno má váhu." },
    { title: "Přihlas se za minutu", text: "Na pozici se hlásíš jedním kliknutím profilem. Nebo si tě podniky najdou samy." },
  ],
  institution: [
    { title: "Vystavte pozici", text: "Název, mzda, úvazek — inzerát je venku za pár minut a vidí ho celá gastro komunita." },
    { title: "Vybírejte podle ověřené praxe", text: "U každého uchazeče vidíte skutečnou praxi potvrzenou jinými podniky, fotky práce a dovednosti." },
    { title: "Pište si rovnou", text: "Chat s uchazeči přímo v aplikaci. Žádné ztracené e-maily, žádné čekání." },
  ],
} as const;

export function HowItWorks() {
  const [tab, setTab] = useState<"person" | "institution">("person");

  const tabClass = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-full border-2 border-vinyl px-5 py-2 font-extrabold ${
      active ? "bg-cherry text-white shadow-diner-sm" : "bg-porcelain hover:bg-chrome-light"
    }`;

  return (
    <div>
      <div className="mb-8 flex justify-center gap-3">
        <button type="button" className={tabClass(tab === "person")} onClick={() => setTab("person")}>
          <ChefHat className="size-5" aria-hidden /> Jsem z gastra
        </button>
        <button type="button" className={tabClass(tab === "institution")} onClick={() => setTab("institution")}>
          <Store className="size-5" aria-hidden /> Jsme podnik
        </button>
      </div>
      <ol className="grid gap-5 sm:grid-cols-3">
        {STEPS[tab].map((step, index) => (
          <li key={step.title} className="rounded-card border-2 border-vinyl bg-porcelain p-5 shadow-diner">
            <span className="font-display text-4xl text-cherry">{index + 1}</span>
            <h3 className="mt-2 text-lg font-extrabold">{step.title}</h3>
            <p className="mt-1 text-sm text-smoke">{step.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

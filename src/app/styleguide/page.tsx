import type { Metadata } from "next";
import { Heart, MessageCircle, Search, Briefcase } from "lucide-react";
import { Logo, CookusMark } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Input, Label, Select, Textarea, FieldHint, FieldError } from "@/components/ui/Field";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState, Sparkle } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Design system" };

const COLORS = [
  ["cherry", "#D62828", "primární — CTA, akcenty"],
  ["ketchup", "#A31621", "hover, tmavé akcenty"],
  ["vanilla", "#FFF6E9", "pozadí stránek"],
  ["porcelain", "#FFFDF6", "karty, plochy"],
  ["vinyl", "#221A15", "text, obrysy, stíny"],
  ["smoke", "#6E645C", "sekundární text"],
  ["chrome", "#D8D3CB", "rámečky"],
  ["mustard", "#F2A93B", "zvýraznění"],
  ["teal", "#12756B", "ověřeno, úspěch"],
] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="font-display mb-4 text-2xl">{title}</h2>
      {children}
    </section>
  );
}

export default function StyleguidePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-2 font-script text-xl text-cherry">design system</div>
      <h1 className="font-display mb-1 text-4xl">Cookus UI</h1>
      <p className="mb-10 text-smoke">
        Živá dokumentace komponent. Zdroj pravdy tokenů: <code>src/app/globals.css</code> (@theme),
        pravidla: <code>docs/brand/cookus-brand-guidelines.pdf</code>.
      </p>

      <Section title="Logo">
        <div className="flex flex-wrap items-center gap-8">
          <Logo size="lg" href={null} />
          <div className="rounded-card border-2 border-vinyl bg-cherry p-4">
            <Logo size="md" href={null} inverse />
          </div>
          <CookusMark size={40} />
        </div>
      </Section>

      <Section title="Barvy">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {COLORS.map(([name, hex, use]) => (
            <div key={name} className="overflow-hidden rounded-card border-2 border-vinyl bg-porcelain shadow-diner-sm">
              <div className="h-14 border-b-2 border-vinyl" style={{ background: hex }} />
              <div className="p-2 text-xs">
                <div className="font-extrabold">{name}</div>
                <div className="text-smoke">{hex}</div>
                <div className="mt-0.5 text-smoke">{use}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typografie">
        <div className="space-y-3">
          <div className="font-display text-4xl">Alfa Slab One — nadpisy</div>
          <div className="font-script text-2xl text-cherry">Pacifico — akcenty a taglines</div>
          <p className="text-base">
            Archivo 400 — běžný text. Příliš žluťoučký kůň úpěl ďábelské ódy.{" "}
            <b className="font-semibold">SemiBold 600 pro důrazy</b> a{" "}
            <span className="font-extrabold">ExtraBold 800 pro tlačítka a labely</span>.
          </p>
        </div>
      </Section>

      <Section title="Tlačítka">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primární akce</Button>
          <Button variant="secondary">Sekundární</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Smazat</Button>
          <Button size="sm">Malé</Button>
          <Button size="lg">Velké CTA</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section title="Badge">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="teal">✓ Ověřeno podnikem</Badge>
          <Badge variant="mustard">Nové</Badge>
          <Badge>Brigáda</Badge>
          <Badge variant="cherry">3</Badge>
          <Badge variant="outline">Neaktivní</Badge>
        </div>
      </Section>

      <Section title="Avatary">
        <div className="flex flex-wrap items-end gap-3">
          <Avatar name="Karel Dvořák" size="xl" />
          <Avatar name="Bára Malá" size="lg" />
          <Avatar name="Bistro U Chroma" size="md" />
          <Avatar name="Hotel Imperial" size="sm" />
          <Avatar name="Cookus" size="xs" />
        </div>
      </Section>

      <Section title="Formuláře">
        <Card className="max-w-md p-5">
          <div className="space-y-4">
            <div>
              <Label htmlFor="sg-name">Jméno</Label>
              <Input id="sg-name" placeholder="Karel Dvořák" />
              <FieldHint>Zobrazí se na tvém profilu.</FieldHint>
            </div>
            <div>
              <Label htmlFor="sg-city">Město</Label>
              <Select id="sg-city" defaultValue="Praha">
                <option>Praha</option>
                <option>Brno</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="sg-bio">Bio</Label>
              <Textarea id="sg-bio" placeholder="Krátké resumé…" />
              <FieldError>Ukázka chybové hlášky.</FieldError>
            </div>
            <Button>Uložit</Button>
          </div>
        </Card>
      </Section>

      <Section title="Taby">
        <Tabs
          items={[
            { href: "#", label: "Fotky", active: true, count: 12 },
            { href: "#", label: "Praxe", active: false, count: 3 },
            { href: "#", label: "Info", active: false },
          ]}
        />
      </Section>

      <Section title="Karty">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-4" interactive>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-lg font-extrabold">Šéfkuchař/ka</h3>
              <Badge variant="mustard">Plný úvazek</Badge>
            </div>
            <p className="text-sm text-smoke">Bistro U Chroma · Praha</p>
            <p className="mt-1 font-extrabold tabular-nums">45 000–60 000 Kč/měs</p>
            <div className="mt-3">
              <Button size="sm">Přihlásit se profilem</Button>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-extrabold">Sous chef · Bistro U Chroma</h3>
              <Badge variant="teal">✓ Ověřeno</Badge>
            </div>
            <p className="text-sm text-smoke">2023–2025 · potvrzeno podnikem</p>
            <blockquote className="mt-2 border-l-3 border-teal pl-3 text-sm">
              „Karel táhl večerní servis i při plné rezervaci. Kdykoli znovu.“
            </blockquote>
          </Card>
        </div>
      </Section>

      <Section title="Chat bubliny">
        <div className="flex max-w-sm flex-col gap-2">
          <div className="self-start rounded-card border-2 border-vinyl bg-porcelain px-4 py-2 text-sm">
            Ahoj! Máte ještě volnou tu směnu v sobotu? 🙌
          </div>
          <div className="self-end rounded-card border-2 border-vinyl bg-cherry px-4 py-2 text-sm text-white">
            Jasně, počítáme s tebou 🔥
          </div>
        </div>
      </Section>

      <Section title="Prázdný stav">
        <EmptyState
          title="Zatím tu nic není"
          description="Přidej první fotku svého jídla a ukaž, co umíš."
          action={<Button size="sm">Přidat fotku</Button>}
        />
      </Section>

      <Section title="Ikony (lucide, tah 2px)">
        <div className="flex gap-4 text-vinyl">
          <Heart className="size-6" />
          <MessageCircle className="size-6" />
          <Search className="size-6" />
          <Briefcase className="size-6" />
          <Sparkle className="size-6" />
        </div>
      </Section>

      <div className="checker-red h-8 rounded-card border-2 border-vinyl" />
    </main>
  );
}

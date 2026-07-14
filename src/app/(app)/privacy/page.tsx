import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ochrana osobních údajů" };

export default function PrivacyPage() {
  return (
    <article className="prose mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-3xl">Ochrana osobních údajů</h1>
      <p className="text-sm text-smoke">Platné od 14. 7. 2026 · Cookus (MVP provoz)</p>

      <section className="space-y-2 text-sm leading-relaxed">
        <h2 className="font-display text-xl">Jaká data zpracováváme</h2>
        <p>
          E-mail a heslo (uložené jako bezpečný otisk), profilové údaje, které sám/sama vyplníš (jméno, headline, bio,
          město, dovednosti, praxe), nahrané fotky, obsah (posty, komentáře, zprávy, přihlášky) a technické záznamy
          nutné pro provoz (IP adresa pro ochranu proti zneužití).
        </p>

        <h2 className="font-display text-xl">K čemu je používáme</h2>
        <p>
          Výhradně k provozu platformy: zobrazování profilů, zprostředkování pracovních nabídek, zprávy mezi účty
          a notifikace (v aplikaci, případně e-mailem). Data neprodáváme a nepředáváme třetím stranám pro marketing.
        </p>

        <h2 className="font-display text-xl">Viditelnost</h2>
        <p>
          Profil, fotky a potvrzená praxe jsou veřejné — to je smysl platformy. Zprávy vidí jen účastníci konverzace.
          Přihlášku na pozici vidí jen daný podnik.
        </p>

        <h2 className="font-display text-xl">Tvoje práva</h2>
        <p>
          Účet můžeš kdykoli smazat v Nastavení — smažou se profil, fotky, praxe, inzeráty, přihlášky i konverzace.
          Pro export dat nebo dotazy napiš na privacy@cookus.cz.
        </p>
      </section>
    </article>
  );
}

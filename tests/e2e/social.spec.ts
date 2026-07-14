import { test, expect } from "@playwright/test";
import { join } from "node:path";
import { login } from "./helpers";

test.describe("Sociální vrstva", () => {
  test("feed: výchozí tab Přátelé (chronologicky), tab Vše ukáže všechny", async ({ page }) => {
    await login(page, "karel@cookus.cz");
    await page.goto("/feed");
    // Karel má přátele (bistro, bára) → výchozí tab Přátelé; post od bistra je vidět
    await expect(page.getByText(/Sobotní brunch od 9:00/)).toBeVisible();
    // post od Tomáše (není přítel) v tabu Přátelé není
    await expect(page.getByText(/Flat white a rosetta/)).toHaveCount(0);
    // tab Vše ukáže globální chronologický feed
    await page.getByRole("link", { name: "Vše" }).click();
    await expect(page.getByText(/Flat white a rosetta/)).toBeVisible();
    await expect(page.getByRole("button", { name: /lajk/i }).first()).toBeVisible();
  });

  test("like je optimistický a idempotentní", async ({ page }) => {
    await login(page, "marta@cookus.cz");
    await page.goto("/feed");
    // Připni kartu podle indexu (stabilní) — najdi první ještě neolajkovanou.
    // Filtr přímo v lokátoru by se po kliknutí převyhodnotil a skočil jinam.
    const articles = page.getByRole("article");
    const total = await articles.count();
    let card = null;
    for (let i = 0; i < total; i++) {
      if (await articles.nth(i).getByRole("button", { name: "Dát lajk" }).count()) {
        card = articles.nth(i);
        break;
      }
    }
    expect(card, "očekávám aspoň jeden neolajkovaný post").not.toBeNull();

    const likeButton = card!.getByRole("button", { name: "Dát lajk" });
    const countBefore = Number(await likeButton.textContent());
    await likeButton.click();
    // optimistická odezva ve stejné kartě
    await expect(card!.getByRole("button", { name: "Zrušit lajk" })).toHaveText(String(countBefore + 1));
    // unlike vrátí zpět
    await card!.getByRole("button", { name: "Zrušit lajk" }).click();
    await expect(card!.getByRole("button", { name: "Dát lajk" })).toHaveText(String(countBefore));
  });

  test("vytvoření postu s cropem 4:5 → profil grid → komentář → notifikace autorovi", async ({ page }) => {
    await login(page, "klara@cookus.cz");
    await page.goto("/post/new");

    // upload + crop
    await page.locator('input[type="file"]').setInputFiles(join(__dirname, "..", "..", "prisma", "seed-images", "dish-cake-sq.jpg"));
    await page.getByRole("radio", { name: "4:5 portrét" }).click();
    await page.getByRole("button", { name: "Použít výřez" }).click();
    // Počkej, až upload doběhne a objeví se náhled (jinak fill caption závodí s re-renderem)
    await expect(page.getByAltText("Náhled fotky")).toBeVisible();
    const caption = page.getByLabel("Popisek");
    await caption.fill("Testovací dort z e2e 🍰");
    // Publikovat se odemkne až po nastavení preview; ověř, že caption drží hodnotu před submitem
    await expect(caption).toHaveValue("Testovací dort z e2e 🍰");
    const publish = page.getByRole("button", { name: "Publikovat" });
    await expect(publish).toBeEnabled();
    await publish.click();
    await expect(page).toHaveURL(/\/post\/[a-z0-9]+/);
    // scope na obsah stránky — text je i ve skrytém route-announceru (titulek)
    await expect(page.getByRole("main").getByText("Testovací dort z e2e 🍰")).toBeVisible();
    const postUrl = page.url();

    // fotka je v gridu profilu
    await page.goto("/p/klara-cukrarka");
    await expect(page.locator(`a[href="${new URL(postUrl).pathname}"]`)).toBeVisible();

    // jiný uživatel komentuje
    await page.getByRole("button", { name: "Menu účtu" }).click();
    await page.getByRole("button", { name: "Odhlásit se" }).click();
    await login(page, "eva@cookus.cz");
    await page.goto(postUrl);
    await page.getByLabel("Komentář").fill("Vypadá skvěle! 😍");
    await page.getByRole("button", { name: "Odeslat" }).click();
    await expect(page.getByText("Vypadá skvěle! 😍")).toBeVisible();

    // autorka dostala notifikace (komentář)
    await page.getByRole("button", { name: "Menu účtu" }).click();
    await page.getByRole("button", { name: "Odhlásit se" }).click();
    await login(page, "klara@cookus.cz");
    await page.goto("/notifications");
    await expect(page.getByText(/Eva Horká okomentoval/)).toBeVisible();
  });

  test("adresář lidí filtruje podle „hledám práci“", async ({ page }) => {
    await page.goto("/people?openToWork=1");
    await expect(page.getByText("Karel Dvořák")).toBeVisible();
    await expect(page.getByText("Klára Veselá")).toHaveCount(0); // nehledá práci
  });
});

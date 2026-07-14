import { test, expect } from "@playwright/test";
import { login } from "./helpers";

async function logout(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Menu účtu" }).click();
  await page.getByRole("button", { name: "Odhlásit se" }).click();
  await page.waitForURL("/");
}

test.describe("Přátelé a feed přátel", () => {
  test("žádost → přijetí → chronologický feed přátel + notifikace", async ({ page }) => {
    // Retry-safe úklid: odstranit případný vztah ondra↔jirka z předchozího pokusu
    await login(page, "ondra@cookus.cz");
    await page.goto("/friends");
    for (const label of ["Odebrat", "Zrušit žádost", "Odmítnout"]) {
      const button = page.getByRole("button", { name: label }).first();
      if (await button.count()) {
        page.once("dialog", (d) => d.accept());
        await button.click();
        await expect(button).toBeHidden();
      }
    }

    // Ondra požádá Jirku o přátelství z profilu
    await page.goto("/p/jirka-kuchar");
    await page.getByRole("button", { name: "Přidat do přátel" }).click();
    await expect(page.getByRole("button", { name: /Žádost odeslána/ })).toBeVisible();

    // Jirka žádost přijme na /friends
    await logout(page);
    await login(page, "jirka@cookus.cz");
    await page.goto("/friends");
    await expect(page.getByText("Ondřej Vlk")).toBeVisible();
    await page.getByRole("button", { name: "Přijmout" }).click();
    await expect(page.getByRole("heading", { name: /Moji lidé \(1\)/ })).toBeVisible();

    // Jirkův feed přátel: post Ondry + vlastní, cizí ne — čistě chronologicky
    await page.goto("/feed");
    await expect(page.getByText(/Degustace: ryzlinky/)).toBeVisible();
    await expect(page.getByText(/Smash burger z hovězího/)).toBeVisible();
    await expect(page.getByText(/Flat white a rosetta/)).toHaveCount(0);

    // Ondra dostal notifikaci o přijetí
    await logout(page);
    await login(page, "ondra@cookus.cz");
    await page.goto("/notifications");
    await expect(page.getByText(/Jirka Novák přijal\/a tvoji žádost/).first()).toBeVisible();

    // a na profilu Jirky teď vidí stav Přátelé
    await page.goto("/p/jirka-kuchar");
    await expect(page.getByRole("button", { name: /Přátelé/ })).toBeVisible();
  });

  test("bez přátel: výchozí tab Vše a CTA v prázdném tabu Přátelé", async ({ page }) => {
    await login(page, "marta@cookus.cz");
    await page.goto("/feed");
    // Marta nemá přátele → výchozí Vše, posty vidí
    await expect(page.getByText(/Flat white a rosetta/)).toBeVisible();
    await page.getByRole("link", { name: /Přátelé/ }).click();
    await expect(page.getByText("Zatím nemáš přátele")).toBeVisible();
    await expect(page.getByRole("link", { name: "Najít lidi" })).toBeVisible();
  });

  test("poke z profilu a pokeback z notifikace", async ({ page }) => {
    // Klára šťouchne Tomáše
    await login(page, "klara@cookus.cz");
    await page.goto("/p/tomas-barista");
    await page.getByRole("button", { name: /Šťouchnout/ }).click();
    await expect(page.getByRole("button", { name: /Šťouchnuto!/ })).toBeVisible();

    // Tomáš vidí notifikaci a šťouchne zpátky jedním kliknutím
    await logout(page);
    await login(page, "tomas@cookus.cz");
    await page.goto("/notifications");
    await expect(page.getByText(/Klára Veselá tě šťouchl\/a/).first()).toBeVisible();
    await page.getByRole("button", { name: "👉 Šťouchnout zpátky" }).click();
    await expect(page.getByRole("button", { name: /Šťouchnuto!/ })).toBeVisible();

    // Klára dostala pokeback
    await logout(page);
    await login(page, "klara@cookus.cz");
    await page.goto("/notifications");
    await expect(page.getByText(/Tomáš Král tě šťouchl\/a/).first()).toBeVisible();
  });
});

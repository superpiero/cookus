import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Ověřená praxe (differentiator)", () => {
  test("profil ukazuje ověřenou praxi s reportem, PENDING bez badge", async ({ page }) => {
    await page.goto("/p/karel-dvorak?tab=praxe");
    await expect(page.getByText("Ověřeno podnikem")).toBeVisible();
    await expect(page.getByText(/Karel táhl večerní servis/)).toBeVisible();
    // PENDING a UNLINKED záznamy jsou vidět jako neověřené
    await expect(page.getByText("Neověřeno").first()).toBeVisible();
  });

  test("podnik potvrdí praxi s reportem → badge na profilu", async ({ page }) => {
    await login(page, "hotel@cookus.cz");
    await page.goto("/verifications");
    await expect(page.getByText("Karel Dvořák")).toBeVisible();

    await page
      .getByLabel(/Report \/ reference/)
      .first()
      .fill("Spolehlivý parťák na teplé kuchyni, sezónu odjel bez zaváhání.");
    await page.getByRole("button", { name: "Potvrdit praxi" }).first().click();
    // Po potvrzení revalidace odebere kartu ze seznamu žádostí (docs/03 §1.3)
    await expect(page.getByText("Karel Dvořák")).toBeHidden();

    // profil Karla teď ukazuje 2× ověřeno
    await page.goto("/p/karel-dvorak?tab=praxe");
    await expect(page.getByText("Ověřeno podnikem")).toHaveCount(2);
    await expect(page.getByText(/Spolehlivý parťák na teplé kuchyni/)).toBeVisible();
  });

  test("osoba přidá neověřenou praxi volným textem (cold start, docs/04 #2)", async ({ page }) => {
    await login(page, "jirka@cookus.cz");
    await page.goto("/settings");
    await page.getByRole("button", { name: "+ Přidat praxi" }).click();
    const form = page.locator("form").filter({ hasText: "Přidat praxi" });
    await form.getByLabel("Podnik").fill("Motorest Skřet (už neexistuje)");
    await form.getByLabel("Pozice").fill("Kuchař");
    await form.getByLabel("Měsíc začátku").selectOption("3");
    await form.getByLabel("Rok začátku").selectOption("2018");
    await form.getByLabel("Měsíc konce").selectOption("11");
    await form.getByLabel("Rok konce").selectOption("2019");
    await form.getByRole("button", { name: "Přidat praxi" }).click();
    // úspěch → formulář se zavře a záznam se objeví v seznamu
    await expect(page.getByText(/Motorest Skřet/)).toBeVisible();

    await page.goto("/p/jirka-kuchar?tab=praxe");
    await expect(page.getByText(/Motorest Skřet/)).toBeVisible();
    await expect(page.getByText(/3\/2018 – 11\/2019/)).toBeVisible();
  });

  test("validační chyba nesmaže rozepsaný formulář (regrese: Safari datum + React reset)", async ({ page }) => {
    await login(page, "jirka@cookus.cz");
    await page.goto("/settings");
    await page.getByRole("button", { name: "+ Přidat praxi" }).click();
    const form = page.locator("form").filter({ hasText: "Přidat praxi" });
    await form.getByLabel("Podnik").fill("Testovací Hospoda");
    await form.getByLabel("Pozice").fill("Kuchař na zkoušku");
    // konec před začátkem → serverová validační chyba
    await form.getByLabel("Měsíc začátku").selectOption("5");
    await form.getByLabel("Rok začátku").selectOption("2020");
    await form.getByLabel("Měsíc konce").selectOption("4");
    await form.getByLabel("Rok konce").selectOption("2019");
    await form.getByRole("button", { name: "Přidat praxi" }).click();
    await expect(form.getByText("Konec nemůže být před začátkem.")).toBeVisible();
    // hodnoty musí přežít chybu (řízený formulář)
    await expect(form.getByLabel("Podnik")).toHaveValue("Testovací Hospoda");
    await expect(form.getByLabel("Pozice")).toHaveValue("Kuchař na zkoušku");
    await expect(form.getByLabel("Rok začátku")).toHaveValue("2020");
  });
});

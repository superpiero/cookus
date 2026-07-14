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

    const karelCard = page.locator("div").filter({ hasText: "Karel Dvořák" }).filter({ hasText: "Chef de partie" }).last();
    await page
      .getByLabel(/Report \/ reference/)
      .first()
      .fill("Spolehlivý parťák na teplé kuchyni, sezónu odjel bez zaváhání.");
    await page.getByRole("button", { name: "Potvrdit praxi" }).first().click();
    await expect(page.getByText(/Praxe potvrzena/)).toBeVisible();

    // profil Karla teď ukazuje 2× ověřeno
    await page.goto("/p/karel-dvorak?tab=praxe");
    await expect(page.getByText("Ověřeno podnikem")).toHaveCount(2);
    await expect(page.getByText(/Spolehlivý parťák na teplé kuchyni/)).toBeVisible();
  });

  test("osoba přidá neověřenou praxi volným textem (cold start, docs/04 #2)", async ({ page }) => {
    await login(page, "jirka@cookus.cz");
    await page.goto("/settings");
    await page.getByRole("button", { name: "+ Přidat praxi" }).click();
    await page.getByLabel("Podnik").fill("Motorest Skřet (už neexistuje)");
    await page.getByLabel("Pozice").fill("Kuchař");
    await page.getByLabel("Od").fill("2018-03");
    await page.getByLabel(/^Do/).fill("2019-11");
    await page.getByRole("button", { name: "Přidat praxi" }).click();
    await expect(page.getByText(/Praxe přidána\./)).toBeVisible();

    await page.goto("/p/jirka-kuchar?tab=praxe");
    await expect(page.getByText(/Motorest Skřet/)).toBeVisible();
  });
});

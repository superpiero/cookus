import { test, expect } from "@playwright/test";
import { join } from "node:path";
import { login } from "./helpers";

test.describe("Sociální vrstva", () => {
  test("feed zobrazuje posty s lajky a komentáři", async ({ page }) => {
    await login(page, "karel@cookus.cz");
    await page.goto("/feed");
    await expect(page.getByText(/Flat white a rosetta/)).toBeVisible();
    await expect(page.getByRole("button", { name: /lajk/i }).first()).toBeVisible();
  });

  test("like je optimistický a idempotentní", async ({ page }) => {
    await login(page, "marta@cookus.cz");
    await page.goto("/feed");
    const likeButton = page.getByRole("button", { name: "Dát lajk" }).first();
    const countBefore = Number(await likeButton.textContent());
    await likeButton.click();
    // optimistická odezva
    await expect(page.getByRole("button", { name: "Zrušit lajk" }).first()).toHaveText(String(countBefore + 1));
    // unlike vrátí zpět
    await page.getByRole("button", { name: "Zrušit lajk" }).first().click();
    await expect(page.getByRole("button", { name: "Dát lajk" }).first()).toHaveText(String(countBefore));
  });

  test("vytvoření postu s cropem 4:5 → profil grid → komentář → notifikace autorovi", async ({ page }) => {
    await login(page, "klara@cookus.cz");
    await page.goto("/post/new");

    // upload + crop
    await page.locator('input[type="file"]').setInputFiles(join(__dirname, "..", "..", "prisma", "seed-images", "dish-cake-sq.jpg"));
    await page.getByRole("radio", { name: "4:5 portrét" }).click();
    await page.getByRole("button", { name: "Použít výřez" }).click();
    await page.getByLabel("Popisek").fill("Testovací dort z e2e 🍰");
    await page.getByRole("button", { name: "Publikovat" }).click();
    await expect(page).toHaveURL(/\/post\/[a-z0-9]+/);
    await expect(page.getByText("Testovací dort z e2e 🍰")).toBeVisible();
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

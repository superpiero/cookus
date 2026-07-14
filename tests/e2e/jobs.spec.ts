import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Job board", () => {
  test("veřejný seznam s filtry v URL", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page.getByRole("heading", { name: "Nabídky práce" })).toBeVisible();
    await expect(page.getByText("Šéfkuchař/ka pro večerní provoz")).toBeVisible();

    await page.getByLabel("Město").selectOption("Brno");
    await page.getByRole("button", { name: "Filtrovat" }).click();
    await expect(page).toHaveURL(/city=Brno/);
    await expect(page.getByText("Barista/ka — specialty coffee")).toBeVisible();
    await expect(page.getByText("Šéfkuchař/ka pro večerní provoz")).toHaveCount(0);
  });

  test("přihláška profilem end-to-end + notifikace podniku", async ({ page }) => {
    await login(page, "jirka@cookus.cz");
    await page.goto("/jobs?city=Brno");
    await page.getByText("Barista/ka — specialty coffee").click();
    await page.getByRole("button", { name: "Přihlásit se profilem" }).click();
    await page.getByLabel("Zpráva (volitelná)").fill("Kafe je moje druhá láska hned po omáčkách.");
    await page.getByRole("button", { name: "Odeslat přihlášku" }).click();
    // Po odeslání revalidace nahradí formulář stavem přihlášky (docs/03 §3.3)
    await expect(page.getByText(/Už ses přihlásil/)).toBeVisible();

    // podnik vidí přihlášku i notifikaci
    await page.getByRole("button", { name: "Menu účtu" }).click();
    await page.getByRole("button", { name: "Odhlásit se" }).click();
    await login(page, "kavarna@cookus.cz");
    await page.goto("/notifications");
    await expect(page.getByText(/Jirka Novák se hlásí/)).toBeVisible();
  });

  test("podnik spravuje uchazeče a mění stav", async ({ page }) => {
    await login(page, "bistro@cookus.cz");
    await page.goto("/jobs");
    await page.getByText("Šéfkuchař/ka pro večerní provoz").click();
    await page.getByRole("link", { name: /Uchazeči/ }).click();
    await expect(page.getByText("Karel Dvořák")).toBeVisible();
    await expect(page.getByText(/ověřená praxe/).first()).toBeVisible();

    // změna stavu na Přijat/a
    const karelCard = page.locator("li, div").filter({ hasText: "Karel Dvořák" }).last();
    await page.getByRole("group", { name: "Stav přihlášky" }).first().getByRole("button", { name: "Přijat/a" }).click();
    await expect(page.getByText("Přijat/a").first()).toBeVisible();
  });

  test("podnik vystaví novou pozici", async ({ page }) => {
    await login(page, "bar@cookus.cz");
    await page.goto("/jobs/new");
    await page.getByLabel("Název pozice").fill("Pomocná síla na bar (test)");
    await page.getByLabel("Kategorie").selectOption("POMOCNA_SILA");
    await page.getByLabel("Typ úvazku").selectOption("BRIGADA");
    await page.getByLabel("Město").selectOption("Praha");
    await page.getByLabel("Popis pozice").fill("Mytí skla, doplňování ledu, příprava garnishů. Zaučíme.");
    await page.getByRole("button", { name: "Vystavit pozici" }).click();
    await expect(page).toHaveURL(/\/jobs\/[a-z0-9]+$/);
    await expect(page.getByRole("heading", { name: "Pomocná síla na bar (test)" })).toBeVisible();
  });

  test("osoba vidí své přihlášky ve stavech", async ({ page }) => {
    await login(page, "tomas@cookus.cz");
    await page.goto("/applications");
    await expect(page.getByText("Barista/ka — specialty coffee")).toBeVisible();
    await expect(page.getByText("Přijat/a")).toBeVisible();
  });
});

import { test, expect } from "@playwright/test";

// „Otestuj homepage jako uživatel“ — konverzní cesta návštěvníka (docs/03 §6)
test.describe("Homepage", () => {
  test("ukazuje hodnotovou propozici a persony", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Práce v gastru/ })).toBeVisible();
    await expect(page.getByText("Reference, kterým se dá věřit")).toBeVisible();
    await expect(page.getByText("Kuchař Karel")).toBeVisible();
    await expect(page.getByText("Šéfová Simona")).toBeVisible();
    // živé pozice z DB
    await expect(page.getByRole("heading", { name: "Čerstvé pozice" })).toBeVisible();
  });

  test("neukazuje statistiky pod prahem důvěryhodnosti", async ({ page }) => {
    await page.goto("/");
    // seed má 9 lidí / 4 podniky → čísla se nesmí zobrazit (docs/04 #12)
    await expect(page.getByText(/lidí z gastra ·/)).toHaveCount(0);
  });

  test("CTA „Hledám práci“ vede na registraci osoby", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Hledám práci" }).first().click();
    await expect(page).toHaveURL(/\/register\?kind=person/);
    await expect(page.getByRole("radio", { name: "Jsem člověk z gastra" })).toHaveAttribute("aria-checked", "true");
  });

  test("CTA „Hledáme lidi“ předvolí podnik", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Hledáme lidi" }).first().click();
    await expect(page).toHaveURL(/\/register\?kind=institution/);
    await expect(page.getByRole("radio", { name: "Jsme podnik" })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByLabel("Typ podniku")).toBeVisible();
  });

  test("přepínač „Jak to funguje“ mění obsah kroků", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Nech si potvrdit praxi")).toBeVisible();
    await page.getByRole("button", { name: "Jsme podnik" }).click();
    await expect(page.getByText("Vybírejte podle ověřené praxe")).toBeVisible();
  });
});

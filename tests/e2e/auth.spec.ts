import { test, expect } from "@playwright/test";
import { login, PASSWORD } from "./helpers";

test.describe("Auth", () => {
  test("registrace nové osoby končí na nastavení profilu", async ({ page }) => {
    await page.goto("/register?kind=person");
    await page.getByLabel("Jméno a příjmení").fill("Testovací Kuchtík");
    await page.getByLabel("E-mail").fill(`kuchtik-${Date.now()}@test.cz`);
    await page.getByLabel("Heslo").fill(PASSWORD);
    await page.getByRole("button", { name: "Vytvořit profil", exact: true }).click();
    await expect(page).toHaveURL(/\/settings\?welcome=1/);
    await expect(page.getByText("Vítej v Cookus!")).toBeVisible();
  });

  test("duplicitní e-mail vrátí srozumitelnou chybu", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Jméno a příjmení").fill("Duplikát Dvořák");
    await page.getByLabel("E-mail").fill("karel@cookus.cz");
    await page.getByLabel("Heslo").fill(PASSWORD);
    await page.getByRole("button", { name: "Vytvořit profil", exact: true }).click();
    await expect(page.getByText(/už u nás účet má/)).toBeVisible();
  });

  test("login a logout", async ({ page }) => {
    await login(page, "karel@cookus.cz");
    await expect(page).toHaveURL(/\/feed/);
    await page.getByRole("button", { name: "Menu účtu" }).click();
    await page.getByRole("button", { name: "Odhlásit se" }).click();
    await expect(page).toHaveURL("/");
  });

  test("špatné heslo → generická hláška", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("karel@cookus.cz");
    await page.getByLabel("Heslo", { exact: true }).fill("spatne-heslo");
    await page.getByRole("button", { name: "Přihlásit se" }).click();
    await expect(page.getByText("Nesprávný e-mail nebo heslo.")).toBeVisible();
  });

  test("chráněná routa přesměruje na login s návratem", async ({ page }) => {
    await page.goto("/messages");
    await expect(page).toHaveURL(/\/login\?next=%2Fmessages/);
  });
});

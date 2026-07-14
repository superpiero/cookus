import { test, expect } from "@playwright/test";
import { login, PASSWORD } from "./helpers";

test.describe("Pozvánky", () => {
  test("pozvánka → registrace přes odkaz → žádost o přátelství od zvoucího", async ({ page }) => {
    const invitedEmail = `pozvany-${Date.now()}@test.cz`;

    // Karel pošle pozvánku
    await login(page, "karel@cookus.cz");
    await page.goto("/invite");
    await page.getByLabel("E-mail pozvané osoby či podniku").fill(invitedEmail);
    await page.getByLabel(/Osobní vzkaz/).fill("Pojď k nám, hledáme lidi!");
    await page.getByRole("button", { name: "Poslat pozvánku" }).click();
    await expect(page.getByText(/Pozvánka odeslána/)).toBeVisible();

    // odkaz je v seznamu
    const linkInput = page.getByLabel("Odkaz pozvánky").first();
    await expect(linkInput).toBeVisible();
    const inviteLink = await linkInput.inputValue();
    expect(inviteLink).toContain("/register?invite=");

    // odhlásit a otevřít pozvánku
    await page.getByRole("button", { name: "Menu účtu" }).click();
    await page.getByRole("button", { name: "Odhlásit se" }).click();
    await page.goto(new URL(inviteLink).pathname + new URL(inviteLink).search);

    // banner „zve tě Karel“ + registrace
    await expect(page.getByText(/Zve tě/)).toBeVisible();
    await expect(page.getByText("Karel Dvořák")).toBeVisible();
    await page.getByLabel("Jméno a příjmení").fill("Pozvaná Petra");
    await page.getByLabel("E-mail").fill(invitedEmail);
    await page.getByLabel("Heslo").fill(PASSWORD);
    await page.getByRole("button", { name: "Vytvořit profil", exact: true }).click();
    await expect(page).toHaveURL(/\/settings\?welcome=1/);

    // nový účet má žádost o přátelství od Karla
    await page.goto("/friends");
    await expect(page.getByText("Karel Dvořák")).toBeVisible();
    await expect(page.getByRole("button", { name: "Přijmout" })).toBeVisible();

    // Karel vidí pozvánku jako přijatou
    await page.getByRole("button", { name: "Menu účtu" }).click();
    await page.getByRole("button", { name: "Odhlásit se" }).click();
    await login(page, "karel@cookus.cz");
    await page.goto("/invite");
    await expect(page.getByText(/✓ Registrace/)).toBeVisible();
    await expect(page.getByText("Pozvaná Petra")).toBeVisible();
  });

  test("e-mail s existujícím účtem pozvat nejde", async ({ page }) => {
    await login(page, "bara@cookus.cz");
    await page.goto("/invite");
    await page.getByLabel("E-mail pozvané osoby či podniku").fill("karel@cookus.cz");
    await page.getByRole("button", { name: "Poslat pozvánku" }).click();
    await expect(page.getByText(/už na Cookus účet má/)).toBeVisible();
  });
});

import type { Page } from "@playwright/test";

export const PASSWORD = "cookus123";

export async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Heslo", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Přihlásit se" }).click();
  await page.waitForURL(/\/(feed|settings)/);
}

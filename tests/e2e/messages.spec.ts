import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Zprávy", () => {
  test("historie konverzace + odeslání s emoji quick-barem", async ({ page }) => {
    await login(page, "karel@cookus.cz");
    await page.goto("/messages");
    await expect(page.getByText("Bistro U Chroma")).toBeVisible();
    await page.getByText("Bistro U Chroma").click();
    await expect(page.getByText(/zkušební směnu/)).toBeVisible();

    await page.getByLabel("Zpráva").fill("Super, ve čtvrtek v 15:00 na místě");
    await page.getByRole("button", { name: "Vložit 🙌" }).click();
    await page.getByRole("button", { name: "Odeslat zprávu" }).click();
    await expect(page.getByText("Super, ve čtvrtek v 15:00 na místě🙌").first()).toBeVisible();
  });

  test("zpráva z profilu založí konverzaci a příjemce ji dostane", async ({ page }) => {
    await login(page, "ondra@cookus.cz");
    await page.goto("/p/marta-provozni");
    await page.getByRole("button", { name: "Napsat zprávu" }).click();
    await expect(page).toHaveURL(/\/messages\/[a-z0-9]+/);
    await page.getByLabel("Zpráva").fill("Ahoj Marto, nesháníš someliéra na akce?");
    await page.getByRole("button", { name: "Odeslat zprávu" }).click();
    await expect(page.getByText(/nesháníš someliéra/).first()).toBeVisible();

    // příjemkyně vidí konverzaci i unread badge v navigaci
    await page.getByRole("button", { name: "Menu účtu" }).click();
    await page.getByRole("button", { name: "Odhlásit se" }).click();
    await login(page, "marta@cookus.cz");
    await expect(page.getByLabel(/Zprávy \(\d+ nepřečtených\)/)).toBeVisible();
    await page.goto("/messages");
    await page.getByText("Ondřej Vlk").click();
    await expect(page.getByText(/nesháníš someliéra/).first()).toBeVisible();
  });
});

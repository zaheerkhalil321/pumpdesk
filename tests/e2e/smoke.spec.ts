import { test, expect } from "@playwright/test";

test.describe("Dispatch Control Tower Smoke Tests", () => {
  test("Schedule page loads with Midcoast Pumping branding and rig lanes", async ({ page }) => {
    await page.goto("/schedule");
    await expect(page).toHaveTitle(/PumpDesk/i);
    await expect(page.getByText("Midcoast Pumping")).toBeVisible();
    await expect(page.getByText("01 - 34M Putzmeister Boom")).toBeVisible();
    await expect(page.getByText("Pour Orders")).toBeVisible();
  });

  test("Customers directory navigation works", async ({ page }) => {
    await page.goto("/customers");
    await expect(page.getByText("Customers & Accounts")).toBeVisible();
    await expect(page.getByText("Turner Construction")).toBeVisible();
  });
});

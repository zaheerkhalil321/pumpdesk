import { test, expect } from "@playwright/test";

test.describe("Dispatch Control Tower Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.E2E_EMAIL;
    const password = process.env.E2E_PASSWORD;
    if (!email || !password) throw new Error("Set E2E_EMAIL and E2E_PASSWORD (a seeded local user).");

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("**/schedule");
  });

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

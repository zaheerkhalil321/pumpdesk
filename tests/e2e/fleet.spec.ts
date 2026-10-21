import { test, expect, type Page } from "@playwright/test";

// Needs the local Supabase stack with the seed loaded. Passwords come from the environment.
const PASSWORD = process.env.E2E_PASSWORD ?? "";

/** Opens a pump from the table. The click can land mid-refresh, so retry until the dialog is up. */
async function openPump(page: Page, label: string) {
  await expect(async () => {
    await page.getByText(label).first().click();
    await expect(page.getByRole("button", { name: "Edit Rig" })).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 15000 });
}

async function login(page: Page, email: string) {
  if (!PASSWORD) throw new Error("Set E2E_PASSWORD (the seeded local test password).");
  await page.goto("/login");
  await page.getByPlaceholder("you@company.com").fill(email);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/schedule");
}

test.describe("Fleet: pumps", () => {
  test("dispatcher adds a pump, edits it and deletes it", async ({ page }) => {
    const unit = `E${Date.now() % 100000}`;
    await login(page, "dispatcher@midcoast.test");

    await page.goto("/pumps");
    await page.getByRole("button", { name: "Add pump" }).click();
    const add = page.getByRole("dialog");
    await add.getByPlaceholder("e.g. 05 or P-04").fill(unit);
    await add.getByPlaceholder("e.g. 38Z or B50").fill("Z1");
    await add.getByRole("button", { name: "Add rig" }).click();
    await expect(page.getByText("New pump added to fleet")).toBeVisible();
    await expect(page.getByText(`${unit} · 38M`).first()).toBeVisible();

    await openPump(page, `${unit} · 38M`);
    await page.getByRole("button", { name: "Edit Rig" }).click();
    await page.getByPlaceholder("e.g. BSF 36-4.16 H").fill("Z2 Updated");
    await page.getByRole("button", { name: "Save specifications" }).click();
    await expect(page.getByText("Equipment details updated")).toBeVisible();

    await page.getByRole("button", { name: "Delete pump" }).first().click();
    await page.getByRole("dialog").filter({ hasText: `Delete unit ${unit}` }).getByRole("button", { name: "Delete pump" }).click();
    await expect(page.getByText("Pump deleted")).toBeVisible();
    await expect(page.getByText(`${unit} · 38M`)).toHaveCount(0);
  });

  test("Test Co owner sees only its own fleet", async ({ page }) => {
    await login(page, "owner@test-co.test");
    await page.goto("/pumps");
    await expect(page.getByText("T1 · 36M").first()).toBeVisible();
    await expect(page.getByText("01 · 34M")).toHaveCount(0);
  });

  test("read_only can read but pump saves are refused", async ({ page }) => {
    await login(page, "readonly@midcoast.test");
    await page.goto("/pumps");
    await openPump(page, "02 · 28M");
    await page.getByRole("button", { name: "Edit Rig" }).click();
    await page.getByRole("button", { name: "Save specifications" }).click();
    await expect(page.getByText("You don't have permission to do that.")).toBeVisible();
  });
});

test.describe("Fleet: operators", () => {
  test("dispatcher adds an operator, edits the profile and marks them inactive", async ({ page }) => {
    const first = `E2E${Date.now() % 100000}`;
    await login(page, "dispatcher@midcoast.test");

    await page.goto("/operators");
    await page.getByRole("button", { name: "Add operator" }).first().click();
    const add = page.getByRole("dialog");
    await add.getByPlaceholder("e.g. Rob", { exact: true }).fill(first);
    await add.getByPlaceholder("e.g. Black", { exact: true }).fill("Tester");
    await add.getByPlaceholder("(207) 555-0168").fill("2075550166");
    await add.getByRole("button", { name: "Add operator" }).click();
    await expect(page.getByText("Operator added successfully")).toBeVisible();

    await page.getByRole("link", { name: `${first} Tester` }).first().click();
    await page.waitForURL(/\/operators\/[0-9a-f-]{36}$/);
    await expect(page.getByText("(207) 555-0166").first()).toBeVisible();

    await page.getByRole("button", { name: /Edit profile/ }).first().click();
    const edit = page.getByRole("dialog");
    await edit.getByRole("switch", { name: "Operator is active" }).click();
    await edit.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Profile updated")).toBeVisible();
    await expect(page.getByText("Inactive").first()).toBeVisible();
  });
});

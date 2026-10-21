import { test, expect, type Page } from "@playwright/test";

// Needs the local Supabase stack with the seed loaded. Passwords come from the environment.
const PASSWORD = process.env.E2E_PASSWORD ?? "";
const MIDCOAST_CUSTOMER_ID = "e1000000-0000-4000-8000-000000000101";

async function login(page: Page, email: string) {
  if (!PASSWORD) throw new Error("Set E2E_PASSWORD (the seeded local test password).");
  await page.goto("/login");
  await page.getByPlaceholder("you@company.com").fill(email);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/schedule");
}

async function openCustomer(page: Page, name: string) {
  await page.goto("/customers");
  await page.getByText(name, { exact: true }).first().click();
  await page.getByRole("link", { name: "View details" }).click();
  await page.waitForURL(/\/customers\/[0-9a-f-]{36}$/);
}

test.describe("CRM: customers", () => {
  test("dispatcher creates a customer, edits it and marks it inactive", async ({ page }) => {
    const name = `E2E Paving ${Date.now()}`;
    await login(page, "dispatcher@midcoast.test");

    await page.goto("/customers");
    await page.getByRole("button", { name: "New customer" }).click();
    await page.getByPlaceholder("e.g. Acme Concrete Contractors").fill(name);
    await page.getByPlaceholder("e.g. John Doe (Superintendent)").fill("Nora Fields");
    await page.getByPlaceholder("(207) 555-0188").fill("2075550188");
    await page.getByRole("button", { name: "Add customer" }).click();
    await expect(page.getByText("Customer account created")).toBeVisible();
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible();

    await openCustomer(page, name);
    await page.getByRole("button", { name: /Edit/ }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.locator("input").first().fill(`${name} Renamed`);
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Customer details updated")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: `${name} Renamed` })).toBeVisible();

    await page.getByRole("button", { name: /Edit/ }).first().click();
    await page.getByRole("dialog").getByRole("switch", { name: "Customer is active" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Customer details updated")).toBeVisible();
    await expect(page.getByText("Inactive").first()).toBeVisible();
  });

  test("two tabs editing the same customer: the second save is refused as stale", async ({ browser }) => {
    const context = await browser.newContext();
    const a = await context.newPage();
    await login(a, "dispatcher@midcoast.test");
    await openCustomer(a, "Granite State Builders");
    const url = a.url();
    const b = await context.newPage();
    await b.goto(url);

    for (const [page, tier] of [[a, "A"], [b, "B"]] as const) {
      await page.getByRole("button", { name: /Edit/ }).first().click();
      const dialog = page.getByRole("dialog");
      await dialog.locator("input[type='email']").fill(`tab${tier.toLowerCase()}@granite.example`);
      await dialog.getByRole("button", { name: "Save changes" }).click();
      if (tier === "A") await expect(page.getByText("Customer details updated")).toBeVisible();
    }
    await expect(b.getByText(/Someone else changed this customer/)).toBeVisible();
    await context.close();
  });

  test("Test Co owner sees no Midcoast data", async ({ page }) => {
    await login(page, "owner@test-co.test");
    await page.goto("/customers");
    await expect(page.getByText("Lakeshore Builders").first()).toBeVisible();
    await expect(page.getByText("Accurate Concrete")).toHaveCount(0);
    await page.goto(`/customers/${MIDCOAST_CUSTOMER_ID}`);
    await expect(page.getByText(/could not be found/i)).toBeVisible();
  });

  test("read_only can read but saves are refused", async ({ page }) => {
    await login(page, "readonly@midcoast.test");
    await openCustomer(page, "Turner Construction");
    await page.getByRole("button", { name: /Edit/ }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("You don't have permission to do that.")).toBeVisible();
  });

  test("dispatcher adds, edits and deletes a job site", async ({ page }) => {
    const site = `E2E Site ${Date.now()}`;
    await login(page, "dispatcher@midcoast.test");
    await openCustomer(page, "Harbor Builders");

    await page.getByRole("button", { name: "Add site" }).first().click();
    const add = page.getByRole("dialog");
    await add.getByPlaceholder("e.g. Rockland Medical Plaza").fill(site);
    await add.getByPlaceholder("e.g. 18 Main Street").fill("5 Test Lane");
    await add.getByPlaceholder("e.g. Rockland", { exact: true }).fill("Belfast");
    await add.getByRole("button", { name: "Add job site" }).click();
    await expect(page.getByText("Job site added")).toBeVisible();

    await page.getByRole("button", { name: new RegExp(site) }).first().click();
    const edit = page.getByRole("dialog");
    await edit.locator("input").first().fill(`${site} v2`);
    await edit.getByRole("button", { name: "Save site" }).click();
    await expect(page.getByText("Job site updated")).toBeVisible();
    await expect(page.getByText(`${site} v2`).first()).toBeVisible();

    await page.getByRole("button", { name: new RegExp(`${site} v2`) }).first().click();
    await page.getByRole("button", { name: "Delete site" }).click();
    await expect(page.getByText("Job site deleted")).toBeVisible();
    await expect(page.getByText(`${site} v2`)).toHaveCount(0);
  });
});

test.describe("CRM: contacts", () => {
  test("dispatcher creates a contact, edits it and marks it inactive", async ({ page }) => {
    const first = `E2E${Date.now()}`;
    await login(page, "dispatcher@midcoast.test");

    await page.goto("/contacts");
    await page.getByRole("button", { name: "New contact" }).click();
    const add = page.getByRole("dialog");
    await add.getByPlaceholder("Alex", { exact: true }).fill(first);
    await add.getByPlaceholder("Morgan", { exact: true }).fill("Tester");
    await add.getByPlaceholder("(207) 555-0100").fill("2075550177");
    await add.getByPlaceholder("alex@accurate.example").fill("e2e@test.example");
    await add.getByRole("button", { name: "Save contact" }).click();
    await expect(page.getByText(/Contact created/)).toBeVisible();

    await page.getByRole("link", { name: `${first} Tester` }).first().click();
    await page.waitForURL(/\/contacts\/[0-9a-f-]{36}$/);
    await expect(page.getByText("(207) 555-0177").first()).toBeVisible();

    await page.getByRole("button", { name: "Edit contact" }).click();
    const edit = page.getByRole("dialog");
    await edit.locator("input").nth(2).fill("Foreman");
    await edit.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText(/Updated contact/)).toBeVisible();

    await page.getByRole("button").filter({ has: page.locator("svg.lucide-ellipsis, svg.lucide-more-horizontal") }).first().click();
    await page.getByRole("menuitem", { name: /Mark as Inactive/ }).click();
    await expect(page.getByText(/status changed to Inactive/)).toBeVisible();
  });
});

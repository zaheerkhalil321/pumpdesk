import { test, expect, type Page } from "@playwright/test";

// Needs the local Supabase stack with the seed loaded. Passwords come from the environment.
const PASSWORD = process.env.E2E_PASSWORD ?? "";

async function login(page: Page, email: string) {
  if (!PASSWORD) throw new Error("Set E2E_PASSWORD (the seeded local test password).");
  await page.goto("/login");
  await page.getByPlaceholder("you@company.com").fill(email);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/schedule");
}

async function fillNewOrder(page: Page) {
  await page.goto("/orders/new");
  await page.getByText("Select customer *").click();
  await page.getByText("Accurate Concrete", { exact: true }).click();
  await page.getByText("Select type").click();
  await page.getByText("Footings", { exact: true }).click();
  await page.getByText("Select minimum pump size").click();
  await page.getByText("34 m", { exact: true }).click();
  await page.getByText("Unassigned", { exact: true }).first().click();
  await page.getByText(/^01 · 34M/).first().click();
}

test.describe("Orders", () => {
  test("dispatcher books an order, sees it on the schedule, edits it and cancels it", async ({ page }) => {
    await login(page, "dispatcher@midcoast.test");
    await fillNewOrder(page);
    await page.getByRole("button", { name: "Create order" }).first().click();
    // The toast names the new order, e.g. "Accurate Concrete • ORD-1007 saved as Pending."
    const toastText = await page.getByText(/ORD-\d+ saved as/).innerText();
    const orderNumber = toastText.match(/ORD-\d+/)![0];
    await page.waitForURL("**/schedule");

    // It is on the board, on the real pump lane.
    await expect(page.getByText("Accurate Concrete").first()).toBeVisible();

    // It is in the Orders list and opens.
    await page.goto("/orders");
    await expect(page.getByText(orderNumber).first()).toBeVisible();
    await page.goto(`/orders/${orderNumber}`);
    await expect(page.getByText("01 · 34M").first()).toBeVisible();
    // The link goes to the day of the pour.
    await expect(page.getByRole("link", { name: "View on schedule" })).toHaveAttribute("href", /\/schedule\?date=\d{4}-\d{2}-\d{2}/);

    // Edit the volume.
    await page.getByRole("button", { name: "Edit order" }).click();
    await page.locator('input[type="number"]').first().fill("75");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Order changes saved")).toBeVisible();
    await expect(page.getByText("75 yd³").first()).toBeVisible();

    // Cancel it.
    await page.getByRole("button", { name: "Cancel order" }).first().click();
    await page.getByRole("button", { name: "Cancel order" }).last().click();
    await expect(page.getByText("Order cancelled")).toBeVisible();
    await expect(page.getByText("Cancelled").first()).toBeVisible();
    // A cancelled order is not on the schedule, so the link to it is gone.
    await expect(page.getByRole("link", { name: "View on schedule" })).toHaveCount(0);
  });

  test("two tabs editing the same order: the second save is refused as stale", async ({ browser }) => {
    const context = await browser.newContext();
    const a = await context.newPage();
    await login(a, "dispatcher@midcoast.test");
    await fillNewOrder(a);
    await a.getByRole("button", { name: "Create order" }).first().click();
    // The toast names the new order, e.g. "Accurate Concrete • ORD-1007 saved as Pending."
    const toastText = await a.getByText(/ORD-\d+ saved as/).innerText();
    const orderNumber = toastText.match(/ORD-\d+/)![0];
    await a.waitForURL("**/schedule");
    await a.goto(`/orders/${orderNumber}`);
    const url = a.url();

    const b = await context.newPage();
    await b.goto(url);
    for (const [page, volume] of [[a, "61"], [b, "62"]] as const) {
      await page.getByRole("button", { name: "Edit order" }).click();
      await page.locator('input[type="number"]').first().fill(volume);
    }
    await a.getByRole("button", { name: "Save", exact: true }).click();
    await expect(a.getByText("Order changes saved")).toBeVisible();
    await b.getByRole("button", { name: "Save", exact: true }).click();
    await expect(b.getByText(/Someone else changed this order/)).toBeVisible();
    await context.close();
  });

  test("a contact added from the order form is saved and selected there", async ({ page }) => {
    const first = `E2E${Date.now()}`;
    await login(page, "dispatcher@midcoast.test");
    await page.goto("/orders/new");
    await page.getByText("Select customer *").click();
    await page.getByText("Accurate Concrete", { exact: true }).click();

    // One Add contact button, and it opens the contact form right here.
    await expect(page.getByRole("button", { name: "Add contact" })).toHaveCount(1);
    await expect(page.getByText("Additional contact")).toHaveCount(0);
    await page.getByRole("button", { name: "Add contact" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder("Alex", { exact: true }).fill(first);
    await dialog.getByPlaceholder("Morgan", { exact: true }).fill("Tester");
    await dialog.getByPlaceholder("(207) 555-0100").fill("2075559" + String(Date.now()).slice(-3));
    await dialog.getByRole("button", { name: "Save contact" }).click();
    await expect(page.getByText(/Contact created/)).toBeVisible();

    // We are still on the order form, and the new contact is the selected job contact.
    await expect(page).toHaveURL(/\/orders\/new/);
    await expect(page.getByText(`${first} Tester`).first()).toBeVisible();
  });

  test("New site, extra items, size limit and an additional operator all work on the order form", async ({ page }) => {
    const town = `Searsport${String(Date.now()).slice(-4)}`;
    await login(page, "dispatcher@midcoast.test");
    await page.goto("/orders/new");
    await page.getByText("Select customer *").click();
    await page.getByText("Accurate Concrete", { exact: true }).click();

    // New site opens right here and fills the site field.
    await page.getByRole("button", { name: "New site" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder("e.g. Rockland", { exact: true }).fill(town);
    await dialog.getByRole("button", { name: "Add job site" }).click();
    await expect(page.getByText("Job site added")).toBeVisible();
    await expect(page.locator('input[placeholder*="town, cross streets"]')).toHaveValue(new RegExp(`${town}, ME`));

    await page.getByText("Select type").click();
    await page.getByText("Footings", { exact: true }).click();
    await page.getByText("Select minimum pump size").click();
    await page.getByText("34 m", { exact: true }).click();

    // Maximum size restriction, extra items, additional operator.
    await page.getByRole("button", { name: "Maximum size restriction" }).click();
    await page.getByText("Select maximum pump size").click();
    await page.getByText("28 m", { exact: true }).click();

    await page.getByLabel("Item 1", { exact: true }).fill("Extra hose");
    await page.getByLabel("Quantity 1", { exact: true }).fill("2");
    await page.getByRole("button", { name: "Add item" }).click();
    await page.getByLabel("Item 2", { exact: true }).fill("Primer pack");

    await page.getByRole("button", { name: "Additional operator" }).click();
    await page.getByText("None", { exact: true }).click();
    await page.getByText("Dave Smith", { exact: true }).click();

    await page.getByText("Unassigned", { exact: true }).first().click();
    await page.getByText(/^01 · 34M/).first().click();
    await page.getByRole("button", { name: "Create order" }).first().click();
    const toastText = await page.getByText(/ORD-\d+ saved as/).innerText();
    const orderNumber = toastText.match(/ORD-\d+/)![0];

    // The order page shows all of it.
    await page.goto(`/orders/${orderNumber}`);
    await expect(page.getByText("Extra hose").first()).toBeVisible();
    await expect(page.getByText("× 2")).toBeVisible();
    await expect(page.getByText("Primer pack").first()).toBeVisible();
    await expect(page.getByText("Maximum pump size").first()).toBeVisible();
    await expect(page.getByText("Additional operator").first()).toBeVisible();
    await expect(page.getByText("Dave Smith").first()).toBeVisible();
    await expect(page.getByText(town).first()).toBeVisible();
  });

  test("the job site is one box: pick a saved site or type anything", async ({ page }) => {
    await login(page, "dispatcher@midcoast.test");
    await page.goto("/orders/new");
    await page.getByText("Select customer *").click();
    await page.getByText("Accurate Concrete", { exact: true }).click();

    const site = page.getByPlaceholder("Enter town, cross streets, or street address");
    await site.click();
    // The customer's saved sites show as suggestions...
    const suggestions = page.getByRole("option");
    await expect(suggestions.first()).toBeVisible();

    // ...typing narrows them, and any text is allowed.
    await site.fill("zzz nothing matches");
    await expect(suggestions).toHaveCount(0);
    await expect(site).toHaveValue("zzz nothing matches");

    // Clearing the box brings the suggestions back, and picking one fills the box.
    await site.fill("");
    await expect(suggestions.first()).toBeVisible();
    const label = (await suggestions.first().innerText()).split(" · ").pop()!;
    await suggestions.first().click();
    await expect(site).toHaveValue(label);
  });

  test("New booking on the schedule creates a pending order that needs a pump", async ({ page }) => {
    const town = `Quickville${String(Date.now()).slice(-4)}`;
    await login(page, "dispatcher@midcoast.test");
    await page.getByRole("button", { name: "New booking" }).first().click();
    const modal = page.getByRole("dialog").last();
    await modal.getByText("Select customer *").click();
    await page.getByRole("menuitem", { name: "Accurate Concrete" }).first().click();
    await modal.getByPlaceholder("Town, cross streets, or street address").fill(town);
    await modal.locator('input[type="number"]').fill("40");
    await modal.getByRole("button", { name: "Create order" }).click();
    await expect(page.getByText(/ORD-\d+ /).first()).toBeVisible();
    await page.goto("/orders");
    await expect(page.getByText(town).first()).toBeVisible();
  });

  test("Test Co owner sees none of Midcoast's orders", async ({ page }) => {
    await login(page, "owner@test-co.test");
    await page.goto("/orders");
    await expect(page.getByText("Showing 0 of 0 orders")).toBeVisible();
  });

  test("read_only can open the order form but the save is refused", async ({ page }) => {
    await login(page, "readonly@midcoast.test");
    await fillNewOrder(page);
    await page.getByRole("button", { name: "Create order" }).first().click();
    await expect(page.getByText("You don't have permission to do that.")).toBeVisible();
  });
});

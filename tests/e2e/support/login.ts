import { expect, type Page } from "@playwright/test";

import { readFactors, totpCode } from "./two-step";

/**
 * Signs in with the seeded password, then passes the code step with the key from global-setup.
 * When a parallel test passes the code step for the same user, Supabase ends this
 * password-only session, so the whole sign-in is tried again.
 */
export async function login(page: Page, email: string) {
  const password = process.env.E2E_PASSWORD ?? "";
  if (!password) throw new Error("Set E2E_PASSWORD (the seeded local test password).");
  const factor = readFactors()[email];
  if (!factor) throw new Error(`No authenticator key for ${email}. Add the user to E2E_USERS in support/two-step.ts.`);

  for (let attempt = 1; ; attempt++) {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByPlaceholder("you@company.com").fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("**/mfa");
    await expect(page.getByRole("heading", { name: "Enter Your Code" })).toBeVisible();
    await page.getByLabel("6-Digit Code").fill(totpCode(factor.secret));
    await page.getByRole("button", { name: "Verify" }).click();

    const passed = await page
      .waitForURL("**/schedule", { timeout: 10_000 })
      .then(() => true)
      .catch(() => false);
    if (passed) return;
    if (attempt === 3) throw new Error(`Code step failed 3 times for ${email}.`);
  }
}

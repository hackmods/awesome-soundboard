import { expect, type Page } from "@playwright/test";

export function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

export async function registerAndLogin(page: Page, opts?: { displayName?: string }) {
  const email = uniqueEmail();
  const password = "password123";
  const displayName = opts?.displayName ?? "E2E User";

  await page.goto("/register");
  await page.getByLabel("Display name").fill(displayName);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/login\?registered=1/);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

  return { email, password, displayName };
}

export async function createBoard(page: Page, name: string) {
  await page.getByRole("button", { name: "New soundboard" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill(name);
  await dialog.getByRole("button", { name: "Create" }).click();
  await page.waitForURL(/\/boards\//, { timeout: 30_000 });
}

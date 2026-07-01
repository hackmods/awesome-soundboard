import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers";

test("register and login reaches dashboard", async ({ page }) => {
  await registerAndLogin(page);
  await expect(page.getByRole("heading", { name: "Your soundboards" })).toBeVisible();
});

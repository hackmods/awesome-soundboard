import { test, expect } from "@playwright/test";
import { createBoard, registerAndLogin } from "./helpers";

test("visibility dropdown keeps saved value after save", async ({ page }) => {
  await registerAndLogin(page);
  await createBoard(page, "Visibility Board");

  const visibility = page.locator("#visibility");
  await visibility.selectOption("public");
  await page.getByRole("button", { name: "Save settings" }).click();

  await expect(visibility).toHaveValue("public");
  await expect(page.locator("#settings input[readonly]")).toHaveValue(/\/s\//);
});

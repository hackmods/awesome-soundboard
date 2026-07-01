import { test, expect } from "@playwright/test";
import { createBoard, registerAndLogin } from "./helpers";

test("create board opens editor without client error", async ({ page }) => {
  await registerAndLogin(page);
  await createBoard(page, "E2E Test Board");

  await expect(page.getByRole("heading", { name: "E2E Test Board" })).toBeVisible();
  await expect(page.getByText("Application error")).toHaveCount(0);
  await expect(page.getByText("No clips yet")).toBeVisible();
});

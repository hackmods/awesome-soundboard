import path from "path";
import { test, expect } from "@playwright/test";
import { createBoard, registerAndLogin } from "./helpers";

const samplePath = path.join(process.cwd(), "tests", "fixtures", "sample.wav");

test("upload clip appears in grid", async ({ page }) => {
  await registerAndLogin(page);
  await createBoard(page, "Upload Board");

  await page.locator('input[type="file"]').setInputFiles(samplePath);

  await expect(page.getByText("sample")).toBeVisible({ timeout: 15_000 });
});

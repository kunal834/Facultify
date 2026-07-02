import { test, expect } from "@playwright/test";
import { loginAsTeacher } from "./login";

test("teacher can log in, create a test, and publish it", async ({ page }) => {
  const testTitle = `E2E Playwright Test ${Date.now()}`;

  await loginAsTeacher(page);

  // ── Step 1: Test details ────────────────────────────────────────────────
  await page.goto("/teacher/create-test");
  await page.locator("#title").fill(testTitle);
  await page.locator("#subject").fill("E2E Subject");

  await page.getByRole("combobox").filter({ hasText: "Select a batch" }).click();
  await page.getByRole("option", { name: "E2E Batch" }).click();

  await page.getByRole("button", { name: "Continue to Questions" }).click();

  // ── Step 2: Add one MCQ question ────────────────────────────────────────
  await page.getByRole("button", { name: "Add question" }).click();
  await page.locator("#qtext").fill("What is the capital of France?");
  await page.getByPlaceholder("Option 1").fill("Paris");
  await page.getByPlaceholder("Option 2").fill("London");
  await page.getByRole("button", { name: "Mark option 1 as correct" }).click();
  await page.getByRole("button", { name: "Add question" }).click();

  await expect(page.getByText("What is the capital of France?")).toBeVisible();
  await page.getByRole("button", { name: "Review test" }).first().click();

  // ── Step 3: Review & publish ────────────────────────────────────────────
  await expect(page.getByRole("heading", { name: testTitle })).toBeVisible();
  await page.getByRole("button", { name: "Publish now" }).click();

  // ── Verify it landed in the test list as published ──────────────────────
  await expect(page).toHaveURL(/\/teacher\/tests/, { timeout: 15_000 });
  const row = page.getByText(testTitle).first();
  await expect(row).toBeVisible();
});

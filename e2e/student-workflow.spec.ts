
import { test, expect } from "@playwright/test";
import { loginAsStudent } from "./login";

test("student can log in, take the seed test, and submit it", async ({ page }) => {
  await loginAsStudent(page);

  await page.goto("/student/tests");
  const testCard = page.locator("div.relative.overflow-hidden").filter({ hasText: "E2E Seed Test" });
  await expect(testCard).toBeVisible({ timeout: 15_000 });

  await testCard.getByRole("link", { name: "Take Test" }).click();

  await expect(page).toHaveURL(/\/student\/test\//, { timeout: 15_000 });

  // Answer the single MCQ question ("What is 2 + 2?" -> "4")
  await expect(page.getByText("What is 2 + 2?")).toBeVisible();
  await page.getByRole("button", { name: "4", exact: true }).click();

  await page.getByRole("button", { name: "Submit Test" }).click();
  await page.getByRole("button", { name: "Submit test" }).click();

  await expect(page).toHaveURL(/\/student\/analytics/, { timeout: 15_000 });
});

import { Page, expect } from "@playwright/test";

export async function login(page: Page, email: string, password: string) {
  await page.goto("/auth/login");
  await page.locator("#email-pw").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

export async function loginAsTeacher(page: Page) {
  await login(page, process.env.E2E_TEACHER_EMAIL!, process.env.E2E_PASSWORD!);
  await expect(page).toHaveURL(/\/teacher/, { timeout: 15_000 });
}

export async function loginAsStudent(page: Page) {
  await login(page, process.env.E2E_STUDENT_EMAIL!, process.env.E2E_PASSWORD!);
  await expect(page).toHaveURL(/\/student/, { timeout: 15_000 });
}

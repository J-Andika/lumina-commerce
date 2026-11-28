import { expect, test } from "@playwright/test";

test("admin requires basic auth", async ({ request }) => {
  const response = await request.get("/admin");

  expect(response.status()).toBe(401);
  expect(response.headers()["www-authenticate"]).toContain("Basic");
});

test.describe("with credentials", () => {
  test.use({ httpCredentials: { username: "admin", password: "lumina-dev-pass" } });

  test("renders the dashboard", async ({ page }) => {
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
    await expect(page.getByText("GMV (paid)")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recent orders" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Low stock" })).toBeVisible();
  });
});

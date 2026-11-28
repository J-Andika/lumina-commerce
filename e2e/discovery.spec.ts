import { expect, test } from "@playwright/test";

test("wishlist saves a product and lists it on /wishlist", async ({ page }) => {
  await page.goto("/product/quill");

  await page.getByRole("button", { name: /save Quill to wishlist/i }).click();
  await page.getByRole("link", { name: /wishlist/i }).click();

  await expect(page).toHaveURL(/\/wishlist$/);
  await expect(page.getByRole("heading", { name: "Wishlist" })).toBeVisible();
  await expect(page.getByText("Quill", { exact: true })).toBeVisible();
});

test("slash opens search and Enter opens the first result", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.press("/");
  const input = page.getByRole("textbox", { name: /search products/i }).first();
  await expect(input).toBeVisible();

  await input.fill("quill");
  await input.press("Enter");

  await expect(page).toHaveURL(/\/product\/quill$/);
  await expect(page.getByRole("heading", { level: 1, name: "Quill" })).toBeVisible();
});

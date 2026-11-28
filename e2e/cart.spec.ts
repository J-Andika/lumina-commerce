import { expect, test } from "@playwright/test";

test("adds a variant, opens the drawer, and survives a reload", async ({ page }) => {
  await page.goto("/product/monolith");

  const add = page.getByRole("button", { name: /add to cart/i });
  await expect(add).toBeEnabled();
  await add.click();

  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();
  await expect(drawer).toContainText("Monolith");
  await expect(drawer).toContainText("Subtotal");
  await expect(drawer).toContainText("(1)");

  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();

  const cartButton = page.getByRole("button", { name: /open cart/i });
  await expect(cartButton).toContainText("1");

  await page.reload();
  await expect(cartButton).toContainText("1");

  await cartButton.click();
  await page.getByRole("button", { name: /increase quantity/i }).click();
  await expect(page.getByRole("dialog")).toContainText("(2)");
});

test("removes a line and restores it with undo", async ({ page }) => {
  await page.goto("/product/halo");
  await page.getByRole("button", { name: /add to cart/i }).click();
  await expect(page.getByRole("dialog")).toContainText("Halo");

  await page.getByRole("button", { name: /^remove$/i }).click();
  await expect(page.getByRole("dialog")).toContainText("Your cart is empty");

  await page.getByRole("button", { name: /undo/i }).click();

  const cartButton = page.getByRole("button", { name: /open cart/i });
  await expect(cartButton).toContainText("1");
  await cartButton.click();
  await expect(page.getByRole("dialog")).toContainText("Halo");
});

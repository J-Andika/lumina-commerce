import { expect, test } from "@playwright/test";

async function addToCartAndOpenCheckout(page: import("@playwright/test").Page, slug: string) {
  await page.goto(`/product/${slug}`);
  await page.getByRole("button", { name: /add to cart/i }).click();
  await page.keyboard.press("Escape");
  await page.goto("/checkout");
}

test("validates the address before payment", async ({ page }) => {
  await addToCartAndOpenCheckout(page, "halo");

  await page.getByRole("button", { name: /continue to payment/i }).click();

  await expect(page.getByText("Enter a valid email address")).toBeVisible();
});

test("completes a sandbox checkout and shows a paid receipt", async ({ page }) => {
  await addToCartAndOpenCheckout(page, "monolith");

  await page.getByLabel("Email").fill("buyer@example.com");
  await page.getByLabel("Full name").fill("Gew Andika");
  await page.getByLabel("Address").fill("12 Jalan Melati");
  await page.getByLabel("City").fill("Bandar Lampung");
  await page.getByLabel("Postal code").fill("35141");
  await page.getByRole("button", { name: /continue to payment/i }).click();

  await page.getByLabel("Card number").fill("4242424242424242");
  await page.getByLabel("Name on card").fill("Gew Andika");
  await page.getByLabel("Expiry (MM/YY)").fill("12/30");
  await page.getByLabel("CVC").fill("123");
  await page.getByRole("button", { name: /review order/i }).click();

  await page.getByRole("button", { name: /place order/i }).click();

  await expect(page).toHaveURL(/\/order\/[a-z0-9]+$/);
  await expect(page.getByText("Paid")).toBeVisible();
  const heading = await page.getByRole("heading", { level: 1 }).innerText();
  expect(heading).toMatch(/LUM-\d{5}/);
  await expect(page.getByText("Sandbox payment — no real charge")).toBeVisible();
});

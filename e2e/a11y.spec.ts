import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function criticalViolations(page: Page, url: string) {
  await page.goto(url);

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  return results.violations
    .filter((violation) => violation.impact === "critical" || violation.impact === "serious")
    .map((violation) => `${violation.id} (${violation.nodes.length} nodes)`);
}

test("storefront pages have no critical or serious axe violations", async ({ page }) => {
  for (const url of ["/", "/shop", "/product/monolith", "/wishlist"]) {
    const violations = await criticalViolations(page, url);
    expect(violations, `${url}: ${violations.join(", ")}`).toEqual([]);
  }
});

test("the open cart drawer passes axe", async ({ page }) => {
  await page.goto("/product/monolith");
  await page.getByRole("button", { name: /add to cart/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const violations = results.violations
    .filter((violation) => violation.impact === "critical" || violation.impact === "serious")
    .map((violation) => violation.id);

  expect(violations).toEqual([]);
});

test("checkout passes axe", async ({ page }) => {
  await page.goto("/product/halo");
  await page.getByRole("button", { name: /add to cart/i }).click();
  await page.keyboard.press("Escape");
  await page.goto("/checkout");

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const violations = results.violations
    .filter((violation) => violation.impact === "critical" || violation.impact === "serious")
    .map((violation) => `${violation.id} (${violation.nodes.length})`);

  expect(violations).toEqual([]);
});

test.describe("admin", () => {
  test.use({ httpCredentials: { username: "admin", password: "lumina-dev-pass" } });

  test("admin passes axe", async ({ page }) => {
    const violations = await criticalViolations(page, "/admin");
    expect(violations).toEqual([]);
  });
});

async function tabUntil(page: Page, selector: string, max = 60) {
  for (let index = 0; index < max; index += 1) {
    await page.keyboard.press("Tab");
    const matches = await page.evaluate(
      (target) => document.activeElement?.matches(target) ?? false,
      selector,
    );
    if (matches) return true;
  }

  return false;
}

test("keyboard only: add to cart and reach checkout", async ({ page }) => {
  await page.goto("/product/monolith");

  const reachedAdd = await tabUntil(page, 'button[type="button"]:not([disabled])');
  expect(reachedAdd).toBe(true);

  // Walk forward until the add-to-cart button itself has focus.
  for (let index = 0; index < 60; index += 1) {
    const label = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? "");
    if (/add to cart/i.test(label)) break;
    await page.keyboard.press("Tab");
  }

  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();

  const reachedCheckout = await tabUntil(page, 'a[href="/checkout"]');
  expect(reachedCheckout).toBe(true);

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/checkout$/);
});

#!/usr/bin/env node
// End-to-end smoke test against a DEPLOYED site: buys one product with the sandbox card
// and asserts the receipt. Exits non-zero on failure, so it works as a post-deploy gate.
//
//   BASE_URL=https://example.com node scripts/ops/smoke.mjs
import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "https://95-111-212-87.sslip.io";
const browser = await chromium.launch({ channel: "chrome", headless: true });

try {
  const page = await browser.newPage();
  const step = (message) => console.log(`· ${message}`);

  step(`opening ${base}/product/monolith`);
  await page.goto(`${base}/product/monolith`);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /add to cart/i }).click();
  await page.getByRole("dialog").waitFor({ state: "visible" });
  await page.waitForFunction(() => localStorage.getItem("lumina.cart.v1") !== null);
  await page.keyboard.press("Escape");

  step("filling checkout");
  await page.goto(`${base}/checkout`);
  await page.waitForLoadState("networkidle");
  await page.getByLabel(/^email$/i).waitFor({ timeout: 20000 });
  await page.getByLabel(/^email$/i).fill("smoke@example.com");
  await page.getByLabel(/^full name$/i).fill("Smoke Test");
  await page.getByLabel(/^address$/i).fill("1 Production Way");
  await page.getByLabel(/^city$/i).fill("Singapore");
  await page.getByLabel(/^postal code$/i).fill("018956");
  await page.getByRole("button", { name: /continue to payment/i }).click();

  await page.getByLabel(/^card number$/i).fill("4242424242424242");
  await page.getByLabel(/^name on card$/i).fill("Smoke Test");
  await page.getByLabel(/expiry/i).fill("12/30");
  await page.getByLabel(/^cvc$/i).fill("123");
  await page.getByRole("button", { name: /review order/i }).click();
  await page.getByRole("button", { name: /place order/i }).click();

  await page.waitForURL(/\/order\/[a-z0-9]+$/, { timeout: 20000 });
  const heading = await page.getByRole("heading", { level: 1 }).innerText();
  const paid = await page.getByText("Paid").isVisible();
  const sandbox = await page.getByText(/Sandbox payment/i).isVisible();

  if (!paid || !sandbox) {
    throw new Error(`receipt incomplete: paid=${paid} sandbox=${sandbox}`);
  }

  console.log(`✓ order ${heading} paid (sandbox) — ${page.url()}`);
} finally {
  await browser.close();
}

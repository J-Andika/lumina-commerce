/**
 * Minimal card helpers for the sandbox payment mode. This is not a payment
 * processor: it validates shape so the demo cannot accept "1234" as a card.
 */

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function luhnValid(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length < 12 || digits.length > 19) return false;

  let sum = 0;
  let double = false;

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }

  return sum % 10 === 0;
}

export function formatCardNumber(value: string): string {
  return digitsOnly(value).slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
}

export type ExpiryCheck = { valid: boolean; message?: string };

export function checkExpiry(value: string, now: Date = new Date()): ExpiryCheck {
  const match = /^(0[1-9]|1[0-2])\s*\/\s*(\d{2})$/.exec(value.trim());
  if (!match) return { valid: false, message: "Use MM/YY" };

  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  const endOfMonth = new Date(year, month, 1);

  if (endOfMonth <= now) return { valid: false, message: "Card has expired" };

  return { valid: true };
}

export function checkCvc(value: string): boolean {
  return /^\d{3,4}$/.test(value.trim());
}

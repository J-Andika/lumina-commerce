/**
 * Money is always integer cents. Never floats.
 */
export function formatMoney(cents: number, locale = "en-US", currency = "USD"): string {
  if (!Number.isInteger(cents)) {
    throw new TypeError(`formatMoney expects integer cents, received ${cents}`);
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function sumCents(values: number[]): number {
  return values.reduce((total, value) => {
    if (!Number.isInteger(value)) {
      throw new TypeError(`sumCents expects integer cents, received ${value}`);
    }
    return total + value;
  }, 0);
}

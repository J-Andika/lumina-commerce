const ORDER_NUMBER = /^LUM-\d{5}$/;

/** Human-readable order number: LUM-12345. Uniqueness is enforced by the caller. */
export function generateOrderNumber(random: () => number = Math.random): string {
  const value = Math.floor(random() * 90_000) + 10_000;

  return `LUM-${value}`;
}

export function isValidOrderNumber(value: string): boolean {
  return ORDER_NUMBER.test(value);
}

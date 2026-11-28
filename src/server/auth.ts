import { headers } from "next/headers";

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return diff === 0;
}

/**
 * Defence in depth: the middleware guards /admin pages, and every admin action
 * re-checks the request as well.
 */
export async function isAdminRequest(): Promise<boolean> {
  const header = (await headers()).get("authorization");
  if (!header?.startsWith("Basic ")) return false;

  let decoded: string;
  try {
    decoded = atob(header.slice(6));
  } catch {
    return false;
  }

  const separator = decoded.indexOf(":");
  if (separator < 0) return false;

  const user = decoded.slice(0, separator);
  const pass = decoded.slice(separator + 1);
  const expectedUser = process.env.ADMIN_USER ?? "admin";
  const expectedPass = process.env.ADMIN_PASS ?? "lumina-dev-pass";

  return safeEqual(user, expectedUser) && safeEqual(pass, expectedPass);
}

export async function assertAdmin(): Promise<void> {
  if (!(await isAdminRequest())) {
    throw new Error("UNAUTHORIZED");
  }
}

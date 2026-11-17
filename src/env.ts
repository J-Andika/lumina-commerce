/**
 * Server-only environment contract.
 * Importing this from a client component will leak secrets — don't.
 */
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().default("file:./prisma/dev.db"),
  PAYMENTS_MODE: z.enum(["stripe", "sandbox"]).default("sandbox"),
  STRIPE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  ADMIN_USER: z.string().default("admin"),
  ADMIN_PASS: z.string().min(8).default("lumina-dev-pass"),
  NEXT_PUBLIC_SITE_URL: z.string().optional(),
});

export const env = schema.parse(process.env);

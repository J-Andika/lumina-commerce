import { z } from "zod";

export const COURIER_OPTIONS = ["standard", "express"] as const;
export type CheckoutCourier = (typeof COURIER_OPTIONS)[number];

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(200)
  .regex(/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/, "Enter a valid email address");

export const checkoutSchema = z.object({
  email,
  name: z.string().trim().min(2, "Enter your full name").max(120),
  address1: z.string().trim().min(5, "Enter a street address").max(200),
  city: z.string().trim().min(2, "Enter a city").max(120),
  postal: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9 -]{3,12}$/, "Enter a valid postal code"),
  country: z.string().trim().min(2, "Enter a country").max(60),
  courier: z.enum(COURIER_OPTIONS),
  promoCode: z
    .string()
    .trim()
    .max(32)
    .optional()
    .nullable()
    .transform((value) => (value ? value.toUpperCase() : null)),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const cartItemSchema = z.object({
  variantId: z.string().min(1),
  qty: z.number().int().min(1).max(10),
});

export const cartSchema = z.array(cartItemSchema).min(1, "Your cart is empty").max(50);

export type CartInput = z.infer<typeof cartItemSchema>;

export function formatCheckoutErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!result[key]) result[key] = issue.message;
  }

  return result;
}

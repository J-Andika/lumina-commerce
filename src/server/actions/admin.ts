"use server";

import { revalidatePath } from "next/cache";

import { ORDER_STATUSES, type AdminOrderStatus } from "@/lib/admin";
import { assertAdmin } from "@/server/auth";
import { updateOrderStatus, updateStock } from "@/server/admin";

function refresh() {
  revalidatePath("/admin");
  revalidatePath("/shop");
  revalidatePath("/");
}

export async function updateStockAction(formData: FormData) {
  await assertAdmin();

  const variantId = String(formData.get("variantId") ?? "");
  const stock = Number(formData.get("stock"));

  if (!variantId) throw new Error("Missing variant");

  await updateStock(variantId, stock);
  refresh();
}

export async function updateOrderStatusAction(formData: FormData) {
  await assertAdmin();

  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!orderId || !ORDER_STATUSES.includes(status as AdminOrderStatus)) {
    throw new Error("Invalid order update");
  }

  await updateOrderStatus(orderId, status as AdminOrderStatus);
  refresh();
}

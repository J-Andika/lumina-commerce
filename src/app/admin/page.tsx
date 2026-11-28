import Link from "next/link";

import { allowedTransitions, type AdminOrderStatus } from "@/lib/admin";
import { formatMoney } from "@/lib/money";
import { getDashboard } from "@/server/admin";
import { updateOrderStatusAction, updateStockAction } from "@/server/actions/admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: "text-muted",
  PAID: "text-accent",
  FULFILLED: "text-foreground",
  CANCELLED: "text-red-400",
};

export default async function AdminPage() {
  const { gmvCents, ordersToday, paidToday, lowStock, recentOrders } = await getDashboard();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-hairline">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-xl">Lumina</span>
            <span className="font-mono text-[10px] tracking-widest text-muted uppercase">Admin</span>
          </div>
          <Link href="/" className="font-mono text-[10px] tracking-widest text-muted uppercase hover:text-foreground">
            View storefront →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-3xl tracking-tight">Today</h1>

        <dl className="mt-5 grid gap-3 sm:grid-cols-3">
          <Metric label="GMV (paid)" value={formatMoney(gmvCents)} />
          <Metric label="Orders today" value={String(ordersToday)} />
          <Metric label="Paid today" value={String(paidToday)} />
        </dl>

        <section aria-labelledby="orders-heading" className="mt-8">
          <h2 id="orders-heading" className="font-display text-xl">
            Recent orders
          </h2>

          {recentOrders.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No orders yet. Complete a checkout to see one here.</p>
          ) : (
            <div className="mt-3 overflow-x-auto border border-hairline">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-hairline font-mono text-[10px] tracking-widest text-muted uppercase">
                  <tr>
                    <th className="px-3 py-2">Order</th>
                    <th className="px-3 py-2">Placed</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Total</th>
                    <th className="px-3 py-2">Update</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => {
                    const next = allowedTransitions(order.status as AdminOrderStatus);

                    return (
                      <tr key={order.id} className="border-b border-hairline last:border-0">
                        <td className="px-3 py-2 font-mono text-xs">{order.number}</td>
                        <td className="px-3 py-2 text-muted">
                          {new Intl.DateTimeFormat("en-GB", { dateStyle: "short", timeStyle: "short" }).format(
                            order.createdAt,
                          )}
                        </td>
                        <td className={`px-3 py-2 font-mono text-[10px] tracking-widest uppercase ${STATUS_STYLE[order.status] ?? ""}`}>
                          {order.status}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">
                          {formatMoney(order.totalCents)}
                        </td>
                        <td className="px-3 py-2">
                          {next.length === 0 ? (
                            <span className="text-xs text-muted">—</span>
                          ) : (
                            <form action={updateOrderStatusAction} className="flex items-center gap-2">
                              <input type="hidden" name="orderId" value={order.id} />
                              <select
                                name="status"
                                defaultValue={next[0]}
                                aria-label={`New status for ${order.number}`}
                                className="h-8 border border-hairline bg-surface px-2 font-mono text-[10px] tracking-widest uppercase"
                              >
                                {next.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="submit"
                                className="h-8 border border-hairline px-2 font-mono text-[10px] tracking-widest text-muted uppercase hover:text-foreground"
                              >
                                Save
                              </button>
                            </form>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-labelledby="stock-heading" className="mt-10">
          <h2 id="stock-heading" className="font-display text-xl">
            Low stock
          </h2>
          <p className="mt-1 text-sm text-muted">
            Five units or fewer. Setting a stock to zero marks the variant sold out on the storefront.
          </p>

          {lowStock.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Everything is comfortably stocked.</p>
          ) : (
            <div className="mt-3 overflow-x-auto border border-hairline">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-hairline font-mono text-[10px] tracking-widest text-muted uppercase">
                  <tr>
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2">Variant</th>
                    <th className="px-3 py-2">SKU</th>
                    <th className="px-3 py-2">Stock</th>
                    <th className="px-3 py-2">Set</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((variant) => (
                    <tr key={variant.id} className="border-b border-hairline last:border-0">
                      <td className="px-3 py-2">
                        <Link href={`/product/${variant.product.slug}`} className="hover:text-accent">
                          {variant.product.name}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-muted">{variant.name}</td>
                      <td className="px-3 py-2 font-mono text-xs text-muted">{variant.sku}</td>
                      <td className={`px-3 py-2 font-mono tabular-nums ${variant.stock === 0 ? "text-red-400" : "text-accent"}`}>
                        {variant.stock}
                      </td>
                      <td className="px-3 py-2">
                        <form action={updateStockAction} className="flex items-center gap-2">
                          <input type="hidden" name="variantId" value={variant.id} />
                          <label className="sr-only" htmlFor={`stock-${variant.id}`}>
                            Stock for {variant.sku}
                          </label>
                          <input
                            id={`stock-${variant.id}`}
                            name="stock"
                            type="number"
                            min={0}
                            max={999}
                            defaultValue={variant.stock}
                            className="h-8 w-16 border border-hairline bg-surface px-2 text-sm"
                          />
                          <button
                            type="submit"
                            className="h-8 border border-hairline px-2 font-mono text-[10px] tracking-widest text-muted uppercase hover:text-foreground"
                          >
                            Save
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-hairline bg-surface p-4">
      <dt className="font-mono text-[10px] tracking-widest text-muted uppercase">{label}</dt>
      <dd className="mt-1 font-mono text-2xl tabular-nums">{value}</dd>
    </div>
  );
}

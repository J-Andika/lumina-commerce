import { ImageResponse } from "next/og";

import { formatMoney } from "@/lib/money";
import { getProductBySlug } from "@/server/catalog";

export const alt = "Product card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  const name = product?.name ?? "Lumina";
  const tagline = product?.tagline ?? "Curated objects";
  const price = product ? formatMoney(product.minPriceCents) : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#09090b",
          color: "#fafafa",
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#71717a" }}>
          <span>LUMINA</span>
          <span>{product?.category?.toUpperCase() ?? "CATALOGUE"}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 96, lineHeight: 1 }}>{name}</div>
          <div style={{ fontSize: 32, color: "#a1a1aa" }}>{tagline}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ width: 72, height: 6, background: "#bef264" }} />
          <div style={{ fontSize: 40, color: "#bef264" }}>{price}</div>
        </div>
      </div>
    ),
    size,
  );
}

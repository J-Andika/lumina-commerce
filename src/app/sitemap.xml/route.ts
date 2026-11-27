import { headers } from "next/headers";

import { listProducts } from "@/server/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const proto =
    headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");

  const base = `${proto}://${host}`;
  const products = await listProducts({ limit: 100 });

  const paths = ["/", "/shop", ...products.map((product) => `/product/${product.slug}`)];
  const entries = paths.map((path) => `  <url><loc>${base}${path}</loc></url>`).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}

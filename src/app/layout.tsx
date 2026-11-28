import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";

// The layout reads the catalogue for the search index, so nothing can be statically
// generated at build time — the image has no database.
export const dynamic = "force-dynamic";

import { CartDrawer } from "@/components/cart-drawer";
import { SearchDialog } from "@/components/search-dialog";
import { StoreProvider } from "@/components/store-provider";
import { Toaster } from "@/components/toaster";
import { listProducts } from "@/server/catalog";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Lumina Commerce",
    template: "%s · Lumina Commerce",
  },
  description:
    "Headless commerce storefront demo: Next.js App Router, server-side pricing, Stripe test checkout.",
  robots: { index: true, follow: true },
};

const themeScript = `try{var t=localStorage.getItem("lumina.theme");var d=t?t==="dark":true;document.documentElement.classList.toggle("dark",d);}catch(e){}`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const products = await listProducts({ limit: 100 });
  const searchIndex = products.map((product) => ({
    slug: product.slug,
    name: product.name,
    tagline: product.tagline,
    category: product.category,
    priceCents: product.minPriceCents,
    imageUrl: product.images[0]?.url,
  }));
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} ${instrumentSerif.variable}`}>
        <StoreProvider searchIndex={searchIndex}>
          {children}
          <CartDrawer />
          <SearchDialog />
          <Toaster />
        </StoreProvider>
      </body>
    </html>
  );
}

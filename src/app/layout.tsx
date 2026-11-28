import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";

import { CartDrawer } from "@/components/cart-drawer";
import { StoreProvider } from "@/components/store-provider";
import { Toaster } from "@/components/toaster";

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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} ${instrumentSerif.variable}`}>
        <StoreProvider>
          {children}
          <CartDrawer />
          <Toaster />
        </StoreProvider>
      </body>
    </html>
  );
}

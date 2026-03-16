import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Capiverse — The Universe of Cape Town Experiences",
  description: "Discover Cape Town differently. Private tours, AI itinerary planning, and local expert follow-up — all in one platform."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") || headersList.get("next-url") || "";
  const isAdmin = pathname.startsWith("/admin");

  return (
    <html lang="en">
      <body>
        {!isAdmin && <SiteHeader />}
        <main>{children}</main>
        {!isAdmin && <SiteFooter />}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { InstallPrompt } from "@/components/InstallPrompt";

export const metadata: Metadata = {
  title: "Capeverse — Your AI Travel Companion for Cape Town",
  description: "Discover. Plan. Book. Experience. Everything you need for the perfect Cape Town trip — all in one intelligent platform.",
  manifest: "/manifest.json",
  themeColor: "#7C3AED",
  icons: {
    icon: [
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icon-180.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <Analytics />
        <InstallPrompt />
        <WhatsAppButton
          variant="fixed"
          phone={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}
          message="Hi! I'd love to find out more about a private Cape Town tour."
        />
      </body>
    </html>
  );
}

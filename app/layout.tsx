import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { AppProviders } from "@/features/providers/app-providers";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.najehealth.com"),
  title: "Naje Health | Modern Diabetes Care & Online Consultation",
  description:
    "Consult verified healthcare providers, manage diabetes, and access structured care online.",
  openGraph: {
    title: "Naje Health | Modern Diabetes Care & Online Consultation",
    description:
      "Consult verified healthcare providers, manage diabetes, and access structured care online.",
    url: "/",
    siteName: "Naje Health",
    locale: "en_ZM",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Naje Health | Modern Diabetes Care & Online Consultation",
    description:
      "Consult verified healthcare providers, manage diabetes, and access structured care online.",
  },
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${sans.variable} ${mono.variable} min-h-screen bg-background font-sans text-text`}
        suppressHydrationWarning
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

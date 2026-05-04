import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppProviders } from "@/features/providers/app-providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.glycolink.co.zm"),
  title: "GlycoLink | Modern Diabetes Care & Online Consultation",
  description:
    "Consult verified healthcare providers, manage diabetes, and access structured care online.",
  openGraph: {
    title: "GlycoLink | Modern Diabetes Care & Online Consultation",
    description:
      "Consult verified healthcare providers, manage diabetes, and access structured care online.",
    url: "/",
    siteName: "GlycoLink",
    locale: "en_ZM",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GlycoLink | Modern Diabetes Care & Online Consultation",
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
        className={`${inter.variable} min-h-screen bg-background font-sans text-text`}
        suppressHydrationWarning
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

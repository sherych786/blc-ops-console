import type { Metadata } from "next";
import "./globals.css";

// Note: brand font is PT Sans. Using the system font stack for now so the
// build never depends on reaching Google Fonts (see globals.css). Swap in
// next/font/local with a self-hosted PT Sans file whenever you want the
// exact brand typeface — see ROADMAP.md.

export const metadata: Metadata = {
  title: "BLC Operations Console",
  description: "Bespoke London Chauffeurs — jobs, invoicing & payroll",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

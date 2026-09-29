import type { Metadata, Viewport } from "next";
// PT Sans (brand typeface), self-hosted via @fontsource so builds never
// depend on reaching Google Fonts.
import "@fontsource/pt-sans/400.css";
import "@fontsource/pt-sans/400-italic.css";
import "@fontsource/pt-sans/700.css";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "BLC Operations Console",
  description: "Bespoke London Chauffeurs — jobs, invoicing & payroll",
  icons: { icon: "/blc-logo.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Applies a manually chosen theme (see ThemeToggle) before first paint.
const themeInit = `try{var t=localStorage.getItem("blcTheme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

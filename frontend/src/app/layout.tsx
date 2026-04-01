import type { Metadata } from "next";
import { ToastProvider } from "./toast-provider";
import "./globals.css";

// Force dynamic rendering (SSR) for all pages since they use React Context
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "RentFlow - Property Rental Management",
  description: "Comprehensive property rental management system",
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}

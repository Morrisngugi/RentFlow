import type { Metadata } from "next";
import { ToastProvider } from "./toast-provider";
import "./globals.css";

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

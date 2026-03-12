import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RentFlow - Property Rental Management",
  description: "Comprehensive property rental management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

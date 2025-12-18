import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Motiverse",
  description: "Employee wellness and engagement platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* No hard-coded bg here; body uses CSS vars from globals.css */}
      <body className="text-white">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recicla",
  description: "Recicla is a real-time, AI-driven web application designed to bridge the gap between waste segregation and financial incentive.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
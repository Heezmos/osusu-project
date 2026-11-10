import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Osusu — Save together. Grow together.",
  description: "A smarter way to save, pay and grow. An Osusu product by Delight Ventures.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

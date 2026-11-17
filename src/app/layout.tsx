import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DVL Connect — Digital Infrastructure by Delight Ventures",
  description: "Connect business systems, exchange data and orchestrate workflows with DVL Connect.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

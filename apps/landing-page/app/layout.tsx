import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ParikshaOS - Secure Examination & Mock Test Platform for Schools",
  description: "Transform your computer lab into an authentic testing center. ParikshaOS offers secure, offline-tolerant examination software with exact JEE/NEET interfaces for Indian schools and coaching institutes.",
  keywords: ["examination software", "JEE mock test software", "NEET mock test software", "school computer lab exam", "offline examination system", "ParikshaOS"],
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-full flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
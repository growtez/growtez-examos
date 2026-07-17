import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ParikshaOS - Secure Examination & Mock Test Platform for Schools",
  description: "Transform your computer lab into an authentic testing center. ParikshaOS offers secure, offline-tolerant examination software with exact JEE/NEET interfaces for Indian schools and coaching institutes.",
  keywords: ["examination software", "JEE mock test software", "NEET mock test software", "school computer lab exam", "offline examination system", "ParikshaOS"],
  authors: [{ name: "Growtez", url: "https://growtez.com" }],
  creator: "Growtez",
  publisher: "Growtez",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://parikshaos.com",
    title: "ParikshaOS - Secure Examination & Mock Test Platform",
    description: "Transform your computer lab into an authentic testing center. ParikshaOS offers secure, offline-tolerant examination software.",
    siteName: "ParikshaOS",
    images: [
      {
        url: "/desktop-app-image.png",
        width: 1200,
        height: 630,
        alt: "ParikshaOS Interface",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ParikshaOS - Secure Examination & Mock Test Platform",
    description: "Transform your computer lab into an authentic testing center with exact JEE/NEET interfaces.",
    images: ["/desktop-app-image.png"],
  },
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
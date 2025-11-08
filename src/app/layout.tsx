import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import LayoutWrapper from "@/components/LayoutWrapper";
import { LoaderProvider } from "@/context/LoaderContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Gym Management System",
  description: "A modern gym automation dashboard",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`min-h-screen font-sans antialiased ${geistSans.variable} ${geistMono.variable}`}
        style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}
      >
        <LoaderProvider>
          <Providers>
            <LayoutWrapper>{children}</LayoutWrapper>
          </Providers>
        </LoaderProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AppProviders } from "@/shared/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "BusinessOS Odonto",
  description:
    "SaaS premium para gestão de clínicas odontológicas: agenda, pacientes, odontograma, orçamentos e financeiro.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`dark ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-screen font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

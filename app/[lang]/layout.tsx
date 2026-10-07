import "./globals.css"; 
import "leaflet/dist/leaflet.css";
import PageTitleUpdater from "../../components/PageTitleUpdater";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Satubumi — Measurable Action for a Resilient Future",
    template: "%s | Satubumi",
  },
  description:
    "Satubumi bridges science, nature, communities, and business to deliver certainty in an uncertain climate.",
  keywords: [
    "Satubumi",
    "Climate Advisory",
    "Carbon Assessment",
    "Sustainability",
    "ESG",
    "Biodiversity",
    "Rapid-FS",
    "Nature-based Solutions",
  ],
  authors: [{ name: "Satubumi" }],
  openGraph: {
    title: "Satubumi — Measurable Action for a Resilient Future",
    description:
      "Satubumi bridges science, nature, communities, and business to deliver certainty in an uncertain climate.",
    siteName: "Satubumi",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Satubumi — Measurable Action for a Resilient Future",
    description:
      "Satubumi bridges science, nature, communities, and business to deliver certainty in an uncertain climate.",
  },
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900 font-sans antialiased" suppressHydrationWarning>
        <PageTitleUpdater />
        {children}
      </body>
    </html>
  );
}
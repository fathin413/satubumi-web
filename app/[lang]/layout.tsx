import "./globals.css"; 
import "leaflet/dist/leaflet.css";
import PageTitleUpdater from "../../components/PageTitleUpdater";

export const metadata = {
  title: {
    default: "Home | Satubumi",
    template: "%s | Satubumi",
  },
  description: "Bridging science, nature, and business.",
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
import type { Metadata } from "next";
import "./globals.css";
import Breadcrumbs from "./components/Breadcrumbs";
import Footer from "./components/Footer";
import CartShell from "./components/CartShell";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: {
    default: 'Cesgar | Impresión 3D Industrial en Bogotá',
    template: '%s | Cesgar',
  },
  description: 'Impresión 3D industrial bajo demanda en Bogotá. Repuestos, escaneo 3D, diseño y fabricación a medida para la industria automotriz y manufactura.',
  metadataBase: new URL('https://cesgar.com.co'),
  icons: { icon: '/logotipo-empresa-cesgar.webp' },
  openGraph: {
    siteName: 'Cesgar',
    locale: 'es_CO',
    type: 'website',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Cesgar',
  url: 'https://cesgar.com.co',
  logo: 'https://cesgar.com.co/logotipo-empresa-cesgar.webp',
  description: 'Impresión 3D industrial bajo demanda. Repuestos, escaneo 3D, diseño y fabricación en Bogotá, Colombia.',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Bogotá',
    addressCountry: 'CO',
  },
  telephone: '+573057956352',
  email: 'cesangarciar@gmail.com',
  sameAs: [
    'https://www.instagram.com/cesgar_co/',
    'https://www.facebook.com/profile.php?id=61553397902949',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn("light", "font-sans", geist.variable)}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-surface text-on-surface font-body">
        <CartShell>
          <Breadcrumbs />
          {children}
          <Footer />
        </CartShell>
      </body>
    </html>
  );
}

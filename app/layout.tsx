import type { Metadata } from "next";
import "./globals.css";
import Breadcrumbs from "./components/Breadcrumbs";
import Footer from "./components/Footer";
import CartShell from "./components/CartShell";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Precision3D",
  description: "Impresión 3D industrial bajo demanda. Modelado, escaneo y mantenimiento.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn("light", "font-sans", geist.variable)}>
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

import type { Metadata } from "next";
import "./globals.css";
import Breadcrumbs from "./components/Breadcrumbs";

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
    <html lang="es" className="light">
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-surface text-on-surface font-body">
        <Breadcrumbs />
        {children}
      </body>
    </html>
  );
}

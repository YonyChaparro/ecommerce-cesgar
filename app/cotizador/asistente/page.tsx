export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { estadoAsistente, getAsistenteConfig } from '@/lib/asistente/config';
import Chat from './_components/Chat';

export const metadata: Metadata = {
  title: 'Asistente del cotizador',
  description: 'Cuéntale tu idea al asistente de Cesgar: te recomienda material y tecnología, te da precios reales de impresión 3D y, si estás de acuerdo, lo agrega a tu carrito.',
};

// Lee la configuración en el servidor: apagado, lleva al selector; encendido,
// le pasa los topes al chat.
export default async function AsistentePage() {
  const config = await getAsistenteConfig();
  if (!estadoAsistente(config).disponible) redirect('/cotizador');

  return (
    <>
      <Navbar />
      <Chat maxTurnos={config.maxTurnos} maxCaracteres={config.maxCaracteresMensaje} />
    </>
  );
}

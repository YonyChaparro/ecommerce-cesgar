import { leerHomeContent } from '@/lib/home-content';
import HomeContentForm from './HomeContentForm';

export default async function AdminInicioPage() {
  const { contenido, estado } = await leerHomeContent();
  return <HomeContentForm initial={contenido} estadoLectura={estado} />;
}

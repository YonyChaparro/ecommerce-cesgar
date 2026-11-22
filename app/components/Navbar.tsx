import { getHomeContent } from '@/lib/home-content';
import NavbarClient from './NavbarClient';

/**
 * Lee los textos del botón «Cotizar» (se editan en /admin/inicio) y pinta el
 * menú, que es de cliente. Las páginas siguen importando este archivo igual.
 * getHomeContent está en cache(): no suma consultas si la página ya lo pidió.
 */
export default async function Navbar() {
  const { menu } = await getHomeContent();
  return <NavbarClient cta={menu.cta} />;
}

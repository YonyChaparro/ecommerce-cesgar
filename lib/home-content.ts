import { cache } from 'react';
import { prisma } from './prisma';
import { type HomeContent, DEFAULT_HOME_CONTENT } from './home-content-types';
import { mezclarConDefaults } from './home-content-validate';

export type { HomeContent } from './home-content-types';
export { DEFAULT_HOME_CONTENT } from './home-content-types';

const CLAVE = 'home_content';

/**
 * Textos vigentes del home. Mezcla lo guardado con los textos de fábrica campo
 * por campo, así que un campo añadido después de la última vez que se guardó
 * nunca llega undefined. Nunca lanza: ante un JSON corrupto o una base caída
 * devuelve los textos de fábrica, que son los que tenía el código.
 *
 * Mismo patrón que lib/shipping-config.ts, con dos diferencias:
 *   - cache(): generateMetadata y la página la piden en el mismo request y sale
 *     una sola consulta.
 *   - el catch registra el error: un home con textos de fábrica habiendo textos
 *     guardados es un fallo que tiene que verse en los logs.
 */
export const getHomeContent = cache(async (): Promise<HomeContent> => (await leerHomeContent()).contenido);

/**
 * 'sin-conexion': la base no respondió. Lo guardado puede estar intacto, así
 *                 que el panel no debe dejar guardar encima.
 * 'danado':       hay algo guardado pero no es JSON (p. ej. cortado por MySQL).
 *                 Ya se perdió; guardar de nuevo es justamente cómo se repara.
 */
export type EstadoLectura = 'ok' | 'sin-conexion' | 'danado';

/** Como getHomeContent, pero dice cómo fue la lectura. Lo usa el panel. */
export async function leerHomeContent(): Promise<{ contenido: HomeContent; estado: EstadoLectura }> {
  let valor: string | undefined;
  try {
    valor = (await prisma.setting.findUnique({ where: { key: CLAVE } }))?.value;
  } catch (e) {
    console.error('[home-content] la base no respondió, se usan los textos de fábrica:', e);
    return { contenido: DEFAULT_HOME_CONTENT, estado: 'sin-conexion' };
  }
  if (!valor) return { contenido: DEFAULT_HOME_CONTENT, estado: 'ok' };
  try {
    return { contenido: mezclarConDefaults(JSON.parse(valor)), estado: 'ok' };
  } catch (e) {
    console.error(`[home-content] JSON guardado ilegible (${valor.length} caracteres), se usan los textos de fábrica:`, e);
    return { contenido: DEFAULT_HOME_CONTENT, estado: 'danado' };
  }
}

/** Guarda tal cual: validar y medir el tamaño es trabajo de quien llama. */
export async function saveHomeContent(content: HomeContent): Promise<void> {
  const value = JSON.stringify(content);
  await prisma.setting.upsert({
    where:  { key: CLAVE },
    update: { value },
    create: { key: CLAVE, value },
  });
}

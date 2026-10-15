'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';

// Más cerca que esto del final cuenta como "en la conversación actual".
const MARGEN = 160;

// Lleva `final` al borde inferior de la ventana. Sin animación: un scroll suave
// dispara posiciones intermedias que parecerían un cliente subiendo a leer, y se
// dejaría de seguir la respuesta.
function irAlFinal(final: HTMLElement | null) {
  if (!final) return;
  const y = final.getBoundingClientRect().top + window.scrollY - window.innerHeight;
  window.scrollTo({ top: Math.max(0, y), behavior: 'auto' });
}

/**
 * Deja la ventana en la conversación actual: al abrirla, al enviar un mensaje y
 * mientras llega la respuesta (texto, tarjetas que terminan de cargar, fotos).
 * Si el cliente sube a leer algo anterior deja de seguirlo, hasta que vuelva al
 * final o envíe otro mensaje.
 *
 * El final es el de la zona del chat (`final`, después de la caja de texto), no
 * el de la página: debajo está el pie del sitio. Con la caja de texto fija abajo,
 * llevar ese punto al borde inferior deja el último mensaje justo encima de ella.
 */
export function useSeguirConversacion(
  contenido: React.RefObject<HTMLElement | null>,
  final: React.RefObject<HTMLElement | null>,
  mensajesDelCliente: number,
) {
  const pegado = useRef(true);

  // ¿Sigue el cliente en el final? Se recalcula con cada scroll, suyo o nuestro.
  useEffect(() => {
    const medir = () => {
      const f = final.current;
      if (f) pegado.current = f.getBoundingClientRect().top - window.innerHeight < MARGEN;
    };
    window.addEventListener('scroll', medir, { passive: true });
    return () => window.removeEventListener('scroll', medir);
  }, [final]);

  // Al abrir una conversación guardada (o la primera respuesta): directo al final.
  useLayoutEffect(() => {
    irAlFinal(final.current);
  }, [final]);

  // Al enviar un mensaje: vuelve al final aunque estuviera leyendo arriba.
  const previos = useRef(mensajesDelCliente);
  useEffect(() => {
    if (mensajesDelCliente > previos.current) {
      pegado.current = true;
      irAlFinal(final.current);
    }
    previos.current = mensajesDelCliente;
  }, [mensajesDelCliente, final]);

  // Mientras la conversación crece, la sigue si el cliente estaba al final.
  useEffect(() => {
    const el = contenido.current;
    if (!el) return;
    const observador = new ResizeObserver(() => {
      if (pegado.current) irAlFinal(final.current);
    });
    observador.observe(el);
    return () => observador.disconnect();
  }, [contenido, final]);
}

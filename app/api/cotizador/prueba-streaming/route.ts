// Fase 0 de la propuesta: comprobar que el proxy de Hostinger deja pasar el
// streaming en vez de acumular la respuesta. Manda un trozo por segundo; con
//
//   curl -N https://cesgar.com.co/api/cotizador/prueba-streaming
//
// las líneas tienen que aparecer de a una. Si salen todas juntas a los 5
// segundos, el proxy está acumulando y el chat no se verá en vivo.
// Borrar esta ruta cuando la prueba pase.

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 1; i <= 5; i++) {
        controller.enqueue(encoder.encode(`data: trozo ${i} · ${new Date().toISOString()}\n\n`));
        await new Promise((r) => setTimeout(r, 1000));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}

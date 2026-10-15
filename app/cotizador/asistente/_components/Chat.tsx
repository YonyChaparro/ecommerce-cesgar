'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Orbe from '@/components/ia/Orbe';
import type { MensajeChat } from '@/lib/asistente/esquemas';
import { useAsistente, useSesionGuardada } from '../_hooks/useAsistente';
import { useSubidaStl } from '../_hooks/useSubidaStl';
import { AccionesChatProvider, type AccionesChatValor } from './AccionesChat';
import AdjuntoStl from './AdjuntoStl';
import BarraChat from './BarraChat';
import CajaTexto from './CajaTexto';
import Conversacion from './Conversacion';
import Inicio from './Inicio';

interface Topes {
  maxTurnos: number;
  maxCaracteres: number;
}

/** El chat de /cotizador/asistente. Espera el id guardado antes de abrir la conversación. */
export default function Chat(topes: Topes) {
  const { sesion, nueva } = useSesionGuardada();
  return (
    // overflow-x-clip: el aura se sale unos píxeles de su tarjeta y en móvil
    // abriría un scroll horizontal. Con clip (no hidden) la caja de texto sigue fija.
    <main className="flex min-h-screen flex-col overflow-x-clip bg-white pt-26 text-inverse-surface">
      {sesion ? (
        // La key reinicia useChat al empezar una conversación nueva.
        <ChatSesion key={sesion.id} id={sesion.id} iniciales={sesion.iniciales} onNueva={nueva} {...topes} />
      ) : (
        <>
          <BarraChat conCarrito={false} onNueva={nueva} />
          <div className="flex flex-1 items-center justify-center" aria-busy="true">
            <Orbe tamano="lg" activo />
          </div>
        </>
      )}
    </main>
  );
}

function ChatSesion({ id, iniciales, onNueva, maxTurnos, maxCaracteres }: Topes & {
  id: string;
  iniciales: MensajeChat[];
  onNueva: () => void;
}) {
  const a = useAsistente({ id, iniciales, maxTurnos });
  const subida = useSubidaStl(id);
  const [texto, setTexto] = useState('');
  const inputArchivo = useRef<HTMLInputElement>(null);

  const ocupado = a.estado === 'submitted' || a.estado === 'streaming';
  const fase = subida.estado.fase;
  const archivoListo = subida.estado.fase === 'listo' ? subida.estado.archivo : undefined;
  const puedeEnviar = !ocupado && fase !== 'subiendo' && fase !== 'midiendo' && (!!texto.trim() || !!archivoListo);

  const enviar = (t: string) => {
    if (ocupado || a.bloqueado) return;
    a.enviar(t, archivoListo);
    setTexto('');
    if (archivoListo) subida.limpiar();
  };

  const adjuntar = useCallback(() => inputArchivo.current?.click(), []);
  const { mensajes, abrirWhatsApp, responderConfirmacion, anotarAgregado, evento } = a;

  const precioMostradoProducto = useCallback((productoId: string) => {
    for (let i = mensajes.length - 1; i >= 0; i--) {
      for (const p of mensajes[i].parts) {
        if (p.type === 'tool-buscar_productos' && p.state === 'output-available') {
          const encontrado = p.output.productos.find((x) => x.id === productoId);
          if (encontrado) return encontrado.precio;
        }
      }
    }
    return undefined;
  }, [mensajes]);

  const acciones = useMemo<AccionesChatValor>(() => ({
    idConversacion: id,
    adjuntar,
    enviar: (t: string) => a.enviar(t),
    abrirWhatsApp,
    responderConfirmacion,
    anotarAgregado,
    evento,
    precioMostradoProducto,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [id, adjuntar, a.enviar, abrirWhatsApp, responderConfirmacion, anotarAgregado, evento, precioMostradoProducto]);

  const caja = (tamano: 'grande' | 'compacta') => (
    <CajaTexto
      tamano={tamano}
      valor={texto}
      onCambio={setTexto}
      onEnviar={() => enviar(texto)}
      onAdjuntar={adjuntar}
      maxCaracteres={maxCaracteres}
      puedeEnviar={puedeEnviar}
      deshabilitada={a.bloqueado}
      placeholder={tamano === 'grande' ? 'Ej.: soportes para una repisa de baño, unos 15 cm, que aguanten humedad' : 'Escribe tu mensaje…'}
      adjunto={subida.estado.fase !== 'inactivo' && (
        <AdjuntoStl estado={subida.estado} onQuitar={subida.cancelar} onAsesor={() => abrirWhatsApp()} />
      )}
    />
  );

  return (
    <AccionesChatProvider valor={acciones}>
      <BarraChat conCarrito={mensajes.length > 0} onNueva={onNueva} />
      <input
        ref={inputArchivo}
        type="file"
        accept=".stl"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) subida.subir(file);
          e.target.value = '';
        }}
      />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 sm:px-6">
        {mensajes.length === 0 ? (
          <Inicio caja={caja('grande')} onSugerencia={enviar} ocupado={ocupado} />
        ) : (
          <Conversacion
            mensajes={mensajes}
            estado={a.estado}
            error={a.error}
            turnosRestantes={a.turnosRestantes}
            bloqueado={a.bloqueado}
            caja={caja('compacta')}
            onReintentar={a.reintentar}
            onNueva={onNueva}
            onAsesor={() => abrirWhatsApp()}
          />
        )}
      </div>
    </AccionesChatProvider>
  );
}

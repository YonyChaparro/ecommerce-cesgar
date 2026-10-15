'use client';

import type { SalidaTool } from '@/lib/asistente/esquemas';
import { medidasMm, numero, pesos, volumenCm3 } from '@/lib/formato';
import Aviso from '../Aviso';
import { useAccionesChat } from '../AccionesChat';
import TablaOpciones from './TablaOpciones';

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-500">{etiqueta}</span>
      <strong className="text-base tabular-nums">{valor}</strong>
    </div>
  );
}

/** Encabezado compartido con la tabla suelta de comparar_opciones. */
export function CabeceraCotizacion({ archivo, codigo, configuracion }: { archivo: string; codigo: string; configuracion: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-4.5">
      <div className="flex flex-col gap-0.5">
        <strong className="text-base">{archivo}</strong>
        <span className="text-xs text-slate-500">Cotización {codigo} · medido en el servidor</span>
      </div>
      <span className="text-sm text-slate-600 sm:ml-auto">{configuracion}</span>
    </div>
  );
}

/** Tarjeta de cotizar_archivo (vista 3). Con comparar_opciones en el mismo mensaje, la tabla va adentro. */
export default function TarjetaCotizacion({ salida, comparacion }: {
  salida: SalidaTool<'cotizar_archivo'>;
  comparacion?: SalidaTool<'comparar_opciones'>;
}) {
  const { abrirWhatsApp } = useAccionesChat();

  if (salida.tipo === 'no-cotizable') {
    const grande = salida.motivo === 'grande';
    return (
      <Aviso
        tono="advertencia"
        titulo={grande ? 'Mide más de 30 cm' : 'No pudimos medir el volumen con seguridad'}
        texto={grande
          ? `${salida.archivo}: su lado más largo mide ${numero(salida.ladoMayorCm, 1)} cm. Un asesor puede revisar si se imprime por partes.`
          : `${salida.archivo}: la malla parece tener huecos o caras abiertas. Revisa el archivo o habla con un asesor antes de comprar.`}
        accion={<button type="button" onClick={() => abrirWhatsApp()} className="text-sm font-bold text-primary hover:underline">Hablar con un asesor</button>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <CabeceraCotizacion archivo={salida.archivo} codigo={salida.codigo} configuracion={salida.configuracion} />
        <div className="grid grid-cols-2 gap-4 border-y border-slate-200 px-5 py-3.5 sm:grid-cols-4">
          <Dato etiqueta="Medidas" valor={medidasMm(salida.medidasMm)} />
          <Dato etiqueta="Volumen" valor={volumenCm3(salida.volumenCm3)} />
          <Dato etiqueta="Peso aprox." valor={`${numero(salida.pesoGPorUnidad, 1)} g c/u`} />
          <Dato etiqueta="Impresión aprox." valor={`${numero(salida.horasPorUnidad, 1)} h c/u`} />
        </div>
        {comparacion ? (
          <TablaOpciones salida={comparacion} />
        ) : (
          <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-4 tabular-nums">
            <span className="text-sm text-slate-600">
              {numero(salida.cantidad)} × {pesos(salida.precioUnitario)}
              {salida.descuentoPct > 0 && <span className="ml-1 text-xs text-slate-500">−{salida.descuentoPct} % por cantidad</span>}
            </span>
            <strong className="text-xl">{pesos(salida.total)}</strong>
          </div>
        )}
      </div>
      {salida.rellenoFijado && (
        <Aviso
          tono="advertencia"
          titulo={salida.rellenoFijado === 'hueca' ? 'Pieza hueca' : 'Pieza laminar'}
          texto="El relleno queda fijo en 100 % para que la pieza no se debilite. El precio ya lo incluye."
        />
      )}
    </div>
  );
}

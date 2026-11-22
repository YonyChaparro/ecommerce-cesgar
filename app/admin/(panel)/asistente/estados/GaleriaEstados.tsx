'use client';

import { FileBox } from 'lucide-react';
import type { SalidaTool } from '@/lib/asistente/esquemas';
import { AccionesChatProvider, type AccionesChatValor } from '@/app/cotizador/asistente/_components/AccionesChat';
import AdjuntoStl from '@/app/cotizador/asistente/_components/AdjuntoStl';
import TarjetaEscaneo from '@/app/cotizador/asistente/_components/tarjetas/TarjetaEscaneo';
import TarjetaModelado from '@/app/cotizador/asistente/_components/tarjetas/TarjetaModelado';
import TablaOpciones from '@/app/cotizador/asistente/_components/tarjetas/TablaOpciones';
import { NO_INCLUYE_MODELADO } from '@/lib/asistente/mensajes-derivacion';
import { AvisoError, TopeAlcanzado } from '@/app/cotizador/asistente/_components/Conversacion';
import Escribiendo from '@/app/cotizador/asistente/_components/Escribiendo';
import FichaTool from '@/app/cotizador/asistente/_components/FichaTool';
import ListaProductos from '@/app/cotizador/asistente/_components/tarjetas/ListaProductos';
import TarjetaAsesor from '@/app/cotizador/asistente/_components/tarjetas/TarjetaAsesor';
import TarjetaCotizacion from '@/app/cotizador/asistente/_components/tarjetas/TarjetaCotizacion';
import TarjetaEnvio from '@/app/cotizador/asistente/_components/tarjetas/TarjetaEnvio';
import TarjetaEstimacion from '@/app/cotizador/asistente/_components/tarjetas/TarjetaEstimacion';
import TarjetasMaterial from '@/app/cotizador/asistente/_components/tarjetas/TarjetasMaterial';
import VistaConfirmacion from '@/app/cotizador/asistente/_components/tarjetas/VistaConfirmacion';
import TarjetaPersonalizada from '@/app/cotizador/_components/TarjetaPersonalizada';

// Datos de ejemplo: las cifras de las vistas 3 y 4 (tarifas por defecto).
const nada = () => {};
const ACCIONES: AccionesChatValor = {
  idConversacion: 'galeria-de-estados',
  adjuntar: nada, enviar: nada, abrirWhatsApp: nada, responderConfirmacion: nada,
  anotarAgregado: nada, evento: nada, precioMostradoProducto: () => undefined,
};

const ARCHIVO = {
  nombre: 'soporte_repisa.stl', bytes: 1_258_291,
  modelUrl: 'https://res.cloudinary.com/demo/raw/upload/v1/ecommerce-cesgar/modelos-3d/1-soporte_repisa.stl',
  medidasMm: { x: 84, y: 40, z: 62 }, volumenCm3: 42.6, geometria: 'solid' as const,
  grande: false, ladoMayorCm: 8.4, volumenNoFiable: false,
};
const base = { nombre: ARCHIVO.nombre, bytes: ARCHIVO.bytes };

const COTIZACION: Extract<SalidaTool<'cotizar_archivo'>, { tipo: 'cotizacion' }> = {
  tipo: 'cotizacion', codigo: 'Q-7F3K', archivo: 'soporte_repisa.stl', opcion: 'PETG Negro',
  configuracion: 'FDM · PETG Negro · Capa 0,2 mm · Relleno 40 %', medidasMm: ARCHIVO.medidasMm, volumenCm3: 42.6,
  pesoGPorUnidad: 21.6, horasPorUnidad: 6.4, cantidad: 4, precioUnitario: 10983, descuentoPct: 10, total: 43932, rellenoFijado: null,
};
const COMPARACION: SalidaTool<'comparar_opciones'> = {
  codigo: 'Q-7F3K', archivo: 'soporte_repisa.stl', configuracion: COTIZACION.configuracion,
  filas: [
    { opcion: 'PETG Negro', cantidad: 4, precioUnitario: 10983, descuentoPct: 10, total: 43932, elegida: true },
    { opcion: 'PLA Negro', cantidad: 4, precioUnitario: 9066, descuentoPct: 10, total: 36264, elegida: false },
    { opcion: 'PETG Negro', cantidad: 5, precioUnitario: 10373, descuentoPct: 15, total: 51865, elegida: false },
  ],
};
const MATERIALES: SalidaTool<'mostrar_materiales'> = {
  materiales: [
    { tecnologia: 'fdm', id: 'petg', nombre: 'PETG', descripcion: 'Resistente, ligeramente flexible', colores: ['Blanco', 'Negro', 'Translúcido', 'Plata'], recomendado: true, ventajas: ['No le afecta la humedad', 'Aguanta peso'], limites: [] },
    { tecnologia: 'fdm', id: 'pla', nombre: 'PLA', descripcion: 'Ideal para prototipos, biodegradable', colores: ['13 colores disponibles'], recomendado: false, ventajas: ['Más económico'], limites: ['Se puede deformar con calor y vapor'] },
  ],
};
const ESTIMACION: SalidaTool<'estimar_rango'> = {
  tipo: 'estimacion', codigo: 'E-2M9P', descripcion: 'Caja para circuito', medidasCm: { x: 10, y: 6, z: 3 }, cajaCm3: 180,
  tecnologia: 'FDM', material: 'PLA', capa: '0,2 mm', relleno: '40 %', ocupacionMinPct: 25, ocupacionMaxPct: 45, min: 10600, max: 18300,
};
const PRODUCTOS: SalidaTool<'buscar_productos'> = {
  productos: [
    { id: 'ejemplo-1', nombre: 'Boquillas de latón de 0.4 mm MK8', slug: 'boquillas-mk8', categoria: 'Repuestos', precio: 4000, imagen: '', stock: 25 },
    { id: 'ejemplo-2', nombre: 'Hotend All-Metal V6 Kit Completo', slug: 'hotend-v6', categoria: 'Repuestos', precio: 120000, imagen: '', stock: 3 },
  ],
};
const ASESOR: SalidaTool<'derivar_a_asesor'> = {
  mensaje: 'Hola, vengo del asistente de cotización de Cesgar.\nMotivo: Producción por volumen (50 unidades de una referencia).\nPerfil: Revendedor · Repuestos El Cruce\nPieza: rejilla de ventilación central — Chevrolet Spark GT 2016, tablero\nCantidad: 50 iniciales · mensual · ≈ 20/mes · para reventa\nMuestra: fragmentos · Medidas: unos 12 x 6 cm\nModelado: C3–C4 preliminar (confianza media)\nEnvío fotos de la pieza por aquí.',
  enlace: '#',
  motivo: 'VOLUME',
};
// Agente v5: modelado, escaneo y rutas de volumen (las cifras salen de los parámetros de fábrica).
const MODELADO_BASE = {
  codigo: 'M-4H8R', descripcion: 'Caja para tarjeta electrónica con tapa atornillada', claseMin: 'C2' as const, claseMax: 'C3' as const,
  horasMin: 0.5, confianza: 'media' as const, operaciones: ['extrusión', 'vaciado (shell)'],
  podriaCambiar: ['¿Tienes medidas, un plano o la pieza original para tomarlas?'], noIncluye: NO_INCLUYE_MODELADO,
};
const MODELADO: SalidaTool<'estimar_modelado'> = { tipo: 'estimado', ...MODELADO_BASE, horasMax: 2, min: 25000, max: 90000, revisionRecomendada: false };
const MODELADO_REVISION: SalidaTool<'estimar_modelado'> = { tipo: 'revision', ...MODELADO_BASE, horasMax: 2, motivo: 'no-publicado' };
const MODELADO_PROPUESTA: SalidaTool<'estimar_modelado'> = {
  tipo: 'en-propuesta', codigo: 'M-4H8R', descripcion: MODELADO_BASE.descripcion, claseMin: 'C2', claseMax: 'C3', horasMin: 0.5, horasMax: 2, confianza: 'media',
  mensaje: 'Por el volumen que necesitas, lo mejor es revisar tu proyecto como una solución de producción y no cotizar el diseño por separado. Nuestro equipo puede evaluar el lote y la posibilidad de incluir el desarrollo del modelo dentro de la propuesta.',
};
const ESCANEO: SalidaTool<'consultar_escaneo'> = {
  tipo: 'tarifas',
  filas: [
    { servicio: 'Escaneo pequeño', desde: 80000, condicion: 'Confirmar tamaño, superficie y acceso.' },
    { servicio: 'Limpieza adicional de malla', desde: 30000, condicion: 'Según el estado de la malla y el tiempo.' },
    { servicio: 'Reconstrucción CAD editable', desde: 250000, condicion: 'Aparte del escaneo; depende de la complejidad (C1–C6).' },
  ],
  aclaracion: 'El escaneo entrega una malla 3D; el CAD editable se cotiza aparte.',
};
const COMPARACION_VOLUMEN: SalidaTool<'comparar_opciones'> = {
  ...COMPARACION_BASE(),
  filas: [
    { opcion: 'PETG Negro', cantidad: 4, precioUnitario: 10983, descuentoPct: 10, total: 43932, elegida: true },
    { opcion: 'PETG Negro', cantidad: 60, precioUnitario: null, descuentoPct: null, total: null, elegida: false, volumen: true },
  ],
};
function COMPARACION_BASE() {
  return { codigo: 'Q-7F3K', archivo: 'soporte_repisa.stl', configuracion: 'FDM · PETG Negro · Capa 0,2 mm · Relleno 40 %' };
}
const ENVIO: SalidaTool<'estimar_envio'> = {
  tipo: 'envio', destino: 'Medellín, Antioquia', etiqueta: 'Ciudades principales · 2–4 días hábiles', costoEnvio: 18000,
  gratisPorMonto: false, lineas: [{ descripcion: 'Impresión 3D · soporte_repisa.stl', cantidad: 4, total: 43932 }],
  subtotal: 43932, total: 61932, recogida: null,
};
const CONFIRMACION = {
  titulo: 'Impresión 3D · soporte_repisa.stl', detalle: COTIZACION.configuracion, cantidad: 4,
  precioUnitario: 10983, total: 43932, pie: 'Datos de la cotización Q-7F3K. El precio se vuelve a verificar al pagar.',
};

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 overflow-hidden">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">{titulo}</h2>
      {children}
    </section>
  );
}

function Estado({ nombre, children }: { nombre: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className="font-mono text-xs text-slate-400">{nombre}</span>
      {children}
    </div>
  );
}

export default function GaleriaEstados() {
  return (
    <AccionesChatProvider valor={ACCIONES}>
      <div className="grid gap-5 lg:grid-cols-2 items-start text-inverse-surface">
        <Grupo titulo="Subida de STL">
          <Estado nombre="subiendo"><AdjuntoStl estado={{ fase: 'subiendo', ...base, progreso: 64 }} onQuitar={nada} onAsesor={nada} onFotos={nada} /></Estado>
          <Estado nombre="midiendo"><AdjuntoStl estado={{ fase: 'midiendo', ...base }} onQuitar={nada} onAsesor={nada} onFotos={nada} /></Estado>
          <Estado nombre="listo"><AdjuntoStl estado={{ fase: 'listo', ...base, archivo: ARCHIVO }} onQuitar={nada} onAsesor={nada} onFotos={nada} /></Estado>
          <Estado nombre="no es STL">
            <AdjuntoStl estado={{ fase: 'error', ...base, titulo: 'No es un archivo STL', texto: 'Exporta tu modelo en formato .stl e inténtalo de nuevo.' }} onQuitar={nada} onAsesor={nada} onFotos={nada} />
          </Estado>
          <Estado nombre="hueca, más de 30 cm y volumen no fiable">
            <AdjuntoStl
              estado={{ fase: 'listo', ...base, archivo: { ...ARCHIVO, geometria: 'hollow', grande: true, ladoMayorCm: 34, volumenNoFiable: true } }}
              onQuitar={nada}
              onAsesor={nada}
              onFotos={nada}
            />
          </Estado>
          <Estado nombre="adjunto enviado">
            <div className="flex items-center gap-2.5 self-start rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 w-fit">
              <FileBox size={20} className="text-ia-tinta" aria-hidden="true" />
              <div className="flex flex-col"><strong className="text-sm">soporte_repisa.stl</strong><span className="text-xs text-slate-500">1,2 MB · subido</span></div>
            </div>
          </Estado>
        </Grupo>

        <Grupo titulo="Confirmación de carrito">
          <Estado nombre="cargando"><VistaConfirmacion e={{ estado: 'cargando' }} /></Estado>
          <Estado nombre="pendiente"><VistaConfirmacion e={{ estado: 'pendiente', datos: CONFIRMACION }} onConfirmar={nada} onRechazar={nada} /></Estado>
          <Estado nombre="precio cambiado">
            <VistaConfirmacion e={{ estado: 'pendiente', datos: { ...CONFIRMACION, precioUnitario: 11500, total: 46000 }, precioAnterior: 10983 }} onConfirmar={nada} onRechazar={nada} />
          </Estado>
          <Estado nombre="confirmado"><VistaConfirmacion e={{ estado: 'confirmado', datos: CONFIRMACION }} onVerCarrito={nada} /></Estado>
          <Estado nombre="rechazado"><VistaConfirmacion e={{ estado: 'rechazado', datos: CONFIRMACION }} /></Estado>
          <Estado nombre="sin stock"><VistaConfirmacion e={{ estado: 'sin-stock', titulo: 'Hotend All-Metal V6 Kit Completo', disponible: 1 }} /></Estado>
          <Estado nombre="no disponible"><VistaConfirmacion e={{ estado: 'no-disponible', detalle: 'Una estimación sin archivo no se puede pagar.' }} /></Estado>
          <Estado nombre="volumen (D1)">
            <VistaConfirmacion e={{ estado: 'no-disponible', codigo: 'volumen', detalle: 'Para esta cantidad te preparamos una propuesta por WhatsApp.' }} onWhatsApp={nada} />
          </Estado>
          <Estado nombre="sin confirmar"><VistaConfirmacion e={{ estado: 'sin-confirmar' }} /></Estado>
        </Grupo>

        <Grupo titulo="Respuesta del asistente">
          <Estado nombre="escribiendo"><Escribiendo /></Estado>
          <Estado nombre="fichas">
            <div className="flex flex-wrap gap-4">
              <FichaTool enCurso texto="Calculando precio…" />
              <FichaTool enCurso texto="Buscando en la tienda…" />
              <FichaTool enCurso texto="Midiendo tu archivo…" />
              <FichaTool enCurso={false} texto="Comparó 3 opciones" />
            </div>
          </Estado>
          <Estado nombre="materiales"><TarjetasMaterial salida={MATERIALES} /></Estado>
        </Grupo>

        <Grupo titulo="Errores y topes">
          <Estado nombre="falló el modelo"><AvisoError error="fallo" onReintentar={nada} /></Estado>
          <Estado nombre="límite por IP (429)"><AvisoError error="limite" onReintentar={nada} /></Estado>
          <Estado nombre="asistente apagado"><AvisoError error="apagado" onReintentar={nada} /></Estado>
          <Estado nombre="te quedan 3"><p className="text-sm text-slate-600">Te quedan 3 mensajes en esta conversación.</p></Estado>
          <Estado nombre="tope de turnos"><TopeAlcanzado onNueva={nada} onAsesor={nada} /></Estado>
          <Estado nombre="tarjeta con el asistente apagado"><TarjetaPersonalizada /></Estado>
        </Grupo>

        <Grupo titulo="Cotización">
          <Estado nombre="con comparación"><TarjetaCotizacion salida={COTIZACION} comparacion={COMPARACION} /></Estado>
          <Estado nombre="sola, pieza hueca"><TarjetaCotizacion salida={{ ...COTIZACION, rellenoFijado: 'hueca' }} /></Estado>
          <Estado nombre="no cotizable">
            <TarjetaCotizacion salida={{ tipo: 'no-cotizable', archivo: 'tapa_tanque.stl', motivo: 'grande', medidasMm: { x: 340, y: 60, z: 40 }, ladoMayorCm: 34 }} />
          </Estado>
          <Estado nombre="volumen: 50 unidades o más">
            <TarjetaCotizacion salida={{ tipo: 'volumen', archivo: 'rejilla.stl', cantidad: 50, medidasMm: { x: 120, y: 60, z: 15 } }} />
          </Estado>
          <Estado nombre="uso crítico: revisión técnica">
            <TarjetaCotizacion salida={{ tipo: 'revision', archivo: 'soporte_mordaza_freno.stl', motivo: 'critica' }} />
          </Estado>
          <Estado nombre="comparación con fila de volumen">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><TablaOpciones salida={COMPARACION_VOLUMEN} /></div>
          </Estado>
        </Grupo>

        <Grupo titulo="Diseño 3D y escaneo (agente v5)">
          <Estado nombre="modelado: estimado"><TarjetaModelado salida={MODELADO} /></Estado>
          <Estado nombre="modelado: revisión (precio sin publicar)"><TarjetaModelado salida={MODELADO_REVISION} /></Estado>
          <Estado nombre="modelado: en la propuesta de volumen"><TarjetaModelado salida={MODELADO_PROPUESTA} /></Estado>
          <Estado nombre="modelado: no requiere"><TarjetaModelado salida={{ tipo: 'no-requiere', descripcion: 'Soporte' }} /></Estado>
          <Estado nombre="escaneo: tarifas «desde»"><TarjetaEscaneo salida={ESCANEO} /></Estado>
          <Estado nombre="escaneo: no disponible">
            <TarjetaEscaneo salida={{ tipo: 'no-disponible', motivo: 'no-publicado', aclaracion: ESCANEO.aclaracion }} />
          </Estado>
          <Estado nombre="solo texto: soltó una foto">
            <AdjuntoStl estado={{ fase: 'solo-texto', nombre: 'foto_pieza.jpg', bytes: 2_400_000 }} onQuitar={nada} onAsesor={nada} onFotos={nada} />
          </Estado>
          <Estado nombre="ficha (sin tarjeta)"><FichaTool enCurso={false} texto="Anotado" /></Estado>
        </Grupo>

        <Grupo titulo="Sin archivo, tienda, envío y asesor">
          <Estado nombre="estimación"><TarjetaEstimacion salida={ESTIMACION} /></Estado>
          <Estado nombre="estimación de más de 30 cm"><TarjetaEstimacion salida={{ tipo: 'grande', descripcion: 'Tapa de tanque', ladoMayorCm: 45 }} /></Estado>
          <Estado nombre="estimación: uso crítico"><TarjetaEstimacion salida={{ tipo: 'revision', descripcion: 'Soporte de pastilla de freno', motivo: 'critica' }} /></Estado>
          <Estado nombre="productos"><ListaProductos salida={PRODUCTOS} /></Estado>
          <Estado nombre="envío"><TarjetaEnvio salida={ENVIO} /></Estado>
          <Estado nombre="envío a confirmar"><TarjetaEnvio salida={{ tipo: 'a-confirmar', destino: 'Leticia, Amazonas', subtotal: 0 }} /></Estado>
          <Estado nombre="asesor"><TarjetaAsesor salida={ASESOR} /></Estado>
        </Grupo>
      </div>
    </AccionesChatProvider>
  );
}

import 'server-only';
import type { ContextoTools } from './contexto';
import { agregarAlCarrito } from './agregar-al-carrito';
import { buscarProductos } from './buscar-productos';
import { compararOpciones } from './comparar-opciones';
import { cotizarArchivo } from './cotizar-archivo';
import { derivarAAsesor } from './derivar-a-asesor';
import { estimarEnvio } from './estimar-envio';
import { estimarRango } from './estimar-rango';
import { listarMateriales } from './listar-materiales';
import { mostrarMateriales } from './mostrar-materiales';

export type { ContextoTools } from './contexto';

/** Las tools del asistente. Agregar una es sumar su esquema, su archivo y su entrada en el registro del chat. */
export function crearTools(ctx: ContextoTools) {
  return {
    buscar_productos: buscarProductos(ctx),
    listar_materiales: listarMateriales(ctx),
    mostrar_materiales: mostrarMateriales(ctx),
    cotizar_archivo: cotizarArchivo(ctx),
    comparar_opciones: compararOpciones(ctx),
    estimar_rango: estimarRango(ctx),
    estimar_envio: estimarEnvio(ctx),
    agregar_al_carrito: agregarAlCarrito(),
    derivar_a_asesor: derivarAAsesor(ctx),
  };
}

export type ToolsServidor = ReturnType<typeof crearTools>;

// Resuelve la portada de un artículo o proyecto con un respaldo: si la URL
// guardada no sirve como imagen, se usa la primera imagen del cuerpo.
//
// Hace falta porque en producción (MySQL) `coverImage` estuvo declarada como
// VARCHAR(191) y las URLs de Cloudinary más largas se guardaron cortadas, sin
// extensión ("...corriendo-feliz.pn"). El cuerpo no sufrió el recorte porque
// `content` es @db.LongText, así que sus imágenes sí cargan. El esquema ya usa
// @db.Text, pero los valores cortados siguen en la base hasta que se ejecute
// scripts/reparar-portadas.mjs; mientras tanto esto evita el hueco.
//
// De paso cubre el caso de un artículo publicado sin portada: en vez de la
// tarjeta con la inicial, muestra una imagen real del contenido.
//
// El criterio es "la URL termina en una extensión de imagen". Una portada
// legítima siempre la tiene (Cloudinary añade el formato al public_id), y una
// truncada casi nunca, porque el corte cae a mitad del nombre del archivo.

const URL_DE_IMAGEN = /\.(png|jpe?g|webp|gif|svg|avif)(\?.*)?$/i;

type NodoTiptap = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: NodoTiptap[];
};

/** ¿La URL se puede usar tal cual como `src` de una imagen? */
export function esPortadaUsable(url: string | null | undefined): boolean {
  return typeof url === 'string' && URL_DE_IMAGEN.test(url);
}

/** Primera imagen del cuerpo TipTap, o null si no hay ninguna aprovechable. */
export function primeraImagenDelContenido(content: string | null | undefined): string | null {
  if (!content) return null;

  let doc: NodoTiptap;
  try {
    doc = JSON.parse(content) as NodoTiptap;
  } catch {
    return null;
  }

  const pila: NodoTiptap[] = [doc];
  while (pila.length > 0) {
    const nodo = pila.shift()!;
    if (nodo.type === 'image' && esPortadaUsable(nodo.attrs?.src as string | undefined)) {
      return nodo.attrs!.src as string;
    }
    if (nodo.content) pila.unshift(...nodo.content);
  }
  return null;
}

/** La portada guardada si sirve; si no, la primera imagen del cuerpo. */
export function resolverPortada(
  coverImage: string | null | undefined,
  content: string | null | undefined
): string | null {
  if (esPortadaUsable(coverImage)) return coverImage as string;
  return primeraImagenDelContenido(content);
}

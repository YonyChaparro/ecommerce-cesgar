import { NextResponse } from 'next/server';
import { subirStl, validarArchivoStl } from '@/lib/stl-upload';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;

    const invalido = validarArchivoStl(file);
    if (invalido) return NextResponse.json({ error: invalido }, { status: 400 });

    const url = await subirStl(await file!.arrayBuffer(), file!.name);
    return NextResponse.json({ url });
  } catch (err) {
    console.error('[stl-upload]', err);
    return NextResponse.json({ error: 'Error al subir el modelo' }, { status: 500 });
  }
}

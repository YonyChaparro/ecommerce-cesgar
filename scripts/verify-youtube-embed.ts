// Banco de pruebas del embed de YouTube en blog/proyectos: la URL que el admin
// pega en el editor (watch, youtu.be, shorts, live, playlist, con &t=, &list=,
// &ab_channel=, ?si=...) debe convertirse en una URL de embed válida, o el video
// aparece "no disponible" al publicar. Sale con código 1 si algo falla.
//
//   npm run verify:youtube
import { tiptapToHtml, youtubeEmbedUrl } from '../lib/tiptap-html';

const NC = 'https://www.youtube-nocookie.com/embed/';
const ID = 'dQw4w9WgXcQ';

const CASES: [string, string | null][] = [
  // Formatos básicos
  [`https://www.youtube.com/watch?v=${ID}`,                    `${NC}${ID}`],
  [`https://youtube.com/watch?v=${ID}`,                        `${NC}${ID}`],
  [`https://m.youtube.com/watch?v=${ID}`,                      `${NC}${ID}`],
  [`https://youtu.be/${ID}`,                                   `${NC}${ID}`],
  [`https://www.youtube.com/shorts/${ID}`,                     `${NC}${ID}`],
  [`https://www.youtube.com/live/${ID}`,                       `${NC}${ID}`],
  [`https://www.youtube.com/embed/${ID}`,                      `${NC}${ID}`],
  [`https://www.youtube-nocookie.com/embed/${ID}`,             `${NC}${ID}`],
  // Sin protocolo (antes quedaba como enlace relativo al propio sitio)
  [`youtube.com/watch?v=${ID}`,                                `${NC}${ID}`],
  [`www.youtube.com/watch?v=${ID}`,                            `${NC}${ID}`],
  // Parámetros extra que YouTube agrega al copiar/compartir (antes rompían el ID)
  [`https://www.youtube.com/watch?v=${ID}&ab_channel=RickAstley`, `${NC}${ID}`],
  [`https://www.youtube.com/watch?v=${ID}&feature=share`,      `${NC}${ID}`],
  [`https://youtu.be/${ID}?si=AbCdEf123`,                      `${NC}${ID}`],
  [`https://www.youtube.com/shorts/${ID}?feature=share`,       `${NC}${ID}`],
  // Tiempo de inicio
  [`https://www.youtube.com/watch?v=${ID}&t=42s`,              `${NC}${ID}?start=42`],
  [`https://www.youtube.com/watch?v=${ID}&t=42`,               `${NC}${ID}?start=42`],
  [`https://youtu.be/${ID}?t=90`,                              `${NC}${ID}?start=90`],
  [`https://www.youtube.com/watch?v=${ID}&t=1m30s`,            `${NC}${ID}?start=90`],
  [`https://www.youtube.com/watch?v=${ID}&t=1h2m3s`,           `${NC}${ID}?start=3723`],
  [`https://www.youtube.com/embed/${ID}?start=15`,             `${NC}${ID}?start=15`],
  // Playlists
  [`https://www.youtube.com/watch?v=${ID}&list=PLxyz&index=3`, `${NC}${ID}?list=PLxyz`],
  [`https://www.youtube.com/playlist?list=PLxyz`,              `${NC}videoseries?list=PLxyz`],
  // No es YouTube / basura
  ['https://vimeo.com/123456',                                 null],
  ['https://example.com/watch?v=abc',                          null],
  ['https://www.youtube.com/',                                 null],
  ['',                                                         null],
  ['no es una url',                                            null],
  [`https://www.youtube.com/watch?v=<script>`,                 null],
];

let failed = 0;
for (const [input, expected] of CASES) {
  const actual = youtubeEmbedUrl(input);
  const ok = actual === expected;
  if (!ok) failed++;
  console.log(`${ok ? '✔' : '✘'} ${input || '(vacío)'}\n    → ${actual}${ok ? '' : `\n    esperado: ${expected}`}`);
}

// El renderizado completo debe producir un iframe con la URL de embed y los
// atributos que YouTube pide en su código oficial (allow + referrerpolicy).
const doc = JSON.stringify({
  type: 'doc',
  content: [{ type: 'youtube', attrs: { src: `https://www.youtube.com/watch?v=${ID}&t=10s`, start: 0, width: 640, height: 480 } }],
});
const html = tiptapToHtml(doc);
const htmlChecks: [string, boolean][] = [
  ['iframe apunta al embed', html.includes(`src="${NC}${ID}?start=10"`)],
  ['tiene allow',            html.includes('allow="accelerometer; autoplay;')],
  ['tiene referrerpolicy',   html.includes('referrerpolicy="strict-origin-when-cross-origin"')],
  ['tiene allowfullscreen',  html.includes('allowfullscreen')],
  ['envuelto en data-youtube-video', html.startsWith('<div data-youtube-video>')],
];
for (const [label, ok] of htmlChecks) {
  if (!ok) failed++;
  console.log(`${ok ? '✔' : '✘'} html: ${label}`);
}

// Una URL que no es de YouTube no debe desaparecer: se conserva como enlace.
const fallback = tiptapToHtml(JSON.stringify({
  type: 'doc',
  content: [{ type: 'youtube', attrs: { src: 'https://vimeo.com/123456' } }],
}));
const fallbackOk = fallback.includes('<a href="https://vimeo.com/123456"') && !fallback.includes('<iframe');
if (!fallbackOk) failed++;
console.log(`${fallbackOk ? '✔' : '✘'} html: URL ajena a YouTube se conserva como enlace`);

console.log(failed ? `\n${failed} comprobación(es) fallaron` : '\nTodo OK');
process.exit(failed ? 1 : 0);

type Mark = { type: string; attrs?: Record<string, string | null> };
type Node = { type: string; attrs?: Record<string, unknown>; content?: Node[]; marks?: Mark[]; text?: string };

function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const YOUTUBE_HOSTS = new Set([
  'youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com',
  'youtu.be', 'youtube-nocookie.com', 'www.youtube-nocookie.com',
]);

// "42", "42s", "1m30s", "1h2m3s" → segundos. Cualquier otra cosa → 0.
function parseStartSeconds(raw: string | null): number {
  if (!raw) return 0;
  if (/^\d+$/.test(raw)) return Number(raw);
  const m = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!m) return 0;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

// El editor guarda la URL tal cual la pegó el admin (watch?v=, youtu.be, shorts,
// live, embed o playlist, con o sin &t=, &list=, &ab_channel=, ?si=...). Aquí se
// extrae el ID del video y se arma la URL de embed que YouTube sí acepta dentro
// de un iframe. Se usa youtube-nocookie.com igual que el editor (nocookie: true).
// Devuelve null si la URL no es de YouTube.
export function youtubeEmbedUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/\//, '')}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) return null;

  let id: string | null;
  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1] || null;
  } else {
    const m = url.pathname.match(/^\/(?:embed|v|shorts|live)\/([\w-]+)/);
    id = m?.[1] ?? url.searchParams.get('v');
  }
  if (id && !/^[\w-]+$/.test(id)) return null;

  const list = url.searchParams.get('list');
  const start = parseStartSeconds(url.searchParams.get('t') ?? url.searchParams.get('start'));
  const base = 'https://www.youtube-nocookie.com/embed/';

  if (id && id !== 'videoseries') {
    const params = new URLSearchParams();
    if (start > 0) params.set('start', String(start));
    if (list) params.set('list', list);
    const query = params.toString();
    return `${base}${id}${query ? `?${query}` : ''}`;
  }
  if (list) return `${base}videoseries?list=${encodeURIComponent(list)}`;
  return null;
}

function applyMarks(text: string, marks: Mark[]): string {
  let out = escape(text);
  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':      out = `<strong>${out}</strong>`; break;
      case 'italic':    out = `<em>${out}</em>`; break;
      case 'underline': out = `<u>${out}</u>`; break;
      case 'strike':    out = `<s>${out}</s>`; break;
      case 'code':      out = `<code>${out}</code>`; break;
      case 'highlight': out = `<mark>${out}</mark>`; break;
      case 'link': {
        const href = escape(String(mark.attrs?.href ?? ''));
        out = `<a href="${href}" target="_blank" rel="noopener noreferrer">${out}</a>`;
        break;
      }
    }
  }
  return out;
}

function renderNodes(nodes: Node[]): string {
  return nodes.map(renderNode).join('');
}

function alignStyle(attrs?: Record<string, unknown>): string {
  const align = attrs?.textAlign as string | undefined;
  return align && align !== 'left' ? ` style="text-align:${align}"` : '';
}

function renderNode(node: Node): string {
  switch (node.type) {
    case 'doc':
      return renderNodes(node.content ?? []);

    case 'paragraph': {
      const inner = renderNodes(node.content ?? []);
      return `<p${alignStyle(node.attrs)}>${inner || '&nbsp;'}</p>`;
    }

    case 'text':
      return applyMarks(node.text ?? '', node.marks ?? []);

    case 'heading': {
      const level = (node.attrs?.level as number) ?? 2;
      const inner = renderNodes(node.content ?? []);
      return `<h${level}${alignStyle(node.attrs)}>${inner}</h${level}>`;
    }

    case 'bulletList':
      return `<ul>${renderNodes(node.content ?? [])}</ul>`;

    case 'orderedList':
      return `<ol>${renderNodes(node.content ?? [])}</ol>`;

    case 'listItem':
      return `<li>${renderNodes(node.content ?? [])}</li>`;

    case 'blockquote':
      return `<blockquote>${renderNodes(node.content ?? [])}</blockquote>`;

    case 'codeBlock': {
      const code = escape((node.content ?? []).map((n) => n.text ?? '').join(''));
      return `<pre><code>${code}</code></pre>`;
    }

    case 'horizontalRule':
      return '<hr>';

    case 'hardBreak':
      return '<br>';

    case 'image': {
      const src = escape(String(node.attrs?.src ?? ''));
      const alt = escape(String(node.attrs?.alt ?? ''));
      return `<img src="${src}" alt="${alt}">`;
    }

    case 'youtube': {
      const src = String(node.attrs?.src ?? '');
      if (!src) return '';
      const embedSrc = youtubeEmbedUrl(src);
      if (!embedSrc) {
        // No se pudo interpretar como YouTube: se deja el enlace para no perder el contenido.
        const href = escape(src);
        return `<p><a href="${href}" target="_blank" rel="noopener noreferrer">${href}</a></p>`;
      }
      return (
        `<div data-youtube-video><iframe src="${escape(embedSrc)}" title="Video de YouTube"` +
        ' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"' +
        ' referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe></div>'
      );
    }

    default:
      return renderNodes(node.content ?? []);
  }
}

export function tiptapToHtml(jsonString: string): string {
  try {
    const doc: Node = JSON.parse(jsonString);
    return renderNode(doc);
  } catch {
    return '';
  }
}

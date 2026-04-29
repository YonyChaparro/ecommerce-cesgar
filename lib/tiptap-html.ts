type Mark = { type: string; attrs?: Record<string, string | null> };
type Node = { type: string; attrs?: Record<string, unknown>; content?: Node[]; marks?: Mark[]; text?: string };

function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
      // Convert youtube watch URL to embed URL
      const embedSrc = src
        .replace('watch?v=', 'embed/')
        .replace('youtu.be/', 'www.youtube.com/embed/');
      return `<div data-youtube-video><iframe src="${escape(embedSrc)}" allowfullscreen loading="lazy"></iframe></div>`;
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

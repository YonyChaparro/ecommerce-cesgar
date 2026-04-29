'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExt from '@tiptap/extension-image';
import YoutubeExt from '@tiptap/extension-youtube';
import LinkExt from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, Minus,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link, Image, PlaySquare, Highlighter,
  Undo2, Redo2,
} from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  initialContent?: string;
  onChange?: (json: string) => void;
}

const EXTENSIONS = [
  StarterKit,
  ImageExt,
  YoutubeExt.configure({ controls: true, nocookie: true }),
  LinkExt.configure({ openOnClick: false }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Underline,
  Highlight,
  TextStyle,
  Placeholder.configure({ placeholder: 'Escribe el contenido del artículo…' }),
];

export { EXTENSIONS };

export default function TipTapEditor({ initialContent, onChange }: Props) {
  const editor = useEditor({
    extensions: EXTENSIONS,
    content: initialContent ? JSON.parse(initialContent) : '',
    onUpdate: ({ editor }) => {
      onChange?.(JSON.stringify(editor.getJSON()));
    },
    editorProps: {
      attributes: {
        class: 'min-h-96 px-5 py-4 focus:outline-none text-[#16234d] text-sm leading-relaxed',
      },
    },
    immediatelyRender: false,
  });

  if (!editor) return null;

  function btn(
    onClick: () => void,
    active: boolean,
    title: string,
    icon: ReactNode,
  ) {
    return (
      <button
        key={title}
        type="button"
        onClick={onClick}
        title={title}
        className={`p-1.5 rounded transition-colors ${
          active
            ? 'bg-[#4dbdcc]/20 text-[#16234d]'
            : 'text-slate-400 hover:text-[#16234d] hover:bg-slate-100'
        }`}
      >
        {icon}
      </button>
    );
  }

  function sep(key: string) {
    return <div key={key} className="w-px h-5 bg-slate-200 mx-1 shrink-0" />;
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#4dbdcc] focus-within:ring-2 focus-within:ring-[#4dbdcc]/20 transition">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-slate-100 bg-[#f8fafc]">
        {btn(() => editor.chain().focus().undo().run(), false, 'Deshacer', <Undo2 size={14} />)}
        {btn(() => editor.chain().focus().redo().run(), false, 'Rehacer', <Redo2 size={14} />)}

        {sep('s1')}

        {btn(() => editor.chain().focus().toggleBold().run(), editor.isActive('bold'), 'Negrita', <Bold size={14} />)}
        {btn(() => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'), 'Cursiva', <Italic size={14} />)}
        {btn(() => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'), 'Subrayado', <UnderlineIcon size={14} />)}
        {btn(() => editor.chain().focus().toggleStrike().run(), editor.isActive('strike'), 'Tachado', <Strikethrough size={14} />)}
        {btn(() => editor.chain().focus().toggleHighlight().run(), editor.isActive('highlight'), 'Resaltar', <Highlighter size={14} />)}

        {sep('s2')}

        {btn(() => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive('heading', { level: 1 }), 'Título 1', <Heading1 size={14} />)}
        {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }), 'Título 2', <Heading2 size={14} />)}
        {btn(() => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }), 'Título 3', <Heading3 size={14} />)}

        {sep('s3')}

        {btn(() => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'), 'Lista con viñetas', <List size={14} />)}
        {btn(() => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'), 'Lista numerada', <ListOrdered size={14} />)}
        {btn(() => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'), 'Cita', <Quote size={14} />)}
        {btn(() => editor.chain().focus().toggleCode().run(), editor.isActive('code'), 'Código', <Code size={14} />)}
        {btn(() => editor.chain().focus().setHorizontalRule().run(), false, 'Separador horizontal', <Minus size={14} />)}

        {sep('s4')}

        {btn(() => editor.chain().focus().setTextAlign('left').run(), editor.isActive({ textAlign: 'left' }), 'Alinear izquierda', <AlignLeft size={14} />)}
        {btn(() => editor.chain().focus().setTextAlign('center').run(), editor.isActive({ textAlign: 'center' }), 'Centrar', <AlignCenter size={14} />)}
        {btn(() => editor.chain().focus().setTextAlign('right').run(), editor.isActive({ textAlign: 'right' }), 'Alinear derecha', <AlignRight size={14} />)}
        {btn(() => editor.chain().focus().setTextAlign('justify').run(), editor.isActive({ textAlign: 'justify' }), 'Justificar', <AlignJustify size={14} />)}

        {sep('s5')}

        {btn(
          () => {
            const prev = editor.isActive('link') ? editor.getAttributes('link').href : '';
            const url = window.prompt('URL del enlace:', prev);
            if (url === null) return;
            if (url === '') { editor.chain().focus().unsetLink().run(); return; }
            editor.chain().focus().setLink({ href: url }).run();
          },
          editor.isActive('link'),
          'Insertar enlace',
          <Link size={14} />,
        )}
        {btn(
          () => {
            const url = window.prompt('URL de la imagen:');
            if (url) editor.chain().focus().setImage({ src: url }).run();
          },
          false,
          'Insertar imagen (URL)',
          <Image size={14} />,
        )}
        {btn(
          () => {
            const url = window.prompt('URL del video de YouTube:');
            if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
          },
          false,
          'Insertar video de YouTube',
          <PlaySquare size={14} />,
        )}
      </div>

      {/* Content area */}
      <EditorContent editor={editor} className="tiptap-content" />
    </div>
  );
}

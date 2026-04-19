/**
 * Strips WordPress/Gutenberg block editor artifacts from exported HTML.
 * - Removes data-start / data-end attributes added by the block editor
 * - Removes empty block-level tags left after stripping those attributes
 * - Collapses excessive whitespace
 */
export function cleanWordPressHtml(html: string): string {
  return html
    .replace(/\\n/g, '')
    .replace(/\s*data-(?:start|end)="[^"]*"/g, '')
    .replace(/<(h[1-6]|p|li|ul|ol)(\s[^>]*)?>\s*<\/\1>/g, '')
    .replace(/(\n\s*){3,}/g, '\n\n')
    .trim();
}

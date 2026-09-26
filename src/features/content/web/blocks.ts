/**
 * Minimal body renderer for admin-editable pages. Supported syntax:
 * paragraphs separated by blank lines, `## ` subheadings, and `- ` bullet
 * lists (one list per blank-line-separated chunk).
 */
export type ContentBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

export function parseBody(body: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let list: string[] = [];
  const flushList = (): void => {
    if (list.length > 0) {
      blocks.push({ type: 'list', items: list });
      list = [];
    }
  };

  for (const chunk of body.split('\n\n')) {
    const lines = chunk
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (lines.length > 0 && lines.every((line) => line.startsWith('- '))) {
      list.push(...lines.map((line) => line.slice(2).trim()));
      continue;
    }
    flushList();
    for (const line of lines) {
      if (line.startsWith('## ')) blocks.push({ type: 'heading', text: line.slice(3).trim() });
      else blocks.push({ type: 'paragraph', text: line });
    }
  }
  flushList();
  return blocks;
}

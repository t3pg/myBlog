import { visit } from 'unist-util-visit';
import { readdirSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';

export function remarkEmoji() {
  const emojiMap = {};
  const base = join(process.cwd(), 'public/emoji');

  if (existsSync(base)) {
    for (const file of readdirSync(base)) {
      if (file.startsWith('.') || file === 'wide') continue;
      const name = basename(file, extname(file));
      emojiMap[name] = `/emoji/${file}`;
    }
    const wideDir = join(base, 'wide');
    if (existsSync(wideDir)) {
      for (const file of readdirSync(wideDir)) {
        if (file.startsWith('.')) continue;
        const name = basename(file, extname(file));
        emojiMap[name] = `/emoji/wide/${file}`;
      }
    }
  }

  return (tree) => {
    visit(tree, 'textDirective', (node) => {
      const src = emojiMap[node.name];
      if (!src) return;

      const data = node.data || (node.data = {});
      data.hName = 'img';
      data.hProperties = {
        src,
        alt: node.name,
        className: ['emoji'],
      };
    });
  };
}

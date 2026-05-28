import { visit } from 'unist-util-visit';
import { readdirSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';

export function remarkEmoji() {
  const emojiMap = {};
  const emojiDir = join(process.cwd(), 'public/emoji');

  if (existsSync(emojiDir)) {
    for (const file of readdirSync(emojiDir)) {
      if (file.startsWith('.')) continue;
      const name = basename(file, extname(file));
      emojiMap[name] = `/emoji/${file}`;
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

import { readdirSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';

export function remarkEmoji() {
  const emojiMap = {};
  const emojiDir = join(process.cwd(), 'public/emoji');
  const emojiPattern = /:([A-Za-z0-9_-]+):/g;

  if (existsSync(emojiDir)) {
    for (const file of readdirSync(emojiDir)) {
      if (file.startsWith('.')) continue;
      const name = basename(file, extname(file));
      emojiMap[name] = `/emoji/${file}`;
    }
  }

  function createEmojiNode(name, src) {
    return {
      type: 'image',
      url: src,
      alt: name,
      data: {
        hProperties: {
          className: ['emoji'],
        },
      },
    };
  }

  function replaceEmojiTokens(value) {
    const nodes = [];
    let lastIndex = 0;
    let foundToken = false;

    emojiPattern.lastIndex = 0;

    for (let match = emojiPattern.exec(value); match; match = emojiPattern.exec(value)) {
      const name = match[1];
      const src = emojiMap[name];

      if (!src) continue;

      foundToken = true;

      if (match.index > lastIndex) {
        nodes.push({
          type: 'text',
          value: value.slice(lastIndex, match.index),
        });
      }

      nodes.push(createEmojiNode(name, src));
      lastIndex = match.index + match[0].length;
    }

    if (!foundToken) return null;

    if (lastIndex < value.length) {
      nodes.push({
        type: 'text',
        value: value.slice(lastIndex),
      });
    }

    return nodes;
  }

  function walk(node) {
    if (!node || !node.children) return;

    for (let index = 0; index < node.children.length; index += 1) {
      const child = node.children[index];

      if (child.type === 'text') {
        const replacement = replaceEmojiTokens(child.value);

        if (!replacement) continue;

        node.children.splice(index, 1, ...replacement);
        index += replacement.length - 1;
        continue;
      }

      walk(child);
    }
  }

  return (tree) => {
    walk(tree);
  };
}
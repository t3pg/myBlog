import { readdirSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';

export function remarkEmoji() {
  const emojiDir = join(process.cwd(), 'public/emoji');
  const emojiPattern = /:([A-Za-z0-9_-]+):/g;

  // Build variant map: name -> { default?, light?, dark? }
  const emojiVariants = {};

  if (existsSync(emojiDir)) {
    for (const file of readdirSync(emojiDir)) {
      if (file.startsWith('.')) continue;
      const name = basename(file, extname(file));
      const path = `/emoji/${file}`;

      if (name.endsWith('-light')) {
        const base = name.slice(0, -6);
        emojiVariants[base] = emojiVariants[base] || {};
        emojiVariants[base].light = path;
      } else if (name.endsWith('-dark')) {
        const base = name.slice(0, -5);
        emojiVariants[base] = emojiVariants[base] || {};
        emojiVariants[base].dark = path;
      } else {
        emojiVariants[name] = emojiVariants[name] || {};
        emojiVariants[name].default = path;
      }
    }
  }

  function resolveEmoji(name) {
    const v = emojiVariants[name];
    if (!v) return null;

    const lightSrc = v.light || v.default || null;
    const darkSrc = v.dark || v.default || null;

    if (!lightSrc && !darkSrc) return null;

    return { lightSrc, darkSrc };
  }

  function createEmojiNode(name, lightSrc, darkSrc) {
    if (lightSrc === darkSrc) {
      // Same source for both modes — plain <img>, no JS switching needed
      return {
        type: 'image',
        url: lightSrc,
        alt: name,
        data: { hProperties: { className: ['emoji'] } },
      };
    }

    // Different sources — hast element (hName) so Astro renders it without allowDangerousHtml.
    // No src at build time; JS sets the correct one before first paint.
    // property-information maps camelCase dataXxx → data-xxx attribute:
    //   dataEmojiLight → data-emoji-light, dataEmojiDark → data-emoji-dark
    const hProps = {
      alt: name,
      className: ['emoji', 'emoji-themed'],
    };
    if (lightSrc) hProps.dataEmojiLight = lightSrc;
    if (darkSrc) hProps.dataEmojiDark = darkSrc;

    return {
      type: 'emojiThemed',
      data: {
        hName: 'img',
        hProperties: hProps,
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
      const resolved = resolveEmoji(name);

      if (!resolved) continue;

      foundToken = true;

      if (match.index > lastIndex) {
        nodes.push({ type: 'text', value: value.slice(lastIndex, match.index) });
      }

      nodes.push(createEmojiNode(name, resolved.lightSrc, resolved.darkSrc));
      lastIndex = match.index + match[0].length;
    }

    if (!foundToken) return null;

    if (lastIndex < value.length) {
      nodes.push({ type: 'text', value: value.slice(lastIndex) });
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

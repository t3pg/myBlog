import { visit } from 'unist-util-visit';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const VALID_ID = /^[\w-]{11}$/;
const KNOWN_PREFIXES = ['www.', 'm.', 'music.', 'gaming.'];
const EMBED_BASE = 'https://www.youtube.com/embed/';
const THUMB_CDN = 'https://img.youtube.com/vi/';
const PUBLIC_THUMB_DIR = join(process.cwd(), 'public/yt-thumbs');

function normalizeHost(host) {
  for (const p of KNOWN_PREFIXES) {
    if (host.startsWith(p)) return host.slice(p.length);
  }
  return host;
}

function sanitizeId(id) {
  return id && VALID_ID.test(id) ? id : null;
}

function extractVideoId(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const host = normalizeHost(url.hostname);

    if (host === 'youtu.be') {
      return sanitizeId(url.pathname.split('/').filter(Boolean)[0] ?? null);
    }

    if (host.endsWith('youtube.com')) {
      const v = sanitizeId(url.searchParams.get('v'));
      if (v) return v;

      const segs = url.pathname.split('/').filter(Boolean);
      if (!segs.length) return null;

      if (segs[0] === 'embed' || segs[0] === 'shorts' || segs[0] === 'live') {
        return sanitizeId(segs[1] ?? null);
      }

      return sanitizeId(segs[segs.length - 1] ?? null);
    }
  } catch {
    return null;
  }
  return null;
}

/** maxresdefault → hqdefault の順で試し、public/yt-thumbs/{id}.jpg に保存。 */
async function downloadThumbnail(videoId) {
  const localPath = join(PUBLIC_THUMB_DIR, `${videoId}.jpg`);

  if (existsSync(localPath)) return `/yt-thumbs/${videoId}.jpg`;

  mkdirSync(PUBLIC_THUMB_DIR, { recursive: true });

  for (const quality of ['maxresdefault', 'hqdefault']) {
    const url = `${THUMB_CDN}${videoId}/${quality}.jpg`;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      writeFileSync(localPath, Buffer.from(await res.arrayBuffer()));
      return `/yt-thumbs/${videoId}.jpg`;
    } catch {
      // next quality
    }
  }

  return null;
}

function buildEmbedHtml(videoId, thumbSrc) {
  const imgSrc = thumbSrc ?? `${THUMB_CDN}${videoId}/hqdefault.jpg`;
  const embedSrc = `${EMBED_BASE}${videoId}?autoplay=1`;

  return (
    `<div class="yt-embed">` +
      `<img class="yt-thumb" src="${imgSrc}" loading="lazy" decoding="async" alt="YouTube動画">` +
      `<button class="yt-play" aria-label="動画を再生" data-src="${embedSrc}">` +
        `<svg class="yt-icon" viewBox="0 0 68 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
          `<path d="M66.5 7.8C65.8 5.3 63.8 3.4 61.4 2.7 56.1 1.2 34.1 1.2 34.1 1.2S12.1 1.2 6.8 2.7C4.4 3.4 2.4 5.3 1.7 7.8.2 13.1.2 24 .2 24S.2 34.9 1.7 40.2c.7 2.5 2.7 4.4 5.1 5.1 5.3 1.5 27.3 1.5 27.3 1.5s22 0 27.3-1.5c2.4-.7 4.4-2.6 5.1-5.1C68 34.9 68 24 68 24S68 13.1 66.5 7.8z" fill="#f00"/>` +
          `<path d="M27.1 34.2 44.6 24 27.1 13.8z" fill="#fff"/>` +
        `</svg>` +
      `</button>` +
    `</div>`
  );
}

export function remarkYoutube() {
  return async (tree) => {
    const replacements = [];

    visit(tree, 'paragraph', (node, index, parent) => {
      if (node.children.length !== 1) return;

      const child = node.children[0];
      let url = null;
      if (child.type === 'link') url = child.url;
      else if (child.type === 'text') url = child.value.trim();
      if (!url) return;

      const videoId = extractVideoId(url);
      if (!videoId) return;

      replacements.push({ parent, index, videoId });
    });

    await Promise.all(
      replacements.map(async ({ parent, index, videoId }) => {
        const thumbSrc = await downloadThumbnail(videoId);
        parent.children[index] = {
          type: 'html',
          value: buildEmbedHtml(videoId, thumbSrc),
        };
      })
    );
  };
}

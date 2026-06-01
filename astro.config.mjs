// @ts-check

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import astroExpressiveCode from 'astro-expressive-code';
import remarkLinkCard from 'remark-link-card-plus';
import mermaid from 'astro-mermaid';
import remarkDirective from 'remark-directive';
import { remarkCustomDirective } from './src/plugins/directive.mjs';
import { remarkEmoji } from './src/plugins/emoji.mjs';
import { remarkYoutube } from './src/plugins/youtube.mjs';

import starlight from '@astrojs/starlight';

// 記事のフロントマターから lastmod 用の日付（updatedDate 優先・無ければ pubDate）を
// 連番スラッグごとに収集する。記事 URL は /blog/{連番}/。
const blogDir = fileURLToPath(new URL('./src/content/blog', import.meta.url));

function collectBlogFiles(dir) {
	let files = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) files = files.concat(collectBlogFiles(full));
		else if (/\.mdx?$/.test(entry.name)) files.push(full);
	}
	return files;
}

const lastmodBySlug = {};
for (const file of collectBlogFiles(blogDir)) {
	const frontmatter = readFileSync(file, 'utf-8').split('---')[1] ?? '';
	const pub = frontmatter.match(/^\s*pubDate:\s*(.+)$/m)?.[1];
	const upd = frontmatter.match(/^\s*updatedDate:\s*(.+)$/m)?.[1];
	const raw = (upd || pub)?.trim().replace(/['"]/g, '');
	if (!raw || Number.isNaN(Date.parse(raw))) continue;
	const slug = path.basename(file).replace(/\.mdx?$/, '');
	lastmodBySlug[slug] = new Date(raw).toISOString();
}

// https://astro.build/config
export default defineConfig({
	site: 'https://t-3.dev',
	integrations: [
		mermaid(),
		astroExpressiveCode(),
		mdx(),
		sitemap({
			changefreq: 'weekly',
			priority: 0.7,
			// @ts-ignore
			serialize(item) {
				// ホームページ
				if (item.url === 'https://t-3.dev/') {
					return { ...item, changefreq: 'weekly', priority: 1.0 };
				}
				// ブログ一覧
				if (item.url === 'https://t-3.dev/blog/') {
					return { ...item, changefreq: 'weekly', priority: 0.8 };
				}
				// 個別ブログ記事は frontmatter の日付を lastmod に反映
				const match = item.url.match(/\/blog\/([^/]+)\/$/);
				if (match && lastmodBySlug[match[1]]) {
					return {
						...item,
						changefreq: 'monthly',
						priority: 0.7,
						lastmod: lastmodBySlug[match[1]],
					};
				}
				if (item.url.startsWith('https://t-3.dev/blog/')) {
					return { ...item, changefreq: 'monthly', priority: 0.7 };
				}
				// その他のページ（About など）
				return { ...item, changefreq: 'monthly', priority: 0.5 };
			},
		}),
		starlight({
			title: 't-log',
			tableOfContents: { minHeadingLevel: 1, maxHeadingLevel: 3 },
			locales: {
				root: {
					label: '日本語',
					lang: 'ja',
				},
			},
			disable404Route: true,
		}),
	],
	markdown: {
		remarkPlugins: [
			remarkYoutube,
			[remarkLinkCard, { cache: true }],
			remarkDirective,
			remarkCustomDirective,
			remarkEmoji,
		],
	},
});

// @ts-check
import { defineConfig } from 'astro/config';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';
import expressiveCode from 'astro-expressive-code';

import remarkLinkCardPlus from 'remark-link-card-plus';
import remarkDirective from 'remark-directive';
import remarkCustomDirective from './src/plugins/directive.mjs';
import remarkEmoji from './src/plugins/emoji.mjs';

const SITE = 'https://t-3.dev';

// 記事のフロントマターから lastmod（updatedDate 優先、無ければ pubDate）を収集。
// 記事 URL は /blog/{連番}/（ファイル名の連番がスラッグ）。
const blogDir = fileURLToPath(new URL('./src/content/blog', import.meta.url));

function walkBlog(dir) {
	let files = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) files = files.concat(walkBlog(full));
		else if (/\.mdx?$/.test(entry.name)) files.push(full);
	}
	return files;
}

const lastmodBySlug = {};
for (const file of walkBlog(blogDir)) {
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
	site: SITE,
	integrations: [
		mermaid(),
		expressiveCode(),
		mdx(),
		sitemap({
			serialize(item) {
				// トップページ
				if (item.url === `${SITE}/`) {
					item.priority = 1.0;
					item.changefreq = 'weekly';
				} else if (item.url === `${SITE}/blog/`) {
					item.priority = 0.8;
					item.changefreq = 'weekly';
				} else if (item.url.startsWith(`${SITE}/blog/`)) {
					item.priority = 0.7;
					item.changefreq = 'monthly';
				} else {
					item.priority = 0.5;
					item.changefreq = 'monthly';
				}
				// 記事ページは frontmatter の日付を lastmod に反映
				const match = item.url.match(/\/blog\/([^/]+)\/$/);
				if (match && lastmodBySlug[match[1]]) {
					item.lastmod = lastmodBySlug[match[1]];
				}
				return item;
			},
		}),
		starlight({
			title: 't-log',
			tableOfContents: { minHeadingLevel: 1, maxHeadingLevel: 3 },
			defaultLocale: 'root',
			locales: { root: { label: '日本語', lang: 'ja' } },
			disable404Route: true,
		}),
	],
	markdown: {
		remarkPlugins: [
			[remarkLinkCardPlus, { cache: true, shortenUrl: true }],
			remarkDirective,
			remarkCustomDirective,
			remarkEmoji,
		],
	},
});

// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import astroExpressiveCode from 'astro-expressive-code';
import remarkLinkCard from 'remark-link-card-plus';
import mermaid from 'astro-mermaid';
import remarkDirective from 'remark-directive';
import { remarkCustomDirective } from './src/plugins/directive.mjs';

import starlight from '@astrojs/starlight';

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
			lastmod: new Date(),
			serialize(item) {
				// ホームページ
				if (item.url === 'https://t-3.dev/') {
					return { ...item, changefreq: 'weekly', priority: 1.0 };
				}
				// ブログ一覧
				if (item.url === 'https://t-3.dev/blog/') {
					return { ...item, changefreq: 'weekly', priority: 0.8 };
				}
				// 個別ブログ記事
				if (item.url.startsWith('https://t-3.dev/blog/')) {
					return { ...item, changefreq: 'monthly', priority: 0.7 };
				}
				// その他のページ（About など）
				return { ...item, changefreq: 'monthly', priority: 0.5 };
			},
		}),
		starlight({
			title: 't-log',
			disable404Route: true,
		}),
	],
	markdown: {
		remarkPlugins: [
			[
				remarkLinkCard,
				{
					cache: true,
				},
			],
			remarkDirective,
			remarkCustomDirective,
		],
	},
});
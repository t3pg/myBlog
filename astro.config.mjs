// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import astroExpressiveCode from 'astro-expressive-code';

import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://t-log.pages.dev',
	integrations: [
		astroExpressiveCode(),
		mdx(),
		sitemap({
			changefreq: 'weekly',
			priority: 0.7,
			lastmod: new Date(),
			serialize(item) {
				// ホームページ
				if (item.url === 'https://t-log.pages.dev/') {
					return { ...item, changefreq: 'weekly', priority: 1.0 };
				}
				// ブログ一覧
				if (item.url === 'https://t-log.pages.dev/blog/') {
					return { ...item, changefreq: 'weekly', priority: 0.8 };
				}
				// 個別ブログ記事
				if (item.url.startsWith('https://t-log.pages.dev/blog/')) {
					return { ...item, changefreq: 'monthly', priority: 0.7 };
				}
				// その他のページ（About など）
				return { ...item, changefreq: 'monthly', priority: 0.5 };
			},
		}),
		starlight({
			title: 't-log'
		}),
	],
});
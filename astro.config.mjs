// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import astroExpressiveCode from 'astro-expressive-code';

import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://t-log.pages.dev',
	integrations: [astroExpressiveCode(), mdx(), sitemap(), starlight({
		title: 't-log'
	})],
});
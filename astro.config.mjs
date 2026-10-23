import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';

const site = process.env.SITE_URL ?? 'https://nagynotes.example.com';

export default defineConfig({
  site,
  output: 'static',
  integrations: [preact(), sitemap()],
});

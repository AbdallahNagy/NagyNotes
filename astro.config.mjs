import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { codeBlockPlugin } from './src/lib/markdown/code-block.ts';

// `||`, not `??`: an unset GitHub Actions variable arrives as an empty string.
const site = process.env.SITE_URL || 'https://nagynotes.example.com';

export default defineConfig({
  site,
  output: 'static',
  integrations: [preact(), sitemap()],
  markdown: {
    processor: satteri({ hastPlugins: [codeBlockPlugin] }),
    shikiConfig: {
      themes: { light: 'github-light', sepia: 'solarized-light', dark: 'github-dark-dimmed' },
      defaultColor: false,
    },
  },
});

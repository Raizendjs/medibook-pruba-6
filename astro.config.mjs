// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import mdx from '@astrojs/mdx';
import netlify from '@astrojs/netlify';

import react from '@astrojs/react';

export default defineConfig({
  site: 'https://zenix.farros.co',
  base: '/',
  trailingSlash: 'always',

  output: 'server',


  build: {
    inlineStylesheets: 'always'
  },

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [mdx(), react()],
  adapter: netlify()
});
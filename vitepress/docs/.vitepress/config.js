import { defineConfig } from 'vitepress';
import sidebar from './sidebar.mjs';

export default defineConfig({
  title: 'Titanium SDK',
  description: 'Titanium SDK API Reference',
  base: process.env.BASE || '/',
  lastUpdated: true,
  cleanUrls: true,

  markdown: {
    html: true,
  },

  ignoreDeadLinks: true,

  themeConfig: {
    outline: [2, 3],

    nav: [
      { text: 'Home', link: '/' },
      { text: 'API Reference', link: '/api/titanium/' },
    ],

    sidebar: {
      '/api/': sidebar,
    },

    search: {
      provider: 'local',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/tidev/titanium-sdk' },
    ],

    footer: {
      message: 'Titanium SDK Documentation',
      copyright: 'Copyright © TiDev, Inc.',
    },
  },
});

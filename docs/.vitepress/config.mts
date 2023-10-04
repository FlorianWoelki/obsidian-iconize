import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Obsidian Iconize',
  description:
    'Add icons to anything you desire in Obsidian, including files, folders, and text.',
  base: '/obsidian-iconize/',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Get Started', link: '/guide/getting-started' },
    ],

    search: {
      provider: 'local',
    },

    sidebar: [
      {
        text: 'Guide',
        collapsed: false,
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Settings', link: '/guide/settings' },
          { text: 'Icon Packs', link: '/guide/icon-packs' },
          { text: 'Syncing', link: '/guide/syncing' },
        ],
      },
      {
        text: 'Files and Folders',
        collapsed: false,
        items: [
          { text: 'Icon in Tabs', link: '/files-and-folders/icon-tabs' },
          { text: 'Inheritance', link: '/files-and-folders/inheritance' },
          { text: 'Custom Rules', link: '/files-and-folders/custom-rules' },
        ],
      },
    ],

    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/FlorianWoelki/obsidian-iconize',
      },
    ],

    footer: {
      message:
        'Released under the <a href="https://github.com/FlorianWoelki/obsidian-iconize/blob/main/LICENSE">MIT License</a>.',
      copyright:
        'Copyright © 2021-present <a href="https://github.com/FlorianWoelki/">Florian Woelki</a>',
    },
  },
});

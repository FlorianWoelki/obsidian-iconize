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
          {
            text: 'Icon before file/folder name',
            link: '/files-and-folders/icon-before-file-or-folder',
          },
          { text: 'Icon in Tabs', link: '/files-and-folders/icon-tabs' },
          { text: 'Custom Rules', link: '/files-and-folders/custom-rules' },
          {
            text: 'Use Frontmatter',
            link: '/files-and-folders/use-frontmatter',
          },
          {
            text: 'Change individual icon color',
            link: '/files-and-folders/individual-icon-color',
          },
        ],
      },
      {
        text: 'Notes',
        collapsed: false,
        items: [
          { text: 'Icons in Notes', link: '/notes/icons-in-notes' },
          { text: 'Icon above Title', link: '/notes/title-icon' },
        ],
      },
      {
        text: 'Good to know',
        collapsed: true,
        items: [
          { text: 'See icon name', link: '/good-to-know/see-icon-name' },
          {
            text: 'Use png in icon pack',
            link: '/good-to-know/transform-png-to-svg',
          },
          { text: 'Unicode issue', link: '/good-to-know/unicode-issue' },
        ],
      },
      {
        text: 'Deprecated',
        collapsed: true,
        items: [{ text: 'Inheritance', link: '/deprecated/inheritance' }],
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

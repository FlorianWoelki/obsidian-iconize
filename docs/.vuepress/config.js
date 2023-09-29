module.exports = {
  title: 'Obsidian Iconize',
  description: 'Documentation of using the Iconize plugin.',
  themeConfig: {
    nav: [{ text: 'Guide', link: '/guide/getting-started' }],
    sidebar: [
      {
        title: 'Guide',
        collapsable: false,
        children: [
          ['/guide/getting-started', 'Getting Started'],
          ['/guide/settings', 'Settings'],
          ['/guide/icon-packs', 'Icon Packs'],
        ],
      },
      {
        title: 'Files and Folders',
        collapsable: false,
        children: [
          ['/files-and-folders/icon-tabs', 'Icon in Tabs'],
          ['/files-and-folders/inheritance', 'Inheritance'],
          ['/files-and-folders/custom-rules', 'Custom Rules'],
        ],
      },
    ],
  },
};

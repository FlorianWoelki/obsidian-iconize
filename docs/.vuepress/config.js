module.exports = {
  title: 'Obsidian Iconize',
  description: 'Documentation of using the Iconize plugin.',
  themeConfig: {
    nav: [{ text: 'Guide', link: '/guide/' }],
    sidebar: [
      {
        title: 'Guide',
        collapsable: false,
        children: [
          ['/guide/getting-started', 'Getting Started'],
          ['/guide/icon-packs', 'Icon Packs'],
          ['/guide/icon-tabs', 'Icon in Tabs'],
          ['/guide/inheritance', 'Inheritance'],
          ['/guide/custom-rules', 'Custom Rules'],
        ],
      },
    ],
  },
};

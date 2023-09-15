module.exports = {
  title: 'Obsidian Iconize',
  description: 'Documentation of using the Iconize plugin.',
  themeConfig: {
    nav: [{ text: 'Counter', link: '/counter/' }],
    sidebar: [
      {
        title: 'Counter',
        collapsable: false,
        children: [
          ['/counter/usage', 'Usage'],
          ['/counter/see-also', 'See Also'],
        ],
      },
    ],
  },
};

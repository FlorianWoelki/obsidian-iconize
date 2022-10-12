export interface IconPack {
  name: string;
  displayName: string;
  path: string;
  downloadLink: string;
}

export default {
  faBrands: {
    name: 'font-awesome-brands',
    displayName: 'FontAwesome Brands',
    path: 'fontawesome-free-6.0.0-web/svgs/brands/',
    downloadLink: 'https://github.com/FortAwesome/Font-Awesome/releases/download/6.0.0/fontawesome-free-6.0.0-web.zip',
  },
  faRegular: {
    name: 'font-awesome-regular',
    displayName: 'FontAwesome Regular',
    path: 'fontawesome-free-6.0.0-web/svgs/regular/',
    downloadLink: 'https://github.com/FortAwesome/Font-Awesome/releases/download/6.0.0/fontawesome-free-6.0.0-web.zip',
  },
  faSolid: {
    name: 'font-awesome-solid',
    displayName: 'FontAwesome Solid',
    path: 'fontawesome-free-6.0.0-web/svgs/solid/',
    downloadLink: 'https://github.com/FortAwesome/Font-Awesome/releases/download/6.0.0/fontawesome-free-6.0.0-web.zip',
  },
  remixIcons: {
    name: 'remix-icons',
    displayName: 'Remix Icons',
    path: '',
    downloadLink: 'https://github.com/Remix-Design/RemixIcon/releases/download/v2.5.0/RemixIcon_SVG_v2.5.0.zip',
  },
  iconBrew: {
    name: 'icon-brew',
    displayName: 'Icon Brew',
    path: '',
    downloadLink: 'https://github.com/FlorianWoelki/obsidian-icon-folder/raw/main/iconPacks/icon-brew.zip',
  },
  /* https://simpleicons.org/ */
  simpleIcons: {
    name: 'simple-icons',
    displayName: 'Simple Icons',
    path: 'icons',
    downloadLink: 'https://github.com/simple-icons/simple-icons/archive/refs/tags/7.15.0.zip',
  },
} as { [key: string]: IconPack };

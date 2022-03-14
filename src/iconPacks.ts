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
} as { [key: string]: IconPack };

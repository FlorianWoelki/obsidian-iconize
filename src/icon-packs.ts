export interface IconPack {
  name: string;
  displayName: string;
  path: string;
  downloadLink: string;
}

const iconPacks = {
  faBrands: {
    name: 'font-awesome-brands',
    displayName: 'FontAwesome Brands',
    path: 'fontawesome-free-6.4.2-web/svgs/brands/',
    downloadLink:
      'https://github.com/FortAwesome/Font-Awesome/releases/download/6.4.2/fontawesome-free-6.4.2-web.zip',
  },
  faRegular: {
    name: 'font-awesome-regular',
    displayName: 'FontAwesome Regular',
    path: 'fontawesome-free-6.4.2-web/svgs/regular/',
    downloadLink:
      'https://github.com/FortAwesome/Font-Awesome/releases/download/6.4.2/fontawesome-free-6.4.2-web.zip',
  },
  faSolid: {
    name: 'font-awesome-solid',
    displayName: 'FontAwesome Solid',
    path: 'fontawesome-free-6.4.2-web/svgs/solid/',
    downloadLink:
      'https://github.com/FortAwesome/Font-Awesome/releases/download/6.4.2/fontawesome-free-6.4.2-web.zip',
  },
  remixIcons: {
    name: 'remix-icons',
    displayName: 'Remix Icons',
    path: '',
    downloadLink:
      'https://github.com/Remix-Design/RemixIcon/releases/download/v3.5.0/RemixIcon_Svg_v3.5.0.zip',
  },
  iconBrew: {
    name: 'icon-brew',
    displayName: 'Icon Brew',
    path: '',
    downloadLink:
      'https://github.com/FlorianWoelki/obsidian-iconize/raw/main/iconPacks/icon-brew.zip',
  },
  /** @source https://simpleicons.org/ */
  simpleIcons: {
    name: 'simple-icons',
    displayName: 'Simple Icons',
    path: 'simple-icons-9.14.0/icons',
    downloadLink:
      'https://github.com/simple-icons/simple-icons/archive/refs/tags/9.14.0.zip',
  },
  lucide: {
    name: 'lucide-icons',
    displayName: 'Lucide',
    path: '',
    downloadLink:
      'https://github.com/lucide-icons/lucide/releases/download/0.277.0/lucide-icons-0.277.0.zip',
  },
  tablerIcons: {
    name: 'tabler-icons',
    displayName: 'Tabler Icons',
    path: 'svg',
    downloadLink:
      'https://github.com/tabler/tabler-icons/releases/download/v2.34.0/tabler-icons-2.34.0.zip',
  },
  /** @source https://boxicons.com/ */
  boxicons: {
    name: 'boxicons',
    displayName: 'Boxicons',
    path: 'svg',
    downloadLink:
      'https://github.com/FlorianWoelki/obsidian-iconize/raw/main/iconPacks/boxicons.zip',
  },
  /** @source http://nagoshiashumari.github.io/Rpg-Awesome/ */
  rpgAwesome: {
    name: 'rpg-awesome',
    displayName: 'RPG Awesome',
    path: '',
    downloadLink:
      'https://github.com/FlorianWoelki/obsidian-iconize/raw/main/iconPacks/rpg-awesome.zip',
  },
} as { [key: string]: IconPack };

/**
 * Returns a possible path to the icon pack.
 * @param name String of the icon pack name.
 * @returns String of the path to the icon pack or undefined if the icon pack does not
 * exist.
 */
export const getExtraPath = (iconPackName: string): string | undefined => {
  const path: string | undefined = Object.values(iconPacks).find(
    (iconPack) => iconPack.name === iconPackName,
  )?.path;
  return path?.length === 0 ? undefined : path;
};

export default iconPacks;

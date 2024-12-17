import { logger } from '@app/lib/logger';
import { IconPack } from './icon-pack';
import svg from '@app/lib/util/svg';
import { Icon } from '.';
import IconizePlugin from '@app/main';

export function getNormalizedName(s: string): string {
  return s
    .split(/[ -]|[ _]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function nextIdentifier(iconName: string): number {
  return iconName.substring(1).search(/[(A-Z)|(0-9)]/) + 1;
}

export function getSvgFromLoadedIcon(
  plugin: IconizePlugin,
  iconPrefix: string,
  iconName: string,
): string {
  let icon = '';
  let foundIcon = plugin
    .getIconPackManager()
    .getPreloadedIcons()
    .find(
      (icon) =>
        icon.prefix.toLowerCase() === iconPrefix.toLowerCase() &&
        icon.name.toLowerCase() === iconName.toLowerCase(),
    );
  if (!foundIcon) {
    plugin
      .getIconPackManager()
      .getIconPacks()
      .forEach((iconPack) => {
        const icon = iconPack.getIcons().find((icon) => {
          return (
            icon.prefix.toLowerCase() === iconPrefix.toLowerCase() &&
            getNormalizedName(icon.name).toLowerCase() ===
              iconName.toLowerCase()
          );
        });
        if (icon) {
          foundIcon = icon;
        }
      });
  }

  if (foundIcon) {
    icon = foundIcon.svgElement;
  }

  return icon;
}

const validIconName = /^[(A-Z)|(0-9)]/;
const svgViewboxRegex = /viewBox="([^"]*)"/g;
const svgContentRegex = /<svg.*>(.*?)<\/svg>/g;
export function generateIcon(
  iconPack: IconPack,
  iconName: string,
  content: string,
): Icon | null {
  if (content.length === 0) {
    return;
  }

  content = content.replace(/(\r\n|\n|\r)/gm, '');
  content = content.replace(/>\s+</gm, '><');
  const normalizedName =
    iconName.charAt(0).toUpperCase() + iconName.substring(1);

  if (!validIconName.exec(normalizedName)) {
    logger.info(`Skipping icon with invalid name: ${iconName}`);
    return null;
  }

  const svgViewboxMatch = content.match(svgViewboxRegex);
  let svgViewbox = '';
  if (svgViewboxMatch && svgViewboxMatch.length !== 0) {
    svgViewbox = svgViewboxMatch[0];
  }

  const svgContentMatch = content.match(svgContentRegex);
  if (!svgContentMatch) {
    logger.info(`Skipping icon with invalid svg content: ${iconName}`);
    return null;
  }

  const svgContent = svgContentMatch.map((val) =>
    val.replace(/<\/?svg>/g, '').replace(/<svg.+?>/g, ''),
  )[0];

  const icon: Icon = {
    name: normalizedName.split('.svg')[0],
    prefix: iconPack.getPrefix(),
    iconPackName: iconPack.getName(),
    displayName: iconName,
    filename: iconName,
    svgContent,
    svgViewbox,
    svgElement: svg.extract(content),
  };

  return icon;
}

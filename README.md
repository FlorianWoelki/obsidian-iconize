# Obsidian Iconize

![Preview Image](https://raw.githubusercontent.com/FlorianWoelki/obsidian-iconize/main/docs/preview-image.png)

## What is it?

This obsidian plugin allows you to add **any** custom icon (of type `.svg`) or from an icon pack to anything you want.

Refer to the official documentation for more information:
[https://florianwoelki.github.io/obsidian-iconize/](https://florianwoelki.github.io/obsidian-iconize/) about the plugin and its functionalities.

If you like this plugin, feel free to support the development by buying a coffee:

<a href="https://www.buymeacoffee.com/florianwoelki" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## Key Highlights

[Icons before file/folder name](https://florianwoelki.github.io/obsidian-iconize/files-and-folders/icon-before-file-or-folder.html),
[Icons in notes](https://florianwoelki.github.io/obsidian-iconize/notes/icons-in-notes.html),
[Icon above title](https://florianwoelki.github.io/obsidian-iconize/notes/title-icon.html),
[Predefined icon packs](https://florianwoelki.github.io/obsidian-iconize/guide/icon-packs.html),
[Icons in tabs](https://florianwoelki.github.io/obsidian-iconize/files-and-folders/icon-tabs.html),
[Customizable settings](https://florianwoelki.github.io/obsidian-iconize/guide/settings.html),
[Custom rules](https://florianwoelki.github.io/obsidian-iconize/files-and-folders/custom-rules.html),
[Frontmatter integration](https://florianwoelki.github.io/obsidian-iconize/files-and-folders/use-frontmatter.html),
[Change color of an individual icon](https://florianwoelki.github.io/obsidian-iconize/files-and-folders/individual-icon-color.html),

## Development

To customize this project for your needs, you can clone it and then install all dependencies:
```sh
$ git clone https://github.com/FlorianWoelki/obsidian-iconize
$ cd obsidian-iconize
$ pnpm i
```

After the installation, you need to create a `env.js` file in the root directory. Fill the file with the following content:

```js
export const obsidianExportPath =
  '<path-to-obsidian-vault>/.obsidian/plugins/obsidian-iconize/';
```

Make sure you create the directory specified in that variable if it does not exist yet.

Afterwards, you can start the rollup dev server by using:

```sh
$ pnpm dev
```

This command will automatically build the neccesary files for testing and developing on every change. Furthermore, it does copy all the necessary files to the plugin directory you specified.

Finally, you can customize the plugin and add it to your plugins.

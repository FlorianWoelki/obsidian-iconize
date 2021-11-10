# Obsidian Icon Folder [![CodeQL](https://github.com/FlorianWoelki/obsidian-icon-folder/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/FlorianWoelki/obsidian-icon-folder/actions/workflows/codeql-analysis.yml)

This obsidian plugin allows you to add icons to your folder or icon if you want.

Right now, the current iconsets are supported:
* [Remixicon](https://remixicon.com/)
* [Fontawesome](https://fontawesome.com/)

## How it will look like

This is how your folders can look like:

![Folder Preview](https://github.com/FlorianWoelki/obsidian-icon-folder/blob/main/docs/folder-preview.png)

## How to use

It is pretty simple to add a icon to your folder:

1. Right click on the folder where you want to add an icon
2. Select the `Change Icon` menu item (prefixed with a `#` icon)
3. Select the icon you want and profit!

To delete an icon, you just need to click on the `Delete Icon` (prefixed with a `trash` icon) menu item.

To enable other icon sets, go to settings and enable or disable your wanted icons.

In addition, you can adjust some styling settings for all the icons like padding, color, or even the font size.

## Development

To customize this project for your needs, you can clone it and then install all dependencies:
```sh
$ git clone https://github.com/FlorianWoelki/obsidian-icon-folder
$ cd obsidian-icon-folder
$ yarn
```

After installing all dependencies, you need to generate the icon folders so that they will be displayed and added to the output file:

```sh
$ node scripts/generate-icons.js
```

After executing successfully, you can start the rollup dev server by using:

```sh
$ yarn dev
```

This command will automatically build the neccesary files for testing and developing on every change.

Also, make sure that you copy the built files into the the plugins directory.

For example (command for OSX):
```sh
$ cp main.js manifest.json src/styles.css /Users/<user>/Library/Mobile\ Documents/iCloud\~md\~obsidian/Documents/Second\ Brain/.obsidian/plugins/obsidian-icon-folder
```

Finally, you can customize the plugin and add it to your plugins.

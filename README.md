# Obsidian Icon Folder [![CodeQL](https://github.com/FlorianWoelki/obsidian-icon-folder/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/FlorianWoelki/obsidian-icon-folder/actions/workflows/codeql-analysis.yml)

![Preview Image](https://raw.githubusercontent.com/FlorianWoelki/obsidian-icon-folder/main/docs/preview-image.png)

## What is it?

This obsidian plugin allows you to add any custom icon (of type `.svg`) or from an icon pack to your folder or file.

Right now, the current predefined icon packs are supported and can be downloaded:
* [Remixicon](https://remixicon.com/)
* [Fontawesome](https://fontawesome.com/)
* [IconBrew](https://iconbrew.com/)
* [SimpleIcons](https://simpleicons.org/)

However, feel free to add your custom icon packs or submit a new one by creating a Pull Request where you update the [iconPacks.ts](https://github.com/FlorianWoelki/obsidian-icon-folder/blob/main/src/iconPacks.ts) file and upload a zip file with the icons to [this directory](https://github.com/FlorianWoelki/obsidian-icon-folder/tree/main/iconPacks).

## How to use

There are different functionalities of displaying an icon for your folder or file.

First, you need to go to the settings and download predefined icon packs or create your own.

![Icon Pack Preview](https://raw.githubusercontent.com/FlorianWoelki/obsidian-icon-folder/main/docs/icon-pack-preview.png)

In addition to the custom icon pack, it is possible to drag and drop or select multiple files to your customized icon pack.

Moreover, you can adjust some styling settings for all the icons like margin, color, or even the icon size.

### Changing icon of the folder

It is pretty simple to add an icon to your folder:

1. Right click on the folder where you want to add an icon
2. Select the `Change Icon` menu item (prefixed with a `#` icon)
3. Select the icon you want and profit!

To delete an icon, you just need to click on the `Delete Icon` (prefixed with a `trash` icon) menu item.

### Inherit Icon

This functionality lets you define an `inherit icon` for a specific folder. When you add a file to this folder, the created file will inherit this icon. In addition, all files in the folder will have this specific inherited icon.

To apply an inherited icon:

1. Right-click the folder
2. Use the `Inherit icon` menu entry
3. For removing: just right-click again and click `Remove inherit icon`

### Custom Rules for automatically adding icons

This feature allows you to add custom rules (based on regex or a simple string comparison) to always add icons when they meet a specific condition.

To use custom rules, go to the plugin's settings, add a simple rule and an icon. Every file or folder that meets this condition will now have the icon.

### Using Twemoji for Emojis as folders

[Twemoji](https://github.com/twitter/twemoji) is a popular library to add universal emojis to your application. With the help of this library, you can now set an emoji as your folder icon. Just follow these steps:

1. Right-click the folder
2. Click `Change icon`
3. Open your OS-specific emoji dialog
    1. Mac OSX: `Control + Command + Space`
    2. Windows: `Windows + ;`
4. Select the option `Use twemoji emoji`

### Migration

Suppose you used a previous version of this plugin. Please follow this guide to migrate to the newest version, which allows customizable icon packs.

A migration script will run whenever you haven't migrated yet. Therefore, all icons should be gone from your vault.
However, you can easily install or create icon packs you used. For example, when you use the `font-awesome-solid` pack, you can easily download it in the settings and restart your vault. Every icon of this pack should now be visible.

### Sync issue

There have been some [syncing issues regarding the icon packs](https://github.com/FlorianWoelki/obsidian-icon-folder/issues/52). You can change the icon pack path to `.obsidian/icons` to resolve the issue. Go to settings, select the plugin, and change its path to the earlier described path.

### Using other icon plugins with icon packs

Suppose you are using other icon pack plugins with a download functionality. In that case, it is common to change the icon pack path to a more public folder so that you have no issue syncing the icons between different devices.

Therefore, if you go to the plugin's settings, you can specify the public folder where every icon pack can be downloaded. It will automatically check if the icon pack already exists in this directory.

## Development

To customize this project for your needs, you can clone it and then install all dependencies:
```sh
$ git clone https://github.com/FlorianWoelki/obsidian-icon-folder
$ cd obsidian-icon-folder
$ pnpm i
```

After the installation, you need to create a `env.js` file in the root directory. Fill the file with the following content:

```js
export const obsidianExportPath =
  '<path-to-obsidian-vault>/.obsidian/plugins/obsidian-icon-folder/';
```

Afterwards, you can start the rollup dev server by using:

```sh
$ pnpm dev
```

This command will automatically build the neccesary files for testing and developing on every change. Furthermore, it does copy all the necessary files to the plugin directory you specified.

Finally, you can customize the plugin and add it to your plugins.

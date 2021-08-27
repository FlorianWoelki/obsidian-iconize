import { Plugin, MenuItem } from 'obsidian';
import IconsPickerModal from './iconsPickerModal';
import { addToDOMWithElement, waitForNode } from './util';

export default class IconFolderPlugin extends Plugin {
	private folderIconData: Record<string, string>;

	async onload() {
		console.log('loading plugin obsidian-icon-folder');

		await this.loadIconFolderData();

		Object.entries(this.folderIconData).forEach(([key, value]) => {
			waitForNode(`[data-path="${key}"]`).then((node) => {
				addToDOMWithElement(this, key, value, node);
			});
		});

		this.registerEvent(this.app.workspace.on('file-menu', (menu, file) => {
			const menuItem = (item: MenuItem) => {
				item.setTitle('Change icon');
				item.setIcon('hashtag');
				item.onClick((evt) => {
					menu.hide();
					const modal = new IconsPickerModal(this.app, this, file.path);
					modal.open();
				});
			};

			menu.addItem(menuItem);
		}));
	}

	onunload() {
		console.log('unloading plugin obsidian-icon-folder');
	}

	addFolderIcon(path: string, iconId: string): void {
		this.folderIconData[path] = iconId;
		this.saveIconFolderData();
	}

	async loadIconFolderData(): Promise<void> {
		this.folderIconData = Object.assign({}, {}, await this.loadData());
	}

	async saveIconFolderData(): Promise<void> {
		await this.saveData(this.folderIconData);
	}
}

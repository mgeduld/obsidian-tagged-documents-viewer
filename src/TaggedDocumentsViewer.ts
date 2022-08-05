import { Plugin, requireApiVersion } from "obsidian";
import SettingsTab, {
	DEFAULT_SETTINGS,
	PluginSettings,
	Settings,
} from "./SettingsTab";
import TaggedDocumentsModal from "./TaggedDocumentsModal";
import { isTagNode } from "./utils/tags";

export default class TaggedDocumentsViewer extends Plugin {
	settings: PluginSettings;
	ribbonIcon: HTMLElement;
	modalIsOpen: boolean = false;

	private shouldAbort(altKeyPressed: boolean) {
		return (
			!this.settings.openModalOnClick ||
			(this.settings.requireOptionKey && !altKeyPressed) ||
			this.modalIsOpen
		);
	}

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SettingsTab(this.app, this));

		if (requireApiVersion("0.15.0")) {
			this.registerDomEvent(
				activeDocument,
				"click",
				(evt: MouseEvent) => {
					if (this.shouldAbort(evt.altKey)) return;
					this.handleClick(evt.target as HTMLElement);
				}
			);
			this.app.workspace.on("window-open", (leaf) => {
				this.registerDomEvent(leaf.doc, "click", (evt: MouseEvent) => {
					if (this.shouldAbort(evt.altKey)) return;
					this.handleClick(evt.target as HTMLElement);
				});
			});
		}

		if (this.settings.displayRibbonIcon) {
			this.showRibbonIcon();
		}
	}

	onunload() {}

	showRibbonIcon() {
		this.ribbonIcon = this.addRibbonIcon(
			"hashtag",
			"Tagged Documents Viewer",
			(evt: MouseEvent) => {
				new TaggedDocumentsModal(this, this.app, "").open();
			}
		);
	}

	hideRibbonIcon() {
		this.ribbonIcon.remove();
	}

	async onSettingChange(setting: Settings, value: boolean) {
		this.settings.openModalOnClick = value;
		await this.saveSettings();
		switch (setting) {
			case Settings.DisplayRibbonIcon:
				if (value) this.showRibbonIcon();
				else this.hideRibbonIcon();
				return;
			case Settings.OpenModalOnClick:
				this.settings.openModalOnClick = value;
				return;
			case Settings.RequireOptionKey:
				this.settings.requireOptionKey = value;
				return;
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async handleClick(target: HTMLElement) {
		if (!isTagNode(target)) return;
		const tag = target.innerText;
		this.modalIsOpen = true;
		new TaggedDocumentsModal(this, this.app, tag).open();
	}
}

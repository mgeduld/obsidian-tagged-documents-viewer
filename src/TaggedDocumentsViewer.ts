import { Plugin } from "obsidian";
import SettingsTab, {
	DEFAULT_SETTINGS,
	PluginSettings,
	Settings,
} from "./SettingsTab";
import TaggedDocumentsModal from "./TaggedDocumentsModal";

export default class TaggedDocumentsViewer extends Plugin {
	settings: PluginSettings;
	openModalOnClick: boolean = true;
	requireOptionKey: boolean = false;
	ribbonIcon: HTMLElement;
	modalIsOpen: boolean = false;

	async onload() {
		await this.loadSettings();
		this.openModalOnClick = this.settings.openModalOnClick;
		this.requireOptionKey = this.settings.requireOptionKey;
		this.addSettingTab(new SettingsTab(this.app, this));
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			if (!this.openModalOnClick) return;
			if (this.requireOptionKey && !evt.altKey) return;
			if (this.modalIsOpen) return;
			this.handleClick(evt.target as HTMLElement);
		});
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

	onSettingChange(setting: Settings, value: boolean) {
		switch (setting) {
			case Settings.DisplayRibbonIcon:
				if (value) this.showRibbonIcon();
				else this.hideRibbonIcon();
				return;
			case Settings.OpenModalOnClick:
				this.openModalOnClick = value;
				return;
			case Settings.RequireOptionKey:
				this.requireOptionKey = value;
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

	isTagNode(target: HTMLElement): boolean {
		return (
			target.classList.contains("tag") ||
			target.classList.contains("cm-hashtag")
		);
	}

	private async handleClick(target: HTMLElement) {
		if (!this.isTagNode(target)) return;
		const tag = target.innerText;
		this.modalIsOpen = true;
		new TaggedDocumentsModal(this, this.app, tag).open();
	}
}

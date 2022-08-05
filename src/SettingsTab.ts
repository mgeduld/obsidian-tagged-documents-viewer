import { App, Setting, PluginSettingTab, ToggleComponent } from "obsidian";
import TaggedDocumentsViewer from "./TaggedDocumentsViewer";

export enum Settings {
	DisplayRibbonIcon,
	OpenModalOnClick,
	RequireOptionKey,
}

export interface PluginSettings {
	displayRibbonIcon: boolean;
	openModalOnClick: boolean;
	requireOptionKey: boolean;
}

export const DEFAULT_SETTINGS: Partial<PluginSettings> = {
	displayRibbonIcon: true,
	openModalOnClick: true,
	requireOptionKey: false,
};

export default class SettingsTab extends PluginSettingTab {
	plugin: TaggedDocumentsViewer;

	constructor(app: App, plugin: TaggedDocumentsViewer) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Display Ribbon Icon")
			.setDesc(
				"Display a ribbon icon which will open the modal when clicked."
			)
			.addToggle((component: ToggleComponent) => {
				component
					.setValue(this.plugin.settings.displayRibbonIcon)
					.onChange(async (value) => {
						this.plugin.settings.displayRibbonIcon = value;
						this.plugin.onSettingChange(
							Settings.DisplayRibbonIcon,
							value
						);
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Open Modal On Click")
			.setDesc("Open the model when a tag is clicked.")
			.addToggle((component: ToggleComponent) => {
				component
					.setValue(this.plugin.settings.openModalOnClick)
					.onChange(async (value) => {
						this.plugin.onSettingChange(
							Settings.OpenModalOnClick,
							value
						);
					});
			});

		new Setting(containerEl)
			.setName("Require Alt/Option Key")
			.setDesc(
				"Require the alt/option key to be down when clicking a tag."
			)
			.addToggle((component: ToggleComponent) => {
				component
					.setValue(this.plugin.settings.requireOptionKey)
					.onChange(async (value) => {
						this.plugin.settings.requireOptionKey = value;
						this.plugin.onSettingChange(
							Settings.RequireOptionKey,
							value
						);
						await this.plugin.saveSettings();
					});
			});
	}
}

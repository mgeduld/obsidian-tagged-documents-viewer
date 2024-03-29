//adapted from https://github.com/Aidurber/tag-page-preview/blob/master/src/utils/render.ts
import { App, OpenViewState, TFile, Platform } from "obsidian";

/**
 * Check if the event was CTRL for Windows or Command for macOS
 * @param event - Mouse Event
 * @returns
 */
function isMetaKey(event: MouseEvent): boolean {
	return Platform.isMacOS ? event.metaKey : event.ctrlKey;
}
/**
 * Open an Obsidian link
 * @param app - Obsidian App object
 * @param dest  - Link href
 * @param currFile - Current open file
 * @param event - Click event
 */
async function openLink(
	app: App,
	dest: string,
	currFile: TFile,
	event: MouseEvent
): Promise<void> {
	const destFile = app.metadataCache.getFirstLinkpathDest(
		dest,
		currFile.path
	);
	if (!destFile) return;
	const mode = (app.vault as any).getConfig("defaultViewMode");
	const leaf = app.workspace.getLeaf(isMetaKey(event));
	await leaf.openFile(
		destFile as TFile,
		{ active: true, mode } as OpenViewState
	);
}
/**
 * Create a native-ish obsidian link
 * @param app - Obsidian App
 * @param file - File to link
 * @param onClick - Optional: onClick callback
 * @returns
 */
export function createLink(
	app: App,
	file: TFile,
	onClick?: (e: MouseEvent) => void
): HTMLAnchorElement {
	const link = createTextContent("a", file.basename);
	link.style.cursor = "pointer";
	link.dataset.href = file.path;
	link.classList.add("internal-link");
	link.onclick = (e: MouseEvent) => {
		openLink(app, file.path, file, e);

		if (typeof onClick === "function") {
			onClick(e);
		}
	};
	return link;
}

/**
 * Utility to quickly create a DOM element and set the text content for it
 * @param element - Element to render
 * @param content - Content to embed into the element
 * @returns
 */
export function createTextContent<K extends keyof HTMLElementTagNameMap>(
	element: K,
	content: string
): HTMLElementTagNameMap[K] {
	const el = document.createElement(element);
	el.setText(content);
	return el;
}

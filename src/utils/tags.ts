import { App, TFile, getAllTags, CachedMetadata } from "obsidian";

export const getTaglists = (tagText: string): [string[], string[]] => {
	const tags = tagText.split(" ");
	const include = tags.filter((tag) => tag.charAt(0) !== "!");
	const exclude = tags
		.filter((tag) => tag.charAt(0) === "!")
		.map((tag) => tag.substring(1));

	return [include, exclude];
};

export const isTagNode = (target: HTMLElement): boolean => {
	return (
		target.classList.contains("tag") ||
		target.classList.contains("cm-hashtag")
	);
};

const hasTag = (tags: string[], value: string): boolean => {
	if (!tags.length || !Array.isArray(tags)) return false;
	return tags.some(
		(v) => v.toLocaleLowerCase() === value.toLocaleLowerCase()
	);
};

// adapted from https://github.com/Aidurber/tag-page-preview/blob/master/src/utils/find-tags.ts
const getAllFilesMatchingTag = (app: App, tag: string): Set<TFile> => {
	const files = app.vault.getMarkdownFiles();
	const result: Set<TFile> = new Set();
	for (let file of files) {
		const tags =
			getAllTags(
				app.metadataCache.getCache(file.path) as CachedMetadata
			) || [];
		if (hasTag(tags, `#${tag}`)) {
			result.add(file);
		}
	}

	return result;
};

export const getFilesFromTag = (app: App, tags: string[]): TFile[] => {
	return tags.reduce((accumulator, tag) => {
		return [
			...accumulator,
			...Array.from(getAllFilesMatchingTag(app, tag) || []),
		];
	}, []);
};

export const getTagFiles = (app: App, tag: string): TFile[] => {
	const [tagsToInclude, tagsToExclude] = getTaglists(tag);
	const startingFiles: TFile[] = getFilesFromTag(app, tagsToInclude);
	const filesToExclude: string[] = getFilesFromTag(app, tagsToExclude).map(
		(file) => file.path
	);
	return startingFiles.filter((file) => !filesToExclude.includes(file.path));
};

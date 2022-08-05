import { TFile } from "obsidian";
import { MAX_DOC_LENGTH, MAX_DOCS_PER_PAGE } from "./constants";

type ReaderFunction = (file: TFile) => Promise<string>;

export type FileInfo = {
	file: TFile;
	text: string;
};

const getDocument = async (
	file: TFile,
	reader: ReaderFunction
): Promise<string> => {
	let fileText = await reader(file);
	if (fileText.length > MAX_DOC_LENGTH) {
		fileText =
			fileText.substring(0, MAX_DOC_LENGTH) + "... *[File truncated]*";
	}
	return fileText;
};

export const getDocuments = async (
	filesWithTags: TFile[],
	currentPage: number,
	reader: ReaderFunction
): Promise<FileInfo[]> => {
	const totalFiles = filesWithTags.length;
	if (!totalFiles) return [];
	const startIndex = currentPage * MAX_DOCS_PER_PAGE;
	const files = filesWithTags.slice(
		startIndex,
		startIndex + MAX_DOCS_PER_PAGE
	);
	const contents: FileInfo[] = [];
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const fileText = await getDocument(file, reader);
		contents.push({
			file,
			text: fileText,
		});
	}
	return contents;
};

import { App, Modal, TFile, MarkdownRenderer } from "obsidian";
import PaginationControls from "./PaginationControls";
import { createLink } from "./utils/links";
import { getTagFiles } from "./utils/tags";
import { FileInfo, getDocuments } from "./utils/documents";
import TaggedDocumentsViewer from "./TaggedDocumentsViewer";
import { MAX_DOCS_PER_PAGE } from "./utils/constants";

export default class TaggedDocumentsModal extends Modal {
	contents: FileInfo[] = [];
	button: HTMLElement;
	input: HTMLElement;
	topPaginationControls: PaginationControls;
	bottomPaginationControls: PaginationControls;
	topPaginationControlsContainer: HTMLElement;
	bottomPaginationControlsContainer: HTMLElement;
	listContainer: HTMLElement;
	buttonListener: number;
	querying = false;
	filesWithTags: TFile[] = [];
	currentPage = 0;
	boundPaginationListener: EventListener;

	constructor(
		private plugin: TaggedDocumentsViewer,
		public app: App,
		private tag: string
	) {
		super(app);
		this.tag = tag;
		this.contents = [];
	}

	async getListContents() {
		const contents: FileInfo[] = await getDocuments(
			this.filesWithTags,
			this.currentPage,
			this.app.vault.cachedRead
		);
		const ul = this.containerEl.createEl("ul");
		contents.forEach(async ({ file, text }) => {
			const li = ul.createEl("li");
			const title = this.containerEl.createEl("h3");
			const link = createLink(this.app, file, () => this.close());
			const content = this.containerEl.createEl("div");
			await MarkdownRenderer.renderMarkdown(
				text,
				content,
				file.path,
                // @ts-ignore
				null
			);
			li.appendChild(title);
			title.appendChild(link);
			li.appendChild(content);
		});

		return ul;
	}

	async renderList() {
		this.querying = true;
		const listContents = await this.getListContents();
		this.listContainer.empty();
		this.listContainer.appendChild(listContents);
		this.querying = false;
	}

	async onPageChange(page: number) {
		this.currentPage = page;
		if (this.topPaginationControls.currentPage !== page)
			this.topPaginationControls.changeCurrentPage(page);
		if (this.bottomPaginationControls.currentPage !== page)
			this.bottomPaginationControls.changeCurrentPage(page);
		await this.renderList();
	}

	async tagQuerySubmitLister() {
		if (this.querying) return;
		const inputEl = this.contentEl.querySelector(
			"[data-tag-names]"
		) as HTMLInputElement;
		this.tag = inputEl.value;
		this.filesWithTags = getTagFiles(this.app, this.tag);
		if (this.filesWithTags.length > MAX_DOCS_PER_PAGE) {
			this.topPaginationControls.renderPaginationControls(
				this.filesWithTags.length
			);
			this.bottomPaginationControls.renderPaginationControls(
				this.filesWithTags.length
			);
		}
		this.currentPage = 0;
		await this.renderList();
	}

	tagQueryKeyListener(event: KeyboardEvent) {
		if (event.key === "Enter") {
			this.tagQuerySubmitLister();
		}
	}

	renderContainer() {
		const container = this.containerEl.createEl("div");
		container.addClass("tagged-documents-viewer-container");

		return container;
	}

	renderInput() {
		const input = this.contentEl.createEl("input");
		this.input = input;
		input.value = this.tag;
		input.setAttribute("data-tag-names", "");
		input.addEventListener("keypress", this.tagQueryKeyListener.bind(this));

		return input;
	}

	renderButton() {
		const button = this.contentEl.createEl("button");
		this.button = button;
		button.innerText = "OK";
		button.addEventListener("click", this.tagQuerySubmitLister.bind(this));

		return button;
	}

	renderForm() {
		const form = this.contentEl.createEl("div");
		form.addClass("tagged-documents-viewer-form");
		const input = this.renderInput();
		input.setAttribute("placeholder", "tag-1 tag-2 !not-tag-3");
		const button = this.renderButton();
		form.appendChild(input);
		form.appendChild(button);

		return form;
	}

	async renderLayout() {
		const { contentEl } = this;
		contentEl.empty();
		const container = this.renderContainer();
		const form = this.renderForm();
		this.topPaginationControlsContainer = contentEl.createEl("div", {
			cls: "pagination-controls-container",
		});
		this.bottomPaginationControlsContainer = contentEl.createEl("div", {
			cls: "pagination-controls-container",
		});
		this.listContainer = contentEl.createEl("div");
		this.listContainer.setAttribute(
			"data-tageed-documents-viewer-list",
			""
		);
		this.listContainer.addClass("tagged-documents-viewer-list-container");
		await this.renderList();
		this.topPaginationControls = new PaginationControls(
			this.topPaginationControlsContainer,
			this.onPageChange.bind(this)
		);
		this.bottomPaginationControls = new PaginationControls(
			this.bottomPaginationControlsContainer,
			this.onPageChange.bind(this)
		);
		if (this.tag && this.filesWithTags.length > MAX_DOCS_PER_PAGE) {
			this.topPaginationControls.renderPaginationControls(
				this.filesWithTags.length
			);
			this.bottomPaginationControls.renderPaginationControls(
				this.filesWithTags.length
			);
		}
		container.appendChild(form);
		container.appendChild(this.topPaginationControlsContainer);
		container.appendChild(this.listContainer);
		container.appendChild(this.bottomPaginationControlsContainer);
		contentEl.appendChild(container);
	}

	async onOpen() {
		this.filesWithTags = getTagFiles(this.app, this.tag);
		await this.renderLayout();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
		this.button.removeEventListener("click", this.tagQuerySubmitLister);
		this.input.removeEventListener("keydown", this.tagQueryKeyListener);
		if (this.topPaginationControls) {
			this.topPaginationControls.removeListeners();
			this.bottomPaginationControls.removeListeners();
		}
		this.plugin.modalIsOpen = false;
	}
}

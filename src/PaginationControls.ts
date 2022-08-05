import { MAX_DOCS_PER_PAGE } from "./utils/constants";

const PREVIOUS_BUTTON_LABEL = "<";
const NEXT_BUTTON_LABEL = ">";
const PREVIOUS_PAGE = -1;
const NEXT_PAGE = Infinity; // we just need some value that's not a specific page number

export default class PaginationControls {
	public currentPage = 0;
	private numPages = 0;
	private pageButtons: { button: HTMLElement; listener: () => void }[] = [];

	constructor(
		private container: HTMLElement,
		private changePageCallback: (page: number) => void
	) {}

	private findButton(page: number): HTMLElement | undefined {
		return this.pageButtons.find(({ button }) =>
			button.hasAttribute(`data-page-${page}`)
		)?.button;
	}

	public changeCurrentPage(newPage: number) {
		const oldPage = this.currentPage;
		const oldPageButton = this.findButton(oldPage);
		const newPageButton = this.findButton(newPage);
		oldPageButton?.removeClasses(["current-page-button"]);
		newPageButton?.addClasses(["current-page-button"]);
		this.currentPage = newPage;
	}

	private changePage(page: number) {
		const oldPage = this.currentPage;
		let newPage: number = oldPage;
		if (page === PREVIOUS_PAGE) {
			if (this.currentPage > 0) newPage = this.currentPage - 1;
		} else if (page === NEXT_PAGE) {
			if (this.currentPage < this.numPages - 1)
				newPage = this.currentPage + 1;
		} else {
			newPage = page;
		}
		this.changeCurrentPage(newPage);
	}

	private goToPage(page: number) {
		this.changePage(page);
		this.changePageCallback(this.currentPage);
	}

	public removeListeners() {
		this.pageButtons.forEach(({ button, listener }) =>
			button.removeEventListener("click", listener)
		);
	}

	private renderPageNumberButtons() {
		this.pageButtons = [];
		for (let i = 0; i < this.numPages; i++) {
			const isCurrentPage = this.currentPage === i;
			const pageButton = this.container.createEl("button", {
				text: `${i + 1}`,
				attr: {
					[`data-page-${i}`]: "",
					["data-pagination-button"]: "",
				},
				cls: isCurrentPage ? "current-page-button" : "",
			});
			const buttonListener = this.makeListener(i);
			pageButton.addEventListener("click", buttonListener);
			this.container.appendChild(pageButton);
			this.pageButtons.push({
				button: pageButton,
				listener: buttonListener,
			});
		}
	}

	private makeListener(page: number): () => void {
		return () => this.goToPage(page);
	}

	public renderPaginationControls(totalDocs: number) {
		this.numPages = Math.ceil(totalDocs / MAX_DOCS_PER_PAGE);
		this.removeListeners();
		this.container.empty();
		const previousButton = this.container.createEl("button", {
			text: PREVIOUS_BUTTON_LABEL,
			attr: { ["data-pagination-button"]: "" },
		});
		const nextButton = this.container.createEl("button", {
			text: NEXT_BUTTON_LABEL,
			attr: { ["data-pagination-button"]: "" },
		});
		const previousButtonListener = this.makeListener(PREVIOUS_PAGE);
		const nextButtonListener = this.makeListener(NEXT_PAGE);
		previousButton.addEventListener("click", previousButtonListener);
		nextButton.addEventListener("click", nextButtonListener);
		this.pageButtons.push({
			button: previousButton,
			listener: previousButtonListener,
		});
		this.pageButtons.push({
			button: nextButton,
			listener: nextButtonListener,
		});
		this.container.appendChild(previousButton);
		this.renderPageNumberButtons();
		this.container.appendChild(nextButton);
	}
}

import { MAX_DOCS_PER_PAGE } from "./utils/constants";

const PREVIOUS_BUTTON_LABEL = "<";
const NEXT_BUTTON_LABEL = ">";

export default class PaginationControls {
    public currentPage = 0;
    private numPages = 0;
    private listener: EventListener;

    constructor(
        private container: HTMLElement, 
        private changePageCallback: (page: number) => void,
    ) {}

    public changeCurrentPage(newPage: number) {
        const oldPage = this.currentPage;
        this.container.querySelector(`[data-page-${oldPage}]`)?.removeClasses(['current-page-button'])
        this.container.querySelector(`[data-page-${newPage}]`)?.addClasses(['current-page-button'])
        this.currentPage = newPage;
    }

    private changePage(buttonLabel: string) {
        const oldPage = this.currentPage;
        let newPage: number = oldPage;
		if (buttonLabel === PREVIOUS_BUTTON_LABEL) {
			if (this.currentPage > 0 ) newPage = this.currentPage - 1;
		}
		else if (buttonLabel === NEXT_BUTTON_LABEL) {
			if (this.currentPage < this.numPages - 1) newPage = this.currentPage + 1
		}
		else {
			newPage = parseInt(buttonLabel, 10) - 1
		}
        this.changeCurrentPage(newPage)
	}

    private goToPage(e: Event) {
        this.changePage((e.currentTarget as HTMLElement).getText())
        this.changePageCallback(this.currentPage)
	}

    public removeListeners() {
		this.container.querySelectorAll('[data-pagination-button]')
			.forEach(node => node.removeEventListener('click', this.listener))
	}

    private renderPageNumberButtons() {
        for (let i = 0; i < this.numPages; i++) {
			const isCurrentPage = this.currentPage === i;
			const pageButton = this.container.createEl('button', {
				text: `${i + 1}`, 
				attr: {
					[`data-page-${i}`]: '', 
					['data-pagination-button']: '',
				},
				cls: isCurrentPage ? 'current-page-button' : ''})
			pageButton.addEventListener('click', this.listener)
			this.container.appendChild(pageButton)
		}
    }

    public renderPaginationControls(totalDocs: number) {
		this.numPages = Math.ceil(totalDocs / MAX_DOCS_PER_PAGE)
        this.removeListeners()
		this.listener = this.goToPage.bind(this)
        this.container.empty()
		const previoiusButton = this.container.createEl('button', {text: PREVIOUS_BUTTON_LABEL, attr: {['data-pagination-button']: ''}})
		const nextButton = this.container.createEl('button', {text: NEXT_BUTTON_LABEL, attr: {['data-pagination-button']: ''}})
		previoiusButton.addEventListener('click', this.listener)
		nextButton.addEventListener('click', this.listener)
		this.container.appendChild(previoiusButton)
		this.renderPageNumberButtons()
		this.container.appendChild(nextButton)
	}
}

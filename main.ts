import { App, Modal, Plugin, TFile, getAllTags, CachedMetadata, MarkdownRenderer } from 'obsidian';
import { Tag } from './tag'
import { createLink } from './utils/links'

type FileInfo = {
	file: TFile, 
	text: string
}

export default class TaggedDocumentsViewer extends Plugin {
	async onload() {
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			this.handleClick(evt.target as HTMLElement);
		});

		this.addRibbonIcon('hashtag', 'Tagged Documents Viewer', (evt: MouseEvent) => {
			new TaggedDocumentsModal(this.app, '').open()
		});
	}

	onunload() {}

	private async handleClick(target: HTMLElement) {
		if (!Tag.isTagNode(target)) return
		const tag = target.innerText
		new TaggedDocumentsModal(this.app, tag).open()
	}
}

class TaggedDocumentsModal extends Modal {
	contents: FileInfo[] = []
	tag: string = ''
	button: HTMLElement
	input: HTMLElement
	buttonListener: number
	querying = false

	constructor(app: App, tag: string) {
		super(app)
		this.tag = tag
		this.contents = []
	}

	getTaglists() : [string[], string[]] {
		const tags = this.tag.split(' ')
		const include = tags.filter(tag => tag.charAt(0) !== '!')
		const exclude = tags.filter(tag => tag.charAt(0) === '!').map(tag => tag.substring(1))

		return [include, exclude]
	}

	getFilesFromTag(tags: string[]): TFile[] {
		return tags.reduce((accumulator, tag) => {
			return  [...accumulator, ...Array.from(getAllFilesMatchingTag(this.app, tag) || [])]
		}, [])
	}

	getFiles() : TFile[] {
		const [tagsToInclude, tagsToExclude] = this.getTaglists()
		const startingFiles: TFile[] = this.getFilesFromTag(tagsToInclude)
		const filesToExclude: string[] = this.getFilesFromTag(tagsToExclude).map(file => file.path)
		return startingFiles.filter(file => !filesToExclude.includes(file.path))
	}

	async getPages(): Promise<FileInfo[]> {
		const files: TFile[] = this.getFiles()
		const numFiles = files.length
		const contents: FileInfo[] = []
		for (let i = 0; i < numFiles; i++) {
			const file = files[i]
			contents.push({file, text: await this.app.vault.cachedRead(file)})
		}
		return contents
	}

	async getListContents() {
		const contents: FileInfo[] = await this.getPages()
		const ul = document.createElement('ul')
		contents.forEach(async ({file, text}) => {
			const li = ul.createEl('li')
			const title = document.createElement('h3')
			const link = createLink(this.app, file, () => this.close())
			const content = document.createElement('div')
			// @ts-ignore
			await MarkdownRenderer.renderMarkdown(text, content, file.path)
			li.appendChild(title)
			title.appendChild(link)
			li.appendChild(content)
		})

		return ul
	}

	async makeListItems() {
		const list = document.querySelector('[data-tageed-documents-viewer-list]') as HTMLElement
		list.innerHTML = ''
		this.querying = true
		list.appendChild(await this.getListContents())
		this.querying = false
	}

	async tagQuerySubmitLister() {
		if (this.querying) return
		const inputEl = document.querySelector('[data-tag-names]') as HTMLInputElement
		this.tag = inputEl.value
		await this.makeListItems()
	}

	tagQueryKeyListener(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			this.tagQuerySubmitLister()
		}
	}

	renderContainer() {
		const container = document.createElement('div')
		container.addClass('tagged-documents-viewer-container')

		return container
	}

	renderInput() {
		const input = document.createElement('input')
		this.input = input
		input.value = this.tag
		input.setAttribute('data-tag-names', '')
		input.addEventListener('keypress', this.tagQueryKeyListener.bind(this))

		return input
	}

	renderButton() {
		const button = document.createElement('button')
		this.button = button
		button.innerText = 'OK'
		button.addEventListener('click', this.tagQuerySubmitLister.bind(this))
		
		return button
	}

	renderForm() {
		const form = document.createElement('div')
		form.addClass('tagged-documents-viewer-form')
		const input = this.renderInput()
		const button = this.renderButton()
		form.appendChild(input)
		form.appendChild(button)

		return form
	}

	async renderList() {
		const list = document.createElement('div')
		list.setAttribute('data-tageed-documents-viewer-list', '')
		list.addClass('tagged-documents-viewer-list-container')
		const listContents = await this.getListContents()
		list.appendChild(listContents)
		return list
	}

	async renderLayout() {
		const {contentEl} = this;
		contentEl.empty()
		const container = this.renderContainer()
		const form = this.renderForm()
		const list = await this.renderList()
		container.appendChild(form)
		container.appendChild(list)
		contentEl.appendChild(container)

		return list
	}

	async onOpen() {
		const list = await this.renderLayout()
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
		this.button.removeEventListener('click', this.tagQuerySubmitLister)
		this.input.removeEventListener('keydown', this.tagQueryKeyListener)
	}
}

function hasTag(tags: string[], value: string): boolean {
	if (!tags.length || !Array.isArray(tags)) return false;
	return tags.some((v) => v.toLocaleLowerCase() === value.toLocaleLowerCase());
}

/**
 * Returns a Set of files that contain a given tag
 * 
 * adapted from https://github.com/Aidurber/tag-page-preview/blob/master/src/utils/find-tags.ts
 * 
 * @param app - Obsidian app object
 * @param tag - Tag to find
 * @returns
 */
 function getAllFilesMatchingTag(app: App, tag: string): Set<TFile> {
	const files = app.vault.getMarkdownFiles();
	const result: Set<TFile> = new Set();
	for (let file of files) {
	  const tags = getAllTags(app.metadataCache.getCache(file.path) as CachedMetadata) || [];
	  if (hasTag(tags, `#${tag}`)) {
		result.add(file);
	  }
	}
  
	return result;
  }



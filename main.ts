import { MarkdownView, Plugin, WorkspaceLeaf } from 'obsidian';

interface ContentViewSettings {
	contentVisible: boolean;
}

const DEFAULT_SETTINGS: ContentViewSettings = {
	contentVisible: true
}

export default class ContentViewPlugin extends Plugin {
	settings: ContentViewSettings;
	private statusBarItem: HTMLElement;

	async onload() {
		await this.loadSettings();

		// Add status bar item
		this.statusBarItem = this.addStatusBarItem();
		this.updateStatusBar();

		// Register the view action button
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				this.addViewActionButtons();
			})
		);

		// Add command to toggle content visibility
		this.addCommand({
			id: 'toggle-content-visibility',
			name: 'Toggle content visibility',
			callback: () => {
				this.toggleContentVisibility();
			}
		});

		// Initial setup
		this.addViewActionButtons();
		this.applyContentVisibility();
	}

	onunload() {
		// Remove all view action buttons
		document.querySelectorAll('.content-visible-toggle-button').forEach(el => el.remove());
		// Remove the CSS class
		document.body.removeClass('content-visible-hidden');
	}

	addViewActionButtons() {
		// Remove existing buttons first
		document.querySelectorAll('.content-visible-toggle-button').forEach(el => el.remove());

		// Get all leaf view headers
		const leaves = this.app.workspace.getLeavesOfType('markdown');
		leaves.forEach((leaf: WorkspaceLeaf) => {
			this.addButtonToLeaf(leaf);
		});
	}

	addButtonToLeaf(leaf: WorkspaceLeaf) {
		const view = leaf.view;
		if (!(view instanceof MarkdownView)) return;

		// Find the view actions container in the header
		const viewHeader = (leaf as WorkspaceLeaf & { containerEl?: HTMLElement }).containerEl?.querySelector('.view-header');
		const viewActions = viewHeader?.querySelector('.view-actions');

		if (!viewActions) return;

		// Check if button already exists
		if (viewActions.querySelector('.content-visible-toggle-button')) return;

		// Create the toggle button
		const button = viewActions.createDiv({
			cls: 'clickable-icon view-action content-visible-toggle-button',
			attr: {
				'aria-label': this.settings.contentVisible ? 'Hide content' : 'Show content'
			}
		});

		// Add icon
		this.updateButtonIcon(button);

		// Add click handler
		button.addEventListener('click', (e: MouseEvent) => {
			e.preventDefault();
			this.toggleContentVisibility();
		});

		// Insert button before other view actions
		const firstAction = viewActions.querySelector('.view-action');
		if (firstAction) {
			viewActions.insertBefore(button, firstAction);
		} else {
			viewActions.appendChild(button);
		}
	}

	updateButtonIcon(button: HTMLElement) {
		button.empty();
		const iconName = this.settings.contentVisible ? 'eye' : 'eye-off';
		button.innerHTML = this.getIconSvg(iconName);
	}

	getIconSvg(iconName: string): string {
		if (iconName === 'eye') {
			return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
		} else {
			return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
		}
	}

	toggleContentVisibility() {
		this.settings.contentVisible = !this.settings.contentVisible;
		this.saveSettings();
		this.applyContentVisibility();
		this.updateAllButtons();
		this.updateStatusBar();
	}

	applyContentVisibility() {
		if (this.settings.contentVisible) {
			document.body.removeClass('content-visible-hidden');
		} else {
			document.body.addClass('content-visible-hidden');
		}
	}

	updateAllButtons() {
		document.querySelectorAll('.content-visible-toggle-button').forEach((button) => {
			this.updateButtonIcon(button as HTMLElement);
			button.setAttribute('aria-label', this.settings.contentVisible ? 'Hide content' : 'Show content');
		});
	}

	updateStatusBar() {
		this.statusBarItem.setText(this.settings.contentVisible ? '👁️ Visible' : '🚫 Hidden');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

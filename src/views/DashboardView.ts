import { ItemView, WorkspaceLeaf, TFile } from 'obsidian'
import type PMPlugin from '../main'
import { renderProjectListToolbar, renderProjectListContent } from './ProjectListRenderer'
import type { ProjectListContext, ProjectListViewMode } from './ProjectListRenderer'
import { t } from '../i18n'

export const PM_DASHBOARD_VIEW_TYPE = 'pm-dashboard'

interface DashboardViewState {
  viewMode?: ProjectListViewMode
  [key: string]: unknown
}

export class DashboardView extends ItemView {
  private plugin: PMPlugin
  private toolbarEl!: HTMLElement
  private bodyEl!: HTMLElement
  private renderToken = 0
  private reloadDebounceTimer: number | null = null
  private viewMode: ProjectListViewMode = 'board'

  constructor(leaf: WorkspaceLeaf, plugin: PMPlugin) {
    super(leaf)
    this.plugin = plugin
    this.navigation = false
  }

  getViewType(): string {
    return PM_DASHBOARD_VIEW_TYPE
  }
  getDisplayText(): string {
    return t('Projects')
  }
  getIcon(): string {
    return 'chart-gantt'
  }

  async setState(state: DashboardViewState, result: unknown): Promise<void> {
    this.viewMode = state.viewMode === 'list' ? 'list' : 'board'
    await super.setState(state, result as import('obsidian').ViewStateResult)
    if (this.bodyEl) this.render()
  }

  getState(): DashboardViewState {
    return { viewMode: this.viewMode }
  }

  onOpen(): Promise<void> {
    this.containerEl.addClass('pm-view')
    const root = this.contentEl
    root.empty()
    root.addClass('pm-root')
    this.toolbarEl = root.createDiv('pm-toolbar')
    this.bodyEl = root.createDiv('pm-content')
    this.render()
    this.registerVaultListeners()
    return Promise.resolve()
  }

  onClose(): Promise<void> {
    if (this.reloadDebounceTimer !== null) {
      window.clearTimeout(this.reloadDebounceTimer)
      this.reloadDebounceTimer = null
    }
    return Promise.resolve()
  }

  private registerVaultListeners(): void {
    const isRelevant = (path: string) => {
      const folder = this.plugin.settings.projectsFolder
      return path === folder || path.startsWith(`${folder}/`)
    }
    const scheduleRender = (path: string) => {
      if (!isRelevant(path)) return
      if (this.reloadDebounceTimer !== null) window.clearTimeout(this.reloadDebounceTimer)
      this.reloadDebounceTimer = window.setTimeout(() => {
        this.reloadDebounceTimer = null
        this.render()
      }, 300)
    }
    // The store reports changes within a project; only the vault reports projects
    // appearing and disappearing, which is what changes this list.
    this.register(this.plugin.store.onProjectChanged(scheduleRender))
    this.registerEvent(this.app.vault.on('create', (file) => scheduleRender(file.path)))
    this.registerEvent(this.app.vault.on('delete', (file) => scheduleRender(file.path)))
    this.registerEvent(
      this.app.vault.on('rename', (file, oldPath) => {
        scheduleRender(file.path)
        scheduleRender(oldPath)
      })
    )
  }

  render(): void {
    const ctx = this.makeCtx()
    renderProjectListToolbar(ctx)
    this.bodyEl.empty()
    this.bodyEl.addClass('pm-project-list-container')
    void renderProjectListContent(ctx)
  }

  private makeCtx(): ProjectListContext {
    const token = ++this.renderToken
    return {
      plugin: this.plugin,
      toolbarEl: this.toolbarEl,
      contentEl: this.bodyEl,
      viewMode: this.viewMode,
      onViewModeChange: (mode) => {
        this.viewMode = mode
        this.render()
      },
      isStale: () => token !== this.renderToken,
      openProjectFile: (file: TFile) => this.plugin.router.openProject(file)
    }
  }
}

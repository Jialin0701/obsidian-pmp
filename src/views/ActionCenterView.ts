import { ButtonComponent, ExtraButtonComponent, ItemView, MarkdownRenderChild, TFile, WorkspaceLeaf } from 'obsidian'
import type PMPlugin from '../main'
import { t } from '../i18n'
import { parsePlainDate } from '../dates'
import { openTaskModal } from '../ui/ModalFactory'
import { renderActionCenter, renderActionCenterBlock } from './ActionCenter'
import type { ActionCenterMode, ActionItem } from './ActionCenter'
import { PM_ACTION_CENTER_VIEW_TYPE } from './ActionCenterViewType'

export { PM_ACTION_CENTER_VIEW_TYPE }

interface ActionCenterViewState {
  mode?: ActionCenterMode
  [key: string]: unknown
}

interface FocusBlockConfig {
  referenceDate?: string
  horizonDays?: number
  mode?: ActionCenterMode
}

function parseFocusConfig(source: string, sourcePath: string): FocusBlockConfig {
  const config: FocusBlockConfig = {}
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*(date|days|view)\s*:\s*(.+?)\s*$/i)
    if (!match) continue
    const [, key, raw] = match
    if (key.toLowerCase() === 'date') {
      const value = raw.replace(/^['"]|['"]$/g, '')
      if (value.toLowerCase() === 'today') config.referenceDate = undefined
      else if (parsePlainDate(value)) config.referenceDate = value
      else if (value.toLowerCase() === 'note') config.referenceDate = sourceDate(sourcePath)
    } else if (key.toLowerCase() === 'days') {
      const days = Number(raw)
      if (Number.isFinite(days)) config.horizonDays = Math.max(0, Math.min(31, Math.round(days)))
    } else if (key.toLowerCase() === 'view') {
      config.mode = raw.trim().toLowerCase() === 'board' ? 'board' : 'list'
    }
  }
  return config
}

function sourceDate(sourcePath: string): string | undefined {
  const filename = sourcePath.split('/').pop()?.replace(/\.md$/i, '') ?? ''
  return parsePlainDate(filename)?.toString()
}

export class ActionCenterView extends ItemView {
  private plugin: PMPlugin
  private mode: ActionCenterMode = 'list'
  private toolbarEl!: HTMLElement
  private bodyEl!: HTMLElement
  private renderToken = 0
  private reloadDebounceTimer: number | null = null
  private query = ''

  constructor(leaf: WorkspaceLeaf, plugin: PMPlugin) {
    super(leaf)
    this.plugin = plugin
    this.navigation = false
  }

  getViewType(): string {
    return PM_ACTION_CENTER_VIEW_TYPE
  }

  getDisplayText(): string {
    return t('Action center')
  }

  getIcon(): string {
    return 'list-todo'
  }

  async setState(state: ActionCenterViewState, result: unknown): Promise<void> {
    this.mode = state.mode === 'board' ? 'board' : 'list'
    await super.setState(state, result as import('obsidian').ViewStateResult)
    if (this.bodyEl) this.render()
  }

  getState(): ActionCenterViewState {
    return { mode: this.mode }
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
    if (this.reloadDebounceTimer !== null) window.clearTimeout(this.reloadDebounceTimer)
    this.reloadDebounceTimer = null
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
    this.register(this.plugin.store.onProjectChanged(scheduleRender))
    this.registerEvent(this.app.vault.on('create', (file) => scheduleRender(file.path)))
    this.registerEvent(this.app.vault.on('delete', (file) => scheduleRender(file.path)))
    this.registerEvent(this.app.vault.on('modify', (file) => scheduleRender(file.path)))
    this.registerEvent(
      this.app.vault.on('rename', (file, oldPath) => {
        scheduleRender(file.path)
        scheduleRender(oldPath)
      })
    )
  }

  render(): void {
    const token = ++this.renderToken
    this.renderToolbar()
    this.bodyEl.empty()
    const loading = this.bodyEl.createDiv('pm-action-loading')
    loading.setText(t('Loading…'))
    void this.loadAndRender(token)
  }

  private async loadAndRender(token: number): Promise<void> {
    const projects = await this.plugin.store.loadAllProjects(this.plugin.settings.projectsFolder)
    if (token !== this.renderToken) return
    this.bodyEl.empty()
    renderActionCenter(this.bodyEl, this.plugin, projects, {
      mode: this.mode,
      query: this.query,
      onQueryChange: (query) => {
        this.query = query
      },
      onModeChange: (mode) => {
        this.mode = mode
        this.render()
      },
      onOpenTask: (item) => this.openTask(item),
      onEditTask: (item) => this.editTask(item),
      onRefresh: () => this.render()
    })
  }

  private renderToolbar(): void {
    this.toolbarEl.empty()
    const left = this.toolbarEl.createDiv('pm-toolbar-left')
    left.createEl('h2', { text: t('Action center'), cls: 'pm-toolbar-title' })
    left.createSpan({ text: t('See what needs attention across all projects.'), cls: 'pm-action-toolbar-subtitle' })
    const right = this.toolbarEl.createDiv('pm-toolbar-right')
    const switcher = right.createDiv('pm-view-switcher')
    for (const option of [
      { id: 'list' as const, icon: 'list', label: t('List') },
      { id: 'board' as const, icon: 'layout-dashboard', label: t('Board') }
    ]) {
      const button = new ExtraButtonComponent(switcher).setIcon(option.icon).setTooltip(option.label)
      button.extraSettingsEl.addClass('pm-view-btn')
      button.extraSettingsEl.setAttr('aria-label', option.label)
      button.extraSettingsEl.setAttr('aria-pressed', String(this.mode === option.id))
      if (this.mode === option.id) button.extraSettingsEl.addClass('pm-view-btn--active')
      button.onClick(() => {
        if (this.mode === option.id) return
        this.mode = option.id
        this.render()
      })
    }
    new ButtonComponent(right)
      .setButtonText(t('Open projects pane'))
      .onClick(() => void this.plugin.router.openDashboard())
  }

  private openTask(item: ActionItem): void {
    const file = this.app.vault.getAbstractFileByPath(item.project.filePath)
    if (file instanceof TFile) void this.plugin.router.openProject(file)
  }

  private editTask(item: ActionItem): void {
    openTaskModal(this.plugin, item.project, {
      task: item.task,
      onSave: async () => this.render()
    })
  }
}

export class ActionCenterBlock extends MarkdownRenderChild {
  private readonly plugin: PMPlugin
  private readonly config: FocusBlockConfig
  private reloadTimer: number | null = null
  private renderToken = 0

  constructor(containerEl: HTMLElement, plugin: PMPlugin, source: string, sourcePath: string) {
    super(containerEl)
    this.plugin = plugin
    this.config = parseFocusConfig(source, sourcePath)
  }

  onload(): void {
    this.containerEl.addClass('pm-action-block')
    this.render()
    this.register(this.plugin.store.onProjectChanged(() => this.scheduleRender()))
    const isRelevant = (path: string) => {
      const folder = this.plugin.settings.projectsFolder
      return path === folder || path.startsWith(`${folder}/`)
    }
    this.registerEvent(
      this.plugin.app.vault.on('create', (file) => {
        if (isRelevant(file.path)) this.scheduleRender()
      })
    )
    this.registerEvent(
      this.plugin.app.vault.on('delete', (file) => {
        if (isRelevant(file.path)) this.scheduleRender()
      })
    )
    this.registerEvent(
      this.plugin.app.vault.on('modify', (file) => {
        if (isRelevant(file.path)) this.scheduleRender()
      })
    )
    this.registerEvent(
      this.plugin.app.vault.on('rename', (file, oldPath) => {
        if (isRelevant(file.path) || isRelevant(oldPath)) this.scheduleRender()
      })
    )
  }

  onunload(): void {
    if (this.reloadTimer !== null) window.clearTimeout(this.reloadTimer)
    this.reloadTimer = null
  }

  private scheduleRender(): void {
    if (this.reloadTimer !== null) window.clearTimeout(this.reloadTimer)
    this.reloadTimer = window.setTimeout(() => {
      this.reloadTimer = null
      this.render()
    }, 300)
  }

  private render(): void {
    const token = ++this.renderToken
    this.containerEl.empty()
    const loading = this.containerEl.createDiv('pm-action-loading')
    loading.setText(t('Loading…'))
    void this.loadAndRender(token)
  }

  private async loadAndRender(token: number): Promise<void> {
    const projects = await this.plugin.store.loadAllProjects(this.plugin.settings.projectsFolder)
    if (token !== this.renderToken || !this.containerEl.isConnected) return
    this.containerEl.empty()
    renderActionCenterBlock(this.containerEl, this.plugin, projects, {
      ...this.config,
      onOpenTask: (item) => this.openTask(item),
      onEditTask: (item) => this.editTask(item),
      onRefresh: () => this.scheduleRender()
    })
  }

  private openTask(item: ActionItem): void {
    const file = this.plugin.app.vault.getAbstractFileByPath(item.project.filePath)
    if (file instanceof TFile) void this.plugin.router.openProject(file)
  }

  private editTask(item: ActionItem): void {
    openTaskModal(this.plugin, item.project, {
      task: item.task,
      onSave: async () => this.scheduleRender()
    })
  }
}

export function registerActionCenterCodeBlock(plugin: PMPlugin): void {
  plugin.registerMarkdownCodeBlockProcessor('pm-focus', (source, el, ctx) => {
    ctx.addChild(new ActionCenterBlock(el, plugin, source, ctx.sourcePath))
  })
}

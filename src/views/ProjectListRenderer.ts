import { TFile, Menu, ButtonComponent } from 'obsidian'
import type PMPlugin from '../main'
import type { Project, Task, StatusConfig } from '../types'
import { safeAsync, isTerminalStatus } from '../utils'
import { openProjectModal } from '../ui/ModalFactory'
import { EmptyState } from '../ui/primitives/EmptyState'
import { ProjectCard } from '../ui/composites/ProjectCard'
import { ProjectListRow } from '../ui/composites/ProjectListRow'
import { ViewSwitcher } from '../ui/primitives/ViewSwitcher'
import { t } from '../i18n'

export type ProjectListViewMode = 'board' | 'list'

export interface ProjectListContext {
  plugin: PMPlugin
  toolbarEl: HTMLElement
  contentEl: HTMLElement
  viewMode: ProjectListViewMode
  onViewModeChange: (mode: ProjectListViewMode) => void
  isStale: () => boolean
  openProjectFile: (file: TFile) => Promise<void>
}

export function renderProjectListToolbar(ctx: ProjectListContext): void {
  ctx.toolbarEl.empty()
  const left = ctx.toolbarEl.createDiv('pm-toolbar-left')
  left.createEl('h2', { text: t('Project manager'), cls: 'pm-toolbar-title' })

  const right = ctx.toolbarEl.createDiv('pm-toolbar-right')
  new ViewSwitcher<ProjectListViewMode>(right, {
    options: [
      { id: 'board', icon: 'layout-dashboard', label: t('Cards') },
      { id: 'list', icon: 'list', label: t('List') }
    ],
    active: ctx.viewMode,
    onChange: ctx.onViewModeChange
  })

  new ButtonComponent(right)
    .setButtonText(t('+ new project'))
    .setCta()
    .onClick(() => openCreateProjectModal(ctx))
}

export async function renderProjectListContent(ctx: ProjectListContext): Promise<void> {
  const projects = await ctx.plugin.store.loadAllProjects(ctx.plugin.settings.projectsFolder)
  if (ctx.isStale()) return
  ctx.contentEl.empty()

  if (projects.length === 0) {
    new EmptyState(ctx.contentEl)
      .setIcon('📋')
      .setTitle(t('No projects yet'))
      .setBody(t('Create your first project to get started.'))
      .setAction(t('+ new project'), () => openCreateProjectModal(ctx))
    return
  }

  const collection = ctx.contentEl.createDiv(ctx.viewMode === 'list' ? 'pm-project-list' : 'pm-project-grid')
  collection.setAttr('role', 'list')
  for (const project of projects) {
    const statuses = ctx.plugin.store.configFor(project).statuses
    const total = countTasks(project.tasks, false, statuses)
    const done = countTasks(project.tasks, true, statuses)
    const props = {
      title: project.title,
      description: project.description,
      icon: project.icon,
      color: project.color,
      tasksDone: done,
      tasksTotal: total,
      onClick: safeAsync(async () => {
        const file = ctx.plugin.app.vault.getAbstractFileByPath(project.filePath)
        if (file instanceof TFile) await ctx.openProjectFile(file)
      }),
      onContextMenu: (e: MouseEvent) => openProjectContextMenu(ctx, project, e)
    }
    if (ctx.viewMode === 'list') new ProjectListRow(collection, props)
    else new ProjectCard(collection, props)
  }
}

function openCreateProjectModal(ctx: ProjectListContext): void {
  openProjectModal(ctx.plugin, {
    onSave: async (project) => {
      const file = ctx.plugin.app.vault.getAbstractFileByPath(project.filePath)
      if (file instanceof TFile) await ctx.openProjectFile(file)
    }
  })
}

function openProjectContextMenu(ctx: ProjectListContext, project: Project, e: MouseEvent): void {
  const menu = new Menu()
  menu.addItem((item) =>
    item
      .setTitle(t('Edit project'))
      .setIcon('settings')
      .onClick(() => {
        openProjectModal(ctx.plugin, {
          project,
          onSave: async () => {
            await renderProjectListContent(ctx)
          }
        })
      })
  )
  menu.addItem((item) =>
    item
      .setTitle(t('Delete project'))
      .setIcon('trash')
      .onClick(
        safeAsync(async () => {
          await ctx.plugin.store.deleteProject(project)
          await renderProjectListContent(ctx)
        })
      )
  )
  menu.showAtMouseEvent(e)
}

function countTasks(tasks: Task[], doneOnly: boolean, statuses: StatusConfig[]): number {
  let n = 0
  for (const t of tasks) {
    if (!doneOnly || isTerminalStatus(t.status, statuses)) n++
    n += countTasks(t.subtasks, doneOnly, statuses)
  }
  return n
}

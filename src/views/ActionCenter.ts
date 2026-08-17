import { ExtraButtonComponent, setIcon } from 'obsidian'
import type PMPlugin from '../main'
import { DEFAULT_PRIORITIES, DEFAULT_STATUSES } from '../types'
import type { PriorityConfig, Project, StatusConfig, Task } from '../types'
import { flattenTasks } from '../store/TaskTreeOps'
import { formatDate, parsePlainDate, Temporal } from '../dates'
import { isTerminalStatus, safeAsync, setProjectIcon } from '../utils'
import { renderPriorityBadge, renderStatusBadge } from '../ui/StatusBadge'
import { t } from '../i18n'

export type ActionCenterBucket = 'overdue' | 'today' | 'upcoming' | 'blocked' | 'active' | 'unscheduled' | 'later'
export type ActionCenterMode = 'list' | 'board'

export interface ActionItem {
  task: Task
  project: Project
  statuses: StatusConfig[]
  priorities: PriorityConfig[]
  bucket: ActionCenterBucket
  blockedBy: string[]
  daysUntilDue: number | null
}

export interface ActionCenterRenderOptions {
  referenceDate?: string
  horizonDays?: number
  mode?: ActionCenterMode
  showToolbar?: boolean
  compact?: boolean
  query?: string
  onQueryChange?: (query: string) => void
  onModeChange?: (mode: ActionCenterMode) => void
  onOpenTask?: (item: ActionItem) => void
  onEditTask?: (item: ActionItem) => void
  onRefresh?: () => void
}

const BUCKET_ORDER: ActionCenterBucket[] = ['overdue', 'today', 'blocked', 'upcoming', 'active', 'unscheduled', 'later']

export const ACTION_CENTER_BUCKET_LABELS: Record<ActionCenterBucket, string> = {
  overdue: 'Overdue',
  today: 'Due today',
  upcoming: 'Next 7 days',
  blocked: 'Blocked',
  active: 'In progress',
  unscheduled: 'No due date',
  later: 'Later'
}

function dependencyBlockers(project: Project, task: Task, statuses: StatusConfig[]): string[] {
  return task.dependencies.filter((id) => {
    const dependency = project.taskIndex.get(id)?.task
    return !dependency || !isTerminalStatus(dependency.status, statuses)
  })
}

function daysUntil(due: string, reference: Temporal.PlainDate): number | null {
  const parsed = parsePlainDate(due)
  return parsed ? reference.until(parsed, { largestUnit: 'day' }).days : null
}

export function classifyActionItem(
  project: Project,
  task: Task,
  statuses: StatusConfig[],
  reference: Temporal.PlainDate,
  horizonDays: number
): Pick<ActionItem, 'bucket' | 'blockedBy' | 'daysUntilDue'> | null {
  if (task.archived || isTerminalStatus(task.status, statuses)) return null

  const blockedBy = dependencyBlockers(project, task, statuses)
  const dueDays = daysUntil(task.due, reference)

  if (dueDays !== null && dueDays < 0) return { bucket: 'overdue', blockedBy, daysUntilDue: dueDays }
  if (dueDays === 0) return { bucket: 'today', blockedBy, daysUntilDue: dueDays }
  if (blockedBy.length) return { bucket: 'blocked', blockedBy, daysUntilDue: dueDays }
  if (dueDays !== null && dueDays <= horizonDays) return { bucket: 'upcoming', blockedBy, daysUntilDue: dueDays }

  const start = parsePlainDate(task.start)
  if (start && Temporal.PlainDate.compare(start, reference) <= 0) {
    return { bucket: 'active', blockedBy, daysUntilDue: dueDays }
  }
  return { bucket: dueDays === null ? 'unscheduled' : 'later', blockedBy, daysUntilDue: dueDays }
}

export function collectActionItems(
  projects: Project[],
  options: { referenceDate?: string; horizonDays?: number } = {},
  getConfig?: (project: Project) => { statuses: StatusConfig[]; priorities: PriorityConfig[] }
): ActionItem[] {
  const reference = parsePlainDate(options.referenceDate ?? '') ?? Temporal.Now.plainDateISO()
  const horizonDays = options.horizonDays ?? 7
  const items: ActionItem[] = []

  for (const project of projects) {
    const resolved = getConfig?.(project)
    const statuses = resolved?.statuses ?? DEFAULT_STATUSES
    const priorities = resolved?.priorities ?? DEFAULT_PRIORITIES
    for (const { task } of flattenTasks(project.tasks)) {
      const classified = classifyActionItem(project, task, statuses, reference, horizonDays)
      if (!classified) continue
      items.push({ task, project, statuses, priorities, ...classified })
    }
  }

  return items.sort((a, b) => compareActionItems(a, b, reference))
}

function compareActionItems(a: ActionItem, b: ActionItem, _reference: Temporal.PlainDate): number {
  const bucketDelta = BUCKET_ORDER.indexOf(a.bucket) - BUCKET_ORDER.indexOf(b.bucket)
  if (bucketDelta) return bucketDelta
  const aDue = a.daysUntilDue ?? Number.MAX_SAFE_INTEGER
  const bDue = b.daysUntilDue ?? Number.MAX_SAFE_INTEGER
  if (aDue !== bDue) return aDue - bDue
  const updatedDelta = b.task.updatedAt.localeCompare(a.task.updatedAt)
  if (updatedDelta) return updatedDelta
  return a.task.title.localeCompare(b.task.title, undefined, { sensitivity: 'base' })
}

function bucketLabel(bucket: ActionCenterBucket, horizonDays = 7): string {
  if (bucket === 'upcoming') return t(`Next ${horizonDays} days`)
  return t(ACTION_CENTER_BUCKET_LABELS[bucket])
}

function dueLabel(item: ActionItem): string {
  if (item.daysUntilDue !== null && item.daysUntilDue < 0) return t(`${-item.daysUntilDue}d overdue`)
  if (item.daysUntilDue === 0) return t('Today')
  if (item.daysUntilDue === 1) return t('Tomorrow')
  if (item.daysUntilDue !== null && item.daysUntilDue <= 6) return t(`In ${item.daysUntilDue}d`)
  return item.task.due ? formatDate(item.task.due) : t('No due date')
}

function matchesQuery(item: ActionItem, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [item.task.title, item.project.title, item.task.status, item.task.priority, ...item.task.assignees]
    .join(' ')
    .toLowerCase()
    .includes(q)
}

function renderProjectBadge(parent: HTMLElement, project: Project): void {
  const badge = parent.createSpan({ cls: 'pm-action-project' })
  const icon = badge.createSpan({ cls: 'pm-action-project-icon' })
  setProjectIcon(icon, project.icon)
  badge.createSpan({ text: project.title, cls: 'pm-action-project-name' })
}

function renderActionTask(
  parent: HTMLElement,
  item: ActionItem,
  plugin: PMPlugin,
  opts: ActionCenterRenderOptions
): void {
  const row = parent.createDiv('pm-action-task')
  row.setAttr('role', 'listitem')
  row.dataset.taskId = item.task.id
  row.dataset.projectPath = item.project.filePath

  const main = row.createDiv('pm-action-task-main')
  const titleButton = main.createEl('button', { cls: 'pm-action-task-title', text: item.task.title })
  titleButton.setAttr('aria-label', `${t('Open task')}: ${item.task.title}`)
  titleButton.addEventListener('click', (event) => {
    event.stopPropagation()
    opts.onOpenTask?.(item)
  })
  renderProjectBadge(main, item.project)

  const details = row.createDiv('pm-action-task-details')
  const statusWrap = details.createDiv('pm-action-task-status')
  statusWrap.addEventListener('click', (event) => event.stopPropagation())
  renderStatusBadge(
    statusWrap,
    item.task,
    item.statuses,
    safeAsync(async (status) => {
      await plugin.store.updateTask(item.project, item.task.id, { status })
      opts.onRefresh?.()
    })
  )
  const priorityWrap = details.createDiv('pm-action-task-priority')
  priorityWrap.addEventListener('click', (event) => event.stopPropagation())
  renderPriorityBadge(
    priorityWrap,
    item.task,
    item.priorities,
    safeAsync(async (priority) => {
      await plugin.store.updateTask(item.project, item.task.id, { priority })
      opts.onRefresh?.()
    })
  )

  const due = details.createSpan({ cls: `pm-action-task-due pm-due--${item.bucket}` })
  setIcon(
    due.createSpan({ cls: 'pm-action-task-due-icon' }),
    item.bucket === 'overdue' ? 'alert-circle' : 'calendar-days'
  )
  due.createSpan({ text: dueLabel(item) })
  if (item.blockedBy.length) {
    const blocked = details.createSpan({ cls: 'pm-action-task-blocked' })
    setIcon(blocked.createSpan(), 'lock-keyhole')
    blocked.createSpan({ text: t('Blocked') })
  }

  if (item.task.assignees.length) {
    const assignees = details.createSpan({ cls: 'pm-action-task-assignees', text: item.task.assignees.join(', ') })
    assignees.setAttr('title', item.task.assignees.join(', '))
  }

  const edit = new ExtraButtonComponent(row).setIcon('pencil').setTooltip(t('Edit task'))
  edit.extraSettingsEl.addClass('pm-action-task-edit')
  edit.extraSettingsEl.addEventListener('click', (event) => event.stopPropagation())
  edit.onClick(() => opts.onEditTask?.(item))
  row.addEventListener('click', () => opts.onOpenTask?.(item))
  row.addEventListener('keydown', (event) => {
    if (event.target !== row) return
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    opts.onOpenTask?.(item)
  })
  row.setAttr('tabindex', '0')
}

function renderEmpty(parent: HTMLElement): void {
  const empty = parent.createDiv('pm-action-empty')
  setIcon(empty.createSpan({ cls: 'pm-action-empty-icon' }), 'check-circle-2')
  empty.createEl('h3', { text: t('No active tasks') })
  empty.createEl('p', { text: t('Everything is up to date.') })
}

function renderActionList(
  parent: HTMLElement,
  items: ActionItem[],
  plugin: PMPlugin,
  opts: ActionCenterRenderOptions,
  horizonDays: number
): void {
  const grouped = new Map<ActionCenterBucket, ActionItem[]>()
  for (const item of items) {
    const list = grouped.get(item.bucket) ?? []
    list.push(item)
    grouped.set(item.bucket, list)
  }
  for (const bucket of BUCKET_ORDER) {
    const bucketItems = grouped.get(bucket)
    if (!bucketItems?.length) continue
    const section = parent.createDiv(`pm-action-section pm-action-section--${bucket}`)
    const heading = section.createDiv('pm-action-section-heading')
    const title = heading.createDiv('pm-action-section-title')
    setIcon(
      title.createSpan({ cls: 'pm-action-section-icon' }),
      bucket === 'overdue' ? 'alert-triangle' : 'chevron-right'
    )
    title.createEl('h3', { text: bucketLabel(bucket, horizonDays) })
    heading.createSpan({ text: String(bucketItems.length), cls: 'pm-action-section-count' })
    const list = section.createDiv('pm-action-task-list')
    list.setAttr('role', 'list')
    for (const item of bucketItems) renderActionTask(list, item, plugin, opts)
  }
}

function renderActionBoard(
  parent: HTMLElement,
  items: ActionItem[],
  plugin: PMPlugin,
  opts: ActionCenterRenderOptions,
  horizonDays: number
): void {
  const board = parent.createDiv('pm-action-board')
  for (const bucket of BUCKET_ORDER) {
    const column = board.createDiv(`pm-action-column pm-action-column--${bucket}`)
    const columnItems = items.filter((item) => item.bucket === bucket)
    const header = column.createDiv('pm-action-column-header')
    header.createDiv({ text: bucketLabel(bucket, horizonDays), cls: 'pm-action-column-title' })
    header.createSpan({ text: String(columnItems.length), cls: 'pm-action-column-count' })
    const cards = column.createDiv('pm-action-column-cards')
    cards.setAttr('role', 'list')
    if (!columnItems.length) cards.createDiv({ text: t('No tasks'), cls: 'pm-action-column-empty' })
    for (const item of columnItems) renderActionTask(cards, item, plugin, opts)
  }
}

export function renderActionCenter(
  container: HTMLElement,
  plugin: PMPlugin,
  projects: Project[],
  opts: ActionCenterRenderOptions = {}
): void {
  container.empty()
  container.addClass('pm-action-center')
  const mode = opts.mode ?? 'list'
  const query = opts.query ?? ''
  const referenceDate = opts.referenceDate ?? ''
  const horizonDays = opts.horizonDays ?? 7
  const allItems = collectActionItems(projects, { referenceDate, horizonDays }, (project) =>
    plugin.store.configFor(project)
  )

  let summary: HTMLElement | null = null

  if (opts.showToolbar !== false) {
    const controls = container.createDiv('pm-action-controls')
    const search = controls.createEl('input', {
      type: 'search',
      cls: 'pm-action-search',
      placeholder: t('Search tasks…'),
      value: query
    })
    search.setAttr('aria-label', t('Search tasks…'))
    summary = controls.createDiv('pm-action-summary')
    search.addEventListener('input', () => {
      opts.onQueryChange?.(search.value)
      paint(search.value)
    })
  }

  const body = container.createDiv('pm-action-body')
  const paint = (currentQuery: string): void => {
    const items = allItems.filter((item) => matchesQuery(item, currentQuery))
    if (summary) {
      summary.empty()
      summary.createSpan({ text: `${items.length} ${t('active tasks')}`, cls: 'pm-action-summary-count' })
      const overdue = items.filter((item) => item.bucket === 'overdue').length
      if (overdue) summary.createSpan({ text: `${overdue} ${t('overdue')}`, cls: 'pm-action-summary-alert' })
    }
    body.empty()
    if (!items.length) {
      renderEmpty(body)
      return
    }
    if (mode === 'board') renderActionBoard(body, items, plugin, opts, horizonDays)
    else renderActionList(body, items, plugin, opts, horizonDays)
  }
  paint(query)
}

/** Render-only helper used by the daily-note code block. */
export function renderActionCenterBlock(
  container: HTMLElement,
  plugin: PMPlugin,
  projects: Project[],
  opts: Omit<ActionCenterRenderOptions, 'showToolbar'> = {}
): void {
  renderActionCenter(container, plugin, projects, { ...opts, showToolbar: false, compact: true })
}

export function bucketLabelForTests(bucket: ActionCenterBucket, horizonDays = 7): string {
  return bucketLabel(bucket, horizonDays)
}

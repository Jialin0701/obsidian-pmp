import { setIcon } from 'obsidian'
import type PMPlugin from '../../main'
import type { Project, FilterState, PriorityConfig, StatusConfig } from '../../types'
import { type FlatTask, flattenTasks } from '../../store/TaskTreeOps'
import { findTaskById } from '../../store/TaskIndex'
import { applyTaskFilterFlat, isFilterActive } from '../../store/TaskFilter'
import { openTaskModal } from '../../ui/ModalFactory'
import { renderAddButton } from '../../ui/composites/addButton'
import { compareTask } from './TableFilters'
import { renderTaskRow, updateSelectedRow, updateSelectAllCheckbox } from './TableRow'
import { t } from '../../i18n'

type SortKey = 'title' | 'status' | 'priority' | 'due' | 'assignees' | 'progress'
type SortDir = 'asc' | 'desc'

export type { SortKey, SortDir }

export interface TableColumn {
  id: string
  key: SortKey | null
  label: string
  defaultWidth: number
  minWidth: number
  fixed?: boolean
}

export function getTableColumns(project: Project): TableColumn[] {
  return [
    { id: 'select', key: null, label: '', defaultWidth: 36, minWidth: 32, fixed: true },
    { id: 'expand', key: null, label: '', defaultWidth: 36, minWidth: 32, fixed: true },
    { id: 'title', key: 'title', label: 'Task', defaultWidth: 320, minWidth: 220 },
    { id: 'status', key: 'status', label: 'Status', defaultWidth: 120, minWidth: 60 },
    { id: 'priority', key: 'priority', label: 'Priority', defaultWidth: 100, minWidth: 54 },
    { id: 'assignees', key: 'assignees', label: 'Assignees', defaultWidth: 150, minWidth: 110 },
    { id: 'due', key: 'due', label: 'Due', defaultWidth: 120, minWidth: 100 },
    { id: 'progress', key: 'progress', label: 'Progress', defaultWidth: 130, minWidth: 110 },
    { id: 'time', key: null, label: 'Time', defaultWidth: 100, minWidth: 80 },
    ...project.customFields.map(
      (cf): TableColumn => ({
        id: `custom:${cf.id}`,
        key: null,
        label: cf.name,
        defaultWidth: 140,
        minWidth: 100
      })
    ),
    { id: 'actions', key: null, label: '', defaultWidth: 44, minWidth: 40, fixed: true }
  ]
}

export function defaultTableColumnIds(project: Project): string[] {
  return getTableColumns(project)
    .filter((column) => !column.fixed)
    .map((column) => column.id)
}

export interface TableState {
  sortKey: SortKey
  sortDir: SortDir
  filter: FilterState
  selectedTaskId: string | null
  selectedTaskIds: Set<string>
  lastCheckedTaskId: string | null
  tableBody: HTMLElement | null
  wrapper: HTMLElement | null
  /** Display list after filter/sort/collapse. Drives the virtual window and selection. */
  visibleRows: FlatTask[]
  /** An estimate until calibrated against the first painted row. */
  rowHeight: number
  heightCalibrated: boolean
  /** Bounds of the rendered window into visibleRows. -1 forces a repaint. */
  windowStart: number
  windowEnd: number
  renderWindow: (() => void) | null
  columns: string[]
  columnWidths: Record<string, number>
}

export interface TableContext {
  container: HTMLElement
  project: Project
  plugin: PMPlugin
  /** Resolved once per render pass. */
  statuses: StatusConfig[]
  priorities: PriorityConfig[]
  state: TableState
  onRefresh: () => Promise<void>
  onSelectionChange: () => void
  onBulkDelete: () => void
  onLayoutChange: () => void
}

export function renderTable(ctx: TableContext): void {
  const allColumns = getTableColumns(ctx.project)
  const configurableIds = new Set(defaultTableColumnIds(ctx.project))
  ctx.state.columns = ctx.state.columns.filter((id) => configurableIds.has(id))
  if (!ctx.state.columns.length) ctx.state.columns = defaultTableColumnIds(ctx.project)
  const visibleIds = new Set(ctx.state.columns)
  const columns = allColumns.filter((column) => column.fixed || visibleIds.has(column.id))

  const toolbar = ctx.container.createDiv('pm-table-toolbar')
  const columnsButton = toolbar.createEl('button', { text: t('Columns'), cls: 'pm-table-columns-button' })
  columnsButton.setAttribute('aria-expanded', 'false')
  columnsButton.setAttribute('aria-haspopup', 'true')
  const columnsMenu = toolbar.createDiv('pm-table-columns-menu')
  columnsMenu.addClass('pm-hidden')
  columnsMenu.setAttribute('role', 'menu')
  columnsMenu.createDiv({ text: t('Show column'), cls: 'pm-table-columns-menu-heading' })
  for (const column of allColumns.filter((item) => !item.fixed)) {
    const option = columnsMenu.createEl('label', { cls: 'pm-table-column-option' })
    const checkbox = option.createEl('input', { type: 'checkbox' })
    checkbox.checked = visibleIds.has(column.id)
    checkbox.disabled = column.id === 'title'
    checkbox.setAttribute('aria-label', `${t('Show column')}: ${t(column.label)}`)
    option.createSpan({ text: t(column.label) })
    checkbox.addEventListener('change', () => {
      const next = new Set(ctx.state.columns)
      if (checkbox.checked) next.add(column.id)
      else next.delete(column.id)
      ctx.state.columns = [...next]
      ctx.onLayoutChange()
    })
  }
  const resetButton = columnsMenu.createEl('button', { text: t('Reset columns'), cls: 'pm-table-columns-reset' })
  resetButton.addEventListener('click', () => {
    ctx.state.columns = defaultTableColumnIds(ctx.project)
    ctx.state.columnWidths = {}
    ctx.onLayoutChange()
  })
  columnsButton.addEventListener('click', () => {
    const isHidden = columnsMenu.hasClass('pm-hidden')
    columnsMenu.toggleClass('pm-hidden', !isHidden)
    columnsButton.setAttribute('aria-expanded', String(isHidden))
  })
  const wrapper = ctx.container.createDiv('pm-table-wrapper')
  ctx.state.wrapper = wrapper
  let scrollScheduled = false
  wrapper.addEventListener('scroll', () => {
    if (scrollScheduled) return
    scrollScheduled = true
    window.requestAnimationFrame(() => {
      scrollScheduled = false
      // Rebuilding the tbody nudges scrollTop near the edges, firing another scroll
      // event; repainting only on a real move stops that feeding back forever.
      const { start, end } = computeWindow(ctx.state)
      if (start === ctx.state.windowStart && end === ctx.state.windowEnd) return
      ctx.state.renderWindow?.()
    })
  })
  const table = wrapper.createEl('table', { cls: 'pm-table' })
  table.style.setProperty('--pm-table-column-count', String(columns.length))
  const colgroup = table.createEl('colgroup')
  const columnEls = new Map<string, HTMLTableColElement>()
  for (const column of columns) {
    const col = colgroup.createEl('col')
    col.dataset.columnId = column.id
    col.style.width = `${ctx.state.columnWidths[column.id] ?? column.defaultWidth}px`
    columnEls.set(column.id, col)
  }

  const thead = table.createEl('thead')
  const hrow = thead.createEl('tr')

  const selectAllTh = hrow.createEl('th', { cls: 'pm-table-cell-select', attr: { 'data-column-id': 'select' } })
  const selectAllCb = selectAllTh.createEl('input', { type: 'checkbox', cls: 'pm-select-all-checkbox' })
  selectAllCb.setAttribute('aria-label', t('Select all'))
  selectAllCb.addEventListener('change', () => {
    const ids = getVisibleTaskIds(ctx.state)
    if (selectAllCb.checked) {
      for (const id of ids) ctx.state.selectedTaskIds.add(id)
    } else {
      ctx.state.selectedTaskIds.clear()
    }
    updateSelectCheckboxes(ctx.state)
    ctx.onSelectionChange()
  })

  const sortableHeaders: { key: SortKey; th: HTMLElement }[] = []
  const paintSortIndicators = () => {
    for (const { key, th } of sortableHeaders) {
      th.querySelector('.pm-sort-indicator')?.remove()
      if (ctx.state.sortKey === key) {
        th.setAttribute('aria-sort', ctx.state.sortDir === 'asc' ? 'ascending' : 'descending')
        const indicator = th.createSpan({ cls: 'pm-sort-indicator' })
        setIcon(indicator, ctx.state.sortDir === 'asc' ? 'chevron-up' : 'chevron-down')
      } else {
        th.setAttribute('aria-sort', 'none')
      }
    }
  }

  for (const column of columns.filter((item) => item.id !== 'select')) {
    const label = t(column.label)
    const th = hrow.createEl('th', { attr: { 'data-column-id': column.id } })
    if (column.id === 'expand') th.addClass('pm-table-cell-expand')
    if (column.id === 'actions') th.addClass('pm-table-cell-actions')
    if (column.key) {
      th.addClass('pm-table-th-sortable')
      th.setAttribute('role', 'button')
      th.setAttribute('tabindex', '0')
      th.setAttribute('aria-label', `${t('Sort by')} ${label}`)
      th.createSpan({ text: label })
      sortableHeaders.push({ key: column.key, th })
      const applySort = () => {
        if (ctx.state.sortKey === column.key) {
          ctx.state.sortDir = ctx.state.sortDir === 'asc' ? 'desc' : 'asc'
        } else {
          ctx.state.sortKey = column.key as SortKey
          ctx.state.sortDir = 'asc'
        }
        paintSortIndicators()
        refreshTableBody(ctx)
      }
      th.addEventListener('click', applySort)
      th.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          applySort()
        }
      })
    } else if (column.id !== 'expand' && column.id !== 'actions') {
      th.setText(label)
    }
    if (column.id !== 'select' && column.id !== 'expand' && column.id !== 'actions') {
      addColumnResizer(th, column, columnEls.get(column.id), ctx)
    }
  }
  paintSortIndicators()

  ctx.state.tableBody = table.createEl('tbody')
  fillTableBody(ctx)
}

function addColumnResizer(
  th: HTMLElement,
  column: TableColumn,
  colEl: HTMLTableColElement | undefined,
  ctx: TableContext
): void {
  const handle = th.createSpan({ cls: 'pm-table-col-resizer' })
  handle.tabIndex = 0
  handle.setAttribute('role', 'separator')
  handle.setAttribute('aria-label', `${t('Adjust column width')}: ${t(column.label)}`)
  handle.setAttribute('aria-orientation', 'vertical')
  handle.setAttribute('aria-valuemin', String(column.minWidth))
  handle.setAttribute('aria-valuenow', String(ctx.state.columnWidths[column.id] ?? column.defaultWidth))
  handle.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const currentWidth = ctx.state.columnWidths[column.id] ?? column.defaultWidth
    const delta = event.key === 'ArrowRight' ? 10 : -10
    const nextWidth = Math.max(column.minWidth, currentWidth + delta)
    ctx.state.columnWidths[column.id] = nextWidth
    if (colEl) colEl.style.width = `${nextWidth}px`
    th.style.width = `${nextWidth}px`
    handle.setAttribute('aria-valuenow', String(nextWidth))
  })
  handle.addEventListener('pointerdown', (event) => {
    event.preventDefault()
    event.stopPropagation()
    const startX = event.clientX
    const startWidth = th.getBoundingClientRect().width
    activeDocument.body.addClass('pm-table-resizing')
    const onMove = (moveEvent: PointerEvent) => {
      const nextWidth = Math.max(column.minWidth, Math.round(startWidth + moveEvent.clientX - startX))
      if (colEl) colEl.style.width = `${nextWidth}px`
      th.style.width = `${nextWidth}px`
      ctx.state.columnWidths[column.id] = nextWidth
      handle.setAttribute('aria-valuenow', String(nextWidth))
    }
    const onUp = () => {
      activeDocument.body.removeClass('pm-table-resizing')
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp, { once: true })
  })
}

export function refreshTableBody(ctx: TableContext): void {
  if (ctx.state.tableBody) {
    fillTableBody(ctx)
  }
}

function fillTableBody(ctx: TableContext): void {
  const tbody = ctx.state.tableBody
  if (!tbody) return

  let flat = flattenTasks(ctx.project.tasks)
  const hasActiveFilter = isFilterActive(ctx.state.filter)
  flat = applyTaskFilterFlat(flat, ctx.state.filter, ctx.statuses)

  const filteredIds = new Set(flat.map((f) => f.task.id))

  // Group by parentId once, O(N), promoting orphans whose parent was filtered out.
  const childrenByParent = new Map<string | null, FlatTask[]>()
  for (const f of flat) {
    let bucket: string | null
    if (f.parentId === null) {
      bucket = null
    } else if (hasActiveFilter && !filteredIds.has(f.parentId)) {
      bucket = null
    } else {
      bucket = f.parentId
    }
    let list = childrenByParent.get(bucket)
    if (!list) {
      list = []
      childrenByParent.set(bucket, list)
    }
    list.push(f)
  }
  for (const list of childrenByParent.values()) {
    list.sort((a, b) => compareTask(a.task, b.task, ctx.state, ctx.statuses, ctx.priorities))
  }

  const sorted: FlatTask[] = []
  const addWithChildren = (parentId: string | null) => {
    const items = childrenByParent.get(parentId)
    if (!items) return
    for (const item of items) {
      sorted.push(item)
      addWithChildren(item.task.id)
    }
  }
  addWithChildren(null)

  // When filtering, show all matches regardless of collapsed parent.
  ctx.state.visibleRows = hasActiveFilter ? sorted : sorted.filter((f) => f.visible)
  ctx.state.renderWindow = () => renderWindowRows(ctx)
  // The data changed, so repaint even if the window bounds happen to match.
  ctx.state.windowStart = -1
  ctx.state.windowEnd = -1
  renderWindowRows(ctx)
}

const ROW_OVERSCAN = 8
export const ROW_HEIGHT_ESTIMATE = 40

/** The [start, end) slice of visibleRows to render at the current scroll position. */
function computeWindow(state: TableState): { start: number; end: number } {
  const wrapper = state.wrapper
  if (!wrapper) return { start: 0, end: state.visibleRows.length }
  const thead = wrapper.querySelector('thead')
  const headerHeight = thead instanceof HTMLElement ? thead.offsetHeight : 0
  const scrollTop = Math.max(0, wrapper.scrollTop - headerHeight)
  const viewHeight = wrapper.clientHeight || 600

  let start = Math.floor(scrollTop / state.rowHeight) - ROW_OVERSCAN
  if (start < 0) start = 0
  let end = Math.ceil((scrollTop + viewHeight) / state.rowHeight) + ROW_OVERSCAN
  if (end > state.visibleRows.length) end = state.visibleRows.length
  return { start, end }
}

/** Renders the viewport rows only, bracketed by spacers that keep the scrollbar honest. */
function renderWindowRows(ctx: TableContext): void {
  const { state } = ctx
  const tbody = state.tableBody
  if (!tbody) return

  const rows = state.visibleRows
  const colCount = 10 + ctx.project.customFields.length
  const { start, end } = computeWindow(state)
  state.windowStart = start
  state.windowEnd = end

  tbody.empty()
  if (start > 0) spacerRow(tbody, colCount, start * state.rowHeight)
  for (let i = start; i < end; i++) {
    renderTaskRow(tbody, rows[i].task, rows[i].depth, ctx)
  }
  if (end < rows.length) spacerRow(tbody, colCount, (rows.length - end) * state.rowHeight)

  const addRow = tbody.createEl('tr', { cls: 'pm-table-add-row' })
  const addCell = addRow.createEl('td', { attr: { colspan: String(colCount) } })
  renderAddButton(addCell, t('Add task'), () => {
    openTaskModal(ctx.plugin, ctx.project, { onSave: () => ctx.onRefresh() })
  })

  // Calibrate exactly once. Row heights are not perfectly uniform, so re-measuring
  // every pass feeds back into the window math and oscillates.
  if (!state.heightCalibrated) {
    const first = tbody.querySelector('tr[data-task-id]')
    if (first instanceof HTMLElement && first.offsetHeight > 0) {
      state.heightCalibrated = true
      if (Math.abs(first.offsetHeight - state.rowHeight) > 0.5) {
        state.rowHeight = first.offsetHeight
        renderWindowRows(ctx)
      }
    }
  }
}

function spacerRow(tbody: HTMLElement, colCount: number, height: number): void {
  const tr = tbody.createEl('tr', { cls: 'pm-table-spacer' })
  const td = tr.createEl('td', { attr: { colspan: String(colCount) } })
  td.setCssStyles({ height: `${height}px` })
}

export function updateSelectCheckboxes(state: TableState): void {
  if (!state.tableBody) return
  const rows = state.tableBody.querySelectorAll('tr[data-task-id]')
  for (const row of Array.from(rows)) {
    const id = (row as HTMLElement).dataset.taskId
    if (id === undefined) continue
    const cb = row.querySelector('.pm-select-checkbox')
    if (cb) (cb as HTMLInputElement).checked = state.selectedTaskIds.has(id)
  }
  updateSelectAllCheckbox(state)
}

export function handleTableKeyDown(e: KeyboardEvent, ctx: TableContext): void {
  const active = activeDocument.activeElement
  const isInput =
    active instanceof HTMLInputElement ||
    active instanceof HTMLTextAreaElement ||
    (active instanceof HTMLElement && active.contentEditable === 'true')

  if (e.key === 'Escape') {
    if (isInput) {
      active.blur()
      return
    }
    if (ctx.state.selectedTaskIds.size > 0) {
      ctx.state.selectedTaskIds.clear()
      updateSelectCheckboxes(ctx.state)
      ctx.onSelectionChange()
      return
    }
    ctx.state.selectedTaskId = null
    updateSelectedRow(ctx.state)
    return
  }

  if (isInput) return

  const rows = getVisibleTaskIds(ctx.state)
  if (!rows.length) return

  switch (e.key) {
    case 'ArrowDown':
    case 'j': {
      e.preventDefault()
      const idx = ctx.state.selectedTaskId ? rows.indexOf(ctx.state.selectedTaskId) : -1
      const next = Math.min(idx + 1, rows.length - 1)
      ctx.state.selectedTaskId = rows[next]
      updateSelectedRow(ctx.state)
      break
    }
    case 'ArrowUp':
    case 'k': {
      e.preventDefault()
      const idx = ctx.state.selectedTaskId ? rows.indexOf(ctx.state.selectedTaskId) : rows.length
      const prev = Math.max(idx - 1, 0)
      ctx.state.selectedTaskId = rows[prev]
      updateSelectedRow(ctx.state)
      break
    }
    case 'Enter':
    case 'e': {
      if (!ctx.state.selectedTaskId) return
      e.preventDefault()
      const task = findTaskById(ctx.project, ctx.state.selectedTaskId)
      if (task) {
        openTaskModal(ctx.plugin, ctx.project, {
          task,
          onSave: async () => {
            await ctx.onRefresh()
          }
        })
      }
      break
    }
    case 'Delete':
    case 'Backspace': {
      e.preventDefault()
      if (ctx.state.selectedTaskIds.size > 0) {
        ctx.onBulkDelete()
        break
      }
      if (!ctx.state.selectedTaskId) return
      const id = ctx.state.selectedTaskId
      const currentIdx = rows.indexOf(id)
      const nextIdx = currentIdx < rows.length - 1 ? currentIdx + 1 : currentIdx - 1
      ctx.state.selectedTaskId = nextIdx >= 0 ? rows[nextIdx] : null
      void deleteTask(id, ctx)
      break
    }
  }
}

export function getVisibleTaskIds(state: TableState): string[] {
  return state.visibleRows.map((f) => f.task.id)
}

async function deleteTask(id: string, ctx: TableContext): Promise<void> {
  await ctx.plugin.store.deleteTask(ctx.project, id)
  await ctx.onRefresh()
}

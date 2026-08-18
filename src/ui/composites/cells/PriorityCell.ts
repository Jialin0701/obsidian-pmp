import type { Task, PriorityConfig, TaskPriority } from '../../../types'
import { getPriorityConfig } from '../../../utils'
import { renderPriorityBadge } from '../../StatusBadge'
import { t } from '../../../i18n'

export interface PriorityCellProps {
  task: Task
  priorities: PriorityConfig[]
  onChange: (priority: TaskPriority) => void
}

export class PriorityCell {
  el: HTMLTableCellElement

  constructor(parentRow: HTMLElement, props: PriorityCellProps) {
    this.el = parentRow.createEl('td', { cls: 'pm-table-cell pm-table-cell-priority pm-table-cell--compactible' })
    const config = getPriorityConfig(props.priorities, props.task.priority)
    if (config) {
      const badge = renderPriorityBadge(this.el, props.task, props.priorities, props.onChange)
      badge.setAttribute('title', t(config.label))
      badge.setAttribute('aria-label', `${t('Priority')}: ${t(config.label)}`)
    }
  }
}

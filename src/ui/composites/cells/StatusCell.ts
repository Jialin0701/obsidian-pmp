import type { Task, StatusConfig, TaskStatus } from '../../../types'
import { getStatusConfig } from '../../../utils'
import { renderStatusBadge } from '../../StatusBadge'
import { t } from '../../../i18n'

export interface StatusCellProps {
  task: Task
  statuses: StatusConfig[]
  onChange: (status: TaskStatus) => void
}

export class StatusCell {
  el: HTMLTableCellElement

  constructor(parentRow: HTMLElement, props: StatusCellProps) {
    this.el = parentRow.createEl('td', { cls: 'pm-table-cell pm-table-cell-status pm-table-cell--compactible' })
    const config = getStatusConfig(props.statuses, props.task.status)
    if (config) {
      const badge = renderStatusBadge(this.el, props.task, props.statuses, props.onChange)
      badge.setAttribute('title', t(config.label))
      badge.setAttribute('aria-label', `${t('Status')}: ${t(config.label)}`)
    }
  }
}

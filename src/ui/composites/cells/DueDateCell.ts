import type { Task } from '../../../types'
import { formatDateLong } from '../../../utils'
import type { DueUrgency } from '../dueChip'
import { renderDueChip } from '../dueChip'
import { Chip } from '../../primitives/Chip'
import { makeInlineEdit } from './inlineEdit'
import { t } from '../../../i18n'
import { relativeDue } from '../../../dates'

export interface DueDateCellProps {
  task: Task
  urgency: DueUrgency
  onSave: (newDate: string) => Promise<void>
}

export class DueDateCell {
  el: HTMLTableCellElement

  constructor(parentRow: HTMLElement, props: DueDateCellProps) {
    const { task } = props
    this.el = parentRow.createEl('td', { cls: 'pm-table-cell' })

    const startEdit = (display: HTMLElement): void => {
      makeInlineEdit({
        container: this.el,
        display,
        inputType: 'date',
        value: task.due,
        onSave: props.onSave
      })
    }

    if (!task.due) {
      const chip = new Chip(this.el)
        .setLabel('—')
        .setColor('var(--text-faint)')
        .onClick((e) => {
          e.stopPropagation()
          startEdit(chip.el)
        })
      return
    }

    const exactDate = formatDateLong(task.due)
    const relative = props.urgency === 'normal' ? null : relativeDue(task.due)
    const chip = renderDueChip(this.el, relative?.text ?? exactDate, props.urgency)
    if (relative?.tone === 'today') chip.setColor('var(--color-blue)')
    chip.el.addClass(`pm-due-chip--${props.urgency}`)
    if (relative) chip.el.addClass(`pm-due-tone--${relative.tone}`)
    chip.setTooltip(exactDate)
    chip.el.setAttribute('aria-label', `${exactDate}${props.urgency === 'overdue' ? ` (${t('Overdue')})` : ''}`)
    chip.onClick((e) => {
      e.stopPropagation()
      startEdit(chip.el)
    })
  }
}

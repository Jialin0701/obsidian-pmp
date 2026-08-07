import { ProgressBar } from '../primitives/ProgressBar'
import { t } from '../../i18n'
import { renderProjectIcon } from '../../utils'

export interface ProjectListRowProps {
  title: string
  description: string
  icon: string
  tasksDone: number
  tasksTotal: number
  onClick: () => void
  onContextMenu: (e: MouseEvent) => void
}

/** Compact project summary for the dashboard's list view. */
export class ProjectListRow {
  el: HTMLElement

  constructor(parentEl: HTMLElement, props: ProjectListRowProps) {
    const row = parentEl.createDiv('pm-project-list-row')
    this.el = row
    row.setAttr('role', 'button')
    row.setAttr('tabindex', '0')
    row.setAttr('aria-label', props.title)

    const identity = row.createDiv('pm-project-list-row-identity')
    renderProjectIcon(identity, props.icon, 'pm-project-list-row-icon')

    const copy = identity.createDiv('pm-project-list-row-copy')
    copy.createEl('h3', { text: props.title, cls: 'pm-project-list-row-title' })
    copy.createDiv({
      text: props.description.trim() || t('No description'),
      cls: `pm-project-list-row-description${props.description.trim() ? '' : ' pm-project-list-row-description--empty'}`
    })

    const progress = props.tasksTotal ? (props.tasksDone / props.tasksTotal) * 100 : 0
    const metrics = row.createDiv('pm-project-list-row-metrics')
    const taskCount = metrics.createDiv({ cls: 'pm-project-list-row-task-count' })
    taskCount.createSpan({ text: `${props.tasksDone}/${props.tasksTotal}`, cls: 'pm-project-list-row-task-value' })
    taskCount.createSpan({ text: t('tasks'), cls: 'pm-project-list-row-task-label' })
    metrics.createDiv({ text: `${Math.round(progress)}%`, cls: 'pm-project-list-row-percent' })
    new ProgressBar(metrics).setSize('sm').setValue(progress).setColor('var(--interactive-accent)')

    row.addEventListener('click', () => props.onClick())
    row.addEventListener('contextmenu', (e) => props.onContextMenu(e))
    row.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      e.preventDefault()
      props.onClick()
    })
  }
}

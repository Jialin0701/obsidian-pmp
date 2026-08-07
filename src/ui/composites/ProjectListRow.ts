import { ProgressBar } from '../primitives/ProgressBar'
import { t } from '../../i18n'
import { formatDateLong, renderProjectIcon } from '../../utils'
import { renderProjectMemberPills } from './ProjectMemberPills'
import type { ProjectSummary } from '../../types'

export interface ProjectListRowProps {
  summary: ProjectSummary
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
    row.setAttr('aria-label', props.summary.title)

    const identity = row.createDiv('pm-project-list-row-identity')
    renderProjectIcon(identity, props.summary.icon, 'pm-project-list-row-icon')

    const copy = identity.createDiv('pm-project-list-row-copy')
    copy.createEl('h3', { text: props.summary.title, cls: 'pm-project-list-row-title' })
    const description = row.createDiv('pm-project-list-row-description')
    description.setText(props.summary.description.trim() || t('No description'))
    if (!props.summary.description.trim()) description.addClass('pm-project-list-row-description--empty')

    const members = row.createDiv('pm-project-list-row-members')
    renderProjectMemberPills(members, props.summary.members, 'pm-project-member-pills')

    row.createDiv({
      text: formatDateLong(props.summary.updatedAt) || t('Unknown'),
      cls: 'pm-project-list-row-updated'
    })

    const metrics = row.createDiv('pm-project-list-row-metrics')
    const taskCount = metrics.createDiv({ cls: 'pm-project-list-row-task-count' })
    taskCount.createSpan({
      text: `${props.summary.completedTasks}/${props.summary.totalTasks}`,
      cls: 'pm-project-list-row-task-value'
    })
    taskCount.createSpan({ text: t('tasks'), cls: 'pm-project-list-row-task-label' })
    metrics.createDiv({ text: `${Math.round(props.summary.progress)}%`, cls: 'pm-project-list-row-percent' })
    new ProgressBar(metrics).setSize('sm').setValue(props.summary.progress).setColor('var(--interactive-accent)')

    row.addEventListener('click', () => props.onClick())
    row.addEventListener('contextmenu', (e) => props.onContextMenu(e))
    row.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      e.preventDefault()
      props.onClick()
    })
  }
}

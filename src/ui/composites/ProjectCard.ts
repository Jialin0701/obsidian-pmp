import { ProgressBar } from '../primitives/ProgressBar'
import { t } from '../../i18n'
import { formatDateLong, renderProjectIcon } from '../../utils'
import { renderProjectMemberPills } from './ProjectMemberPills'
import type { ProjectSummary } from '../../types'

export interface ProjectCardProps {
  summary: ProjectSummary
  onClick: () => void
  onContextMenu: (e: MouseEvent) => void
}

export class ProjectCard {
  el: HTMLElement

  constructor(parentEl: HTMLElement, props: ProjectCardProps) {
    const card = parentEl.createDiv('pm-project-card')
    this.el = card
    card.setAttr('role', 'button')
    card.setAttr('tabindex', '0')
    card.setAttr('aria-label', props.summary.title)

    const body = card.createDiv('pm-project-card-body')
    const identity = body.createDiv('pm-project-card-identity')
    renderProjectIcon(identity, props.summary.icon, 'pm-project-card-icon')
    identity.createEl('h3', { text: props.summary.title, cls: 'pm-project-card-title' })

    body.createDiv({
      text: props.summary.description.trim() || t('No description'),
      cls: `pm-project-card-description${props.summary.description.trim() ? '' : ' pm-project-card-description--empty'}`
    })

    const meta = body.createDiv('pm-project-card-meta')
    meta.createSpan({ text: `${props.summary.activeTasks} ${t('Active')}`, cls: 'pm-project-card-stat' })
    meta.createSpan({ text: `${props.summary.completedTasks} ${t('Completed')}`, cls: 'pm-project-card-stat' })
    meta.createSpan({ text: `${Math.round(props.summary.progress)}%`, cls: 'pm-project-card-percent' })
    new ProgressBar(body).setSize('sm').setValue(props.summary.progress).setColor('var(--interactive-accent)')

    if (props.summary.statusCounts.length > 0) {
      const statuses = body.createDiv('pm-project-card-statuses')
      for (const status of props.summary.statusCounts.slice(0, 3)) {
        statuses.createSpan({ text: `${t(status.label)} ${status.count}`, cls: 'pm-project-card-status' })
      }
      const remaining = props.summary.statusCounts.length - 3
      if (remaining > 0) statuses.createSpan({ text: `+${remaining}`, cls: 'pm-project-card-status' })
    }

    const footer = body.createDiv('pm-project-card-footer')
    const members = footer.createDiv('pm-project-card-members')
    members.createSpan({ text: `${t('Participants')}:`, cls: 'pm-project-card-footer-label' })
    renderProjectMemberPills(members, props.summary.members, 'pm-project-member-pills')
    const updated = footer.createSpan({ cls: 'pm-project-card-updated' })
    updated.setText(`${t('Last updated')}: ${formatDateLong(props.summary.updatedAt) || t('Unknown')}`)

    card.addEventListener('click', () => props.onClick())
    card.addEventListener('contextmenu', (e) => props.onContextMenu(e))
    card.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      e.preventDefault()
      props.onClick()
    })
  }
}

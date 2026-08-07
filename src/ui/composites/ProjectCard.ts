import { ProgressBar } from '../primitives/ProgressBar'
import { t } from '../../i18n'
import { renderProjectIcon } from '../../utils'

export interface ProjectCardProps {
  title: string
  icon: string
  tasksDone: number
  tasksTotal: number
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
    card.setAttr('aria-label', props.title)

    const body = card.createDiv('pm-project-card-body')
    const identity = body.createDiv('pm-project-card-identity')
    renderProjectIcon(identity, props.icon, 'pm-project-card-icon')
    identity.createEl('h3', { text: props.title, cls: 'pm-project-card-title' })

    const meta = body.createDiv('pm-project-card-meta')
    meta.createSpan({
      text: t(`${props.tasksDone}/${props.tasksTotal} tasks`),
      cls: 'pm-project-card-tasks'
    })

    const percent = props.tasksTotal ? (props.tasksDone / props.tasksTotal) * 100 : 0
    new ProgressBar(body).setSize('sm').setValue(percent).setColor('var(--interactive-accent)')

    card.addEventListener('click', () => props.onClick())
    card.addEventListener('contextmenu', (e) => props.onContextMenu(e))
    card.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      e.preventDefault()
      props.onClick()
    })
  }
}

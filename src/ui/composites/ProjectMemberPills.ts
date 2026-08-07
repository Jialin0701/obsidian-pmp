import { setTooltip } from 'obsidian'
import { t } from '../../i18n'
import { displayName } from '../primitives/Avatar'

export function renderProjectMemberPills(parentEl: HTMLElement, members: string[], cls: string): HTMLElement {
  const wrap = parentEl.createDiv(cls)
  const visible = members.slice(0, 3)
  for (const member of visible) {
    const name = displayName(member)
    const pill = wrap.createSpan({ text: name, cls: 'pm-project-member-pill' })
    setTooltip(pill, name)
  }
  const remaining = members.length - visible.length
  if (remaining > 0) {
    const more = wrap.createSpan({ text: `+${remaining}`, cls: 'pm-project-member-pill pm-project-member-pill--more' })
    more.setAttribute('aria-label', `${remaining} ${t('people')}`)
    setTooltip(more, `${remaining} ${t('people')}`)
  }
  if (members.length === 0) {
    wrap.createSpan({ text: t('No team members'), cls: 'pm-project-member-empty' })
  }
  return wrap
}

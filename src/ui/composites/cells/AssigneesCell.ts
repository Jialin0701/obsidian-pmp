export class AssigneesCell {
  el: HTMLTableCellElement

  constructor(parentRow: HTMLElement, assignees: string[]) {
    this.el = parentRow.createEl('td', { cls: 'pm-table-cell pm-table-cell-assignees' })
    const list = this.el.createDiv('pm-assignee-list')
    if (!assignees.length) {
      list.createSpan({ text: '—', cls: 'pm-assignee-empty' })
      return
    }
    const visible = assignees.slice(0, 2)
    for (const name of visible) {
      const chip = list.createSpan({ text: name, cls: 'pm-assignee-chip' })
      chip.setAttribute('title', name)
    }
    if (assignees.length > visible.length) {
      const more = list.createSpan({
        text: `+${assignees.length - visible.length}`,
        cls: 'pm-assignee-chip pm-assignee-chip--more'
      })
      more.setAttribute('title', assignees.slice(visible.length).join(', '))
    }
    this.el.setAttribute('aria-label', assignees.join(', '))
  }
}

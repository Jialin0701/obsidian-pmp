import { ButtonComponent, setIcon as setObsidianIcon } from 'obsidian'
import { isIconName } from '../../utils'

export class EmptyState {
  el: HTMLElement
  private iconEl?: HTMLElement
  private titleEl?: HTMLElement
  private bodyEl?: HTMLElement
  private actionEl?: HTMLElement

  constructor(parentEl: HTMLElement) {
    this.el = parentEl.createDiv('pm-empty-state')
  }

  setIcon(text: string): this {
    this.iconEl ??= this.el.createDiv('pm-empty-icon')
    this.iconEl.empty()
    if (isIconName(text)) setObsidianIcon(this.iconEl, text)
    else this.iconEl.setText(text)
    return this
  }

  setTitle(text: string): this {
    this.titleEl ??= this.el.createEl('h3')
    this.titleEl.setText(text)
    return this
  }

  setBody(text: string): this {
    this.bodyEl ??= this.el.createEl('p')
    this.bodyEl.setText(text)
    return this
  }

  setAction(label: string, onClick: () => void): this {
    if (!this.actionEl) this.actionEl = this.el.createDiv('pm-empty-action')
    this.actionEl.empty()
    new ButtonComponent(this.actionEl).setButtonText(label).setCta().onClick(onClick)
    return this
  }
}

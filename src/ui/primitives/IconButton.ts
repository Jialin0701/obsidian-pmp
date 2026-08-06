import { ExtraButtonComponent } from 'obsidian'
import { t } from '../../i18n'

export class IconButton {
  el: HTMLElement
  private button: ExtraButtonComponent

  constructor(parentEl: HTMLElement) {
    this.button = new ExtraButtonComponent(parentEl)
    this.el = this.button.extraSettingsEl
    this.el.addClass('pm-icon-btn')
  }

  setIcon(name: string): this {
    this.button.setIcon(name)
    return this
  }

  setTooltip(text: string): this {
    const label = t(text)
    this.button.setTooltip(label)
    this.el.setAttribute('aria-label', label)
    return this
  }

  setRevealOnHover(enabled: boolean): this {
    this.el.toggleClass('pm-icon-btn--hover-only', enabled)
    return this
  }

  onClick(handler: (e: MouseEvent) => unknown): this {
    this.el.addEventListener('click', handler)
    return this
  }
}

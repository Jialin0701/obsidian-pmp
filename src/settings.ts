import { App, Notice, PluginSettingTab, Setting } from 'obsidian'
import type { SettingDefinitionItem, SettingDefinitionPage } from 'obsidian'
import type PMPlugin from './main'
import { type Language, type PMSettings, DEFAULT_SETTINGS, makeId } from './types'
import { flattenTasks } from './store/TaskTreeOps'
import {
  countTaskNotesPaletteChanges,
  getTaskNotesApi,
  importTaskNotesPalettes,
  isTaskNotesInstalled
} from './integrations/tasknotes'
import { renderPaletteFields, renderStatusDoneToggle } from './ui/PaletteListEditor'
import { t, translateElementTree } from './i18n'

export type { PMSettings }
export { DEFAULT_SETTINGS }

function plural(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export class PMSettingTab extends PluginSettingTab {
  plugin: PMPlugin

  constructor(app: App, plugin: PMPlugin) {
    super(app, plugin)
    this.plugin = plugin
    this.icon = 'chart-gantt'
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        type: 'group',
        heading: t('General'),
        items: [
          {
            name: t('Language'),
            desc: t('Choose the interface language.'),
            control: {
              type: 'dropdown',
              key: 'language',
              options: { auto: t('Auto'), en: t('English'), zh: t('Chinese') }
            }
          },
          {
            name: t('Projects folder'),
            desc: t('Vault folder where project files are stored.'),
            control: {
              type: 'folder',
              key: 'projectsFolder',
              defaultValue: 'Projects',
              placeholder: 'Projects',
              validate: (value) => (value.trim() ? undefined : t('Enter a folder name.'))
            }
          },
          {
            name: t('Default view'),
            desc: t('View that opens when a project is opened.'),
            control: {
              type: 'dropdown',
              key: 'defaultView',
              options: { table: t('Table'), gantt: t('Gantt'), kanban: t('Board') }
            }
          },
          {
            name: t('Save tasks on close'),
            desc: t('Save changes when the task editor is closed.'),
            control: { type: 'toggle', key: 'saveTaskOnClose' }
          }
        ]
      },
      {
        type: 'group',
        heading: t('Style'),
        items: [
          {
            name: t('Show tag colors'),
            desc: t('Give each tag a colored dot derived from its name.'),
            aliases: ['appearance'],
            control: { type: 'toggle', key: 'showTagColors' }
          }
        ]
      },
      {
        type: 'group',
        heading: t('Gantt'),
        items: [
          {
            name: t('Default granularity'),
            desc: t('Time unit for each column in the timeline.'),
            aliases: ['timeline', 'zoom'],
            control: {
              type: 'dropdown',
              key: 'ganttGranularity',
              options: { day: t('Day'), week: t('Week'), month: t('Month'), quarter: t('Quarter') }
            }
          },
          {
            name: t('Week label'),
            desc: t('Text shown in weekly header cells.'),
            aliases: ['timeline'],
            control: {
              type: 'dropdown',
              key: 'ganttWeekLabel',
              options: {
                weekNumber: t('Week number (w15)'),
                dateRange: t('Date range (apr 7–13)'),
                both: t('Both (w15: apr 7–13)')
              }
            }
          }
        ]
      },
      {
        type: 'group',
        heading: t('Board'),
        items: [
          {
            name: t('Show subtasks'),
            desc: t('Display subtasks as individual cards.'),
            aliases: ['kanban'],
            control: { type: 'toggle', key: 'kanbanShowSubtasks' }
          },
          {
            name: t('Show description preview'),
            desc: t('Display the first few lines of each task description.'),
            aliases: ['kanban'],
            control: { type: 'toggle', key: 'kanbanShowDescriptionPreview' }
          }
        ]
      },
      {
        type: 'group',
        heading: t('Scheduling'),
        items: [
          {
            name: t('Auto-schedule'),
            desc: t('Adjust dependent task dates when a task changes.'),
            aliases: ['dependencies'],
            control: { type: 'toggle', key: 'autoSchedule' }
          },
          {
            name: t('Pull dependents forward'),
            desc: t('Move dependent tasks earlier when a task is completed before its due date.'),
            aliases: ['dependencies'],
            control: {
              type: 'toggle',
              key: 'pullForwardOnEarlyFinish',
              disabled: () => !this.plugin.settings.autoSchedule
            }
          }
        ]
      },
      {
        type: 'group',
        heading: t('Notifications'),
        items: [
          {
            name: t('Due date reminders'),
            desc: t('Show a banner when a task is approaching its due date.'),
            aliases: ['notifications', 'banner'],
            control: { type: 'toggle', key: 'notificationsEnabled' }
          },
          {
            name: t('Days in advance'),
            desc: t('How many days before the due date to notify.'),
            aliases: ['notifications', 'reminders', 'lead time'],
            control: {
              type: 'slider',
              key: 'notificationLeadDays',
              min: 1,
              max: 14,
              step: 1,
              disabled: () => !this.plugin.settings.notificationsEnabled
            }
          }
        ]
      },
      {
        type: 'group',
        heading: t('Task fields'),
        items: [this.statusesPage(), this.prioritiesPage(), this.teamMembersPage()]
      },
      {
        type: 'group',
        heading: t('Integrations'),
        visible: () => isTaskNotesInstalled(this.app),
        items: [this.taskNotesPage()]
      }
    ]
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    await super.setControlValue(key, value)
    if (key === 'language') {
      this.plugin.setLanguage(value as Language)
      this.update()
      window.setTimeout(() => translateElementTree(this.containerEl), 0)
      return
    }
    if (key === 'kanbanShowDescriptionPreview') this.plugin.refreshProjectViews()
    this.refreshDomState()
  }

  private statusesPage(): SettingDefinitionPage {
    const statuses = this.plugin.settings.statuses
    return {
      type: 'page',
      name: t('Statuses'),
      desc: t('Labels, colors, and icons for the status field.'),
      displayValue: () => t(plural(this.plugin.settings.statuses.length, 'status', 'statuses')),
      items: [
        {
          type: 'list',
          heading: t('Statuses'),
          emptyState: t('No statuses.'),
          items: statuses.map((status) => ({
            name: status.label,
            render: (setting: Setting) => {
              setting.setClass('pm-palette-row')
              renderPaletteFields(setting.controlEl, this.app, status, () => this.persist())
              renderStatusDoneToggle(setting.controlEl, status, () => this.persist())
            }
          })),
          onReorder: (from, to) => this.reorder(statuses, from, to),
          onDelete: (index) => this.deleteEntry('status', index),
          addItem: {
            name: t('Add status'),
            action: () => {
              statuses.push({
                id: 'status-' + makeId().slice(0, 6),
                label: t('New status'),
                color: '#8a94a0',
                icon: '',
                complete: false
              })
              this.persist()
              this.update()
            }
          }
        }
      ]
    }
  }

  private prioritiesPage(): SettingDefinitionPage {
    const priorities = this.plugin.settings.priorities
    return {
      type: 'page',
      name: t('Priorities'),
      desc: t('Labels, colors, and icons for the priority field.'),
      displayValue: () => t(plural(this.plugin.settings.priorities.length, 'priority', 'priorities')),
      items: [
        {
          type: 'list',
          heading: t('Priorities'),
          emptyState: t('No priorities.'),
          items: priorities.map((priority) => ({
            name: priority.label,
            render: (setting: Setting) => {
              setting.setClass('pm-palette-row')
              renderPaletteFields(setting.controlEl, this.app, priority, () => this.persist())
            }
          })),
          onReorder: (from, to) => this.reorder(priorities, from, to),
          onDelete: (index) => this.deleteEntry('priority', index),
          addItem: {
            name: t('Add priority'),
            action: () => {
              priorities.push({
                id: 'priority-' + makeId().slice(0, 6),
                label: t('New priority'),
                color: '#8a94a0',
                icon: ''
              })
              this.persist()
              this.update()
            }
          }
        }
      ]
    }
  }

  private taskNotesPage(): SettingDefinitionPage {
    const connected = (): boolean => getTaskNotesApi(this.app) !== null
    return {
      type: 'page',
      name: t('TaskNotes'),
      desc: t('Share statuses and priorities with the TaskNotes plugin.'),
      displayValue: () => this.taskNotesStatus(),
      status: () => (connected() ? null : 'warning'),
      items: [
        {
          type: 'list',
          extraButtons: [
            (button) =>
              button
                .setIcon('refresh-cw')
                .setTooltip(t('Import from TaskNotes'))
                .setDisabled(!connected())
                .onClick(() => this.importFromTaskNotes())
          ],
          items: [
            {
              name: t('Statuses and priorities'),
              desc: t('Copies labels, colors, and completion from TaskNotes 4.10 or newer.'),
              render: (setting: Setting) => {
                setting.controlEl.createDiv({ cls: 'setting-item-value', text: this.taskNotesStatus() })
              }
            }
          ]
        }
      ]
    }
  }

  /** Whether an import would change anything right now. */
  private taskNotesStatus(): string {
    const api = getTaskNotesApi(this.app)
    if (!api) return t('Update required')
    const { added, updated } = countTaskNotesPaletteChanges(api, this.plugin.settings)
    const total = added + updated
    return total === 0 ? t('Up to date') : t(plural(total, 'change', 'changes'))
  }

  private teamMembersPage(): SettingDefinitionPage {
    const members = this.plugin.settings.globalTeamMembers
    return {
      type: 'page',
      name: t('Team members'),
      desc: t('People available as assignees across all projects.'),
      displayValue: () => t(plural(this.plugin.settings.globalTeamMembers.length, 'person', 'people')),
      items: [
        {
          type: 'list',
          heading: t('Team members'),
          emptyState: t('No team members yet.'),
          items: members.map((member, index) => ({
            name: member || t('Unnamed member'),
            render: (setting: Setting) => {
              setting.setClass('pm-palette-row')
              setting.addText((text) =>
                text
                  .setPlaceholder(t('Name'))
                  .setValue(member)
                  .onChange((value) => {
                    this.plugin.settings.globalTeamMembers[index] = value
                    this.persist()
                  })
              )
            }
          })),
          onReorder: (from, to) => this.reorder(members, from, to),
          onDelete: (index) => {
            members.splice(index, 1)
            this.persist()
            this.update()
          },
          addItem: {
            name: t('Add member'),
            action: () => {
              members.push('')
              this.persist()
              this.update()
            }
          }
        }
      ]
    }
  }

  private persist(): void {
    void this.plugin.saveSettings()
  }

  private reorder<T>(items: T[], from: number, to: number): void {
    const [moved] = items.splice(from, 1)
    items.splice(to, 0, moved)
    this.persist()
    this.update()
  }

  private deleteEntry(field: 'status' | 'priority', index: number): void {
    const entries = field === 'status' ? this.plugin.settings.statuses : this.plugin.settings.priorities
    if (entries.length <= 1) {
      new Notice(t(`You must have at least one ${field}.`))
      return
    }
    const [removed] = entries.splice(index, 1)
    this.persist()
    this.update()
    void this.remapOrphanTasks(field, removed.id, removed.label)
  }

  private importFromTaskNotes(): void {
    const api = getTaskNotesApi(this.app)
    if (!api) {
      new Notice(t('TaskNotes 4.10 or newer is required.'))
      return
    }
    const { added, updated } = importTaskNotesPalettes(api, this.plugin.settings)
    this.persist()
    this.update()
    new Notice(
      added || updated
        ? t(`Imported from TaskNotes: ${added} added, ${updated} updated.`)
        : t('Statuses and priorities already match TaskNotes.')
    )
  }

  private async remapOrphanTasks(field: 'status' | 'priority', deletedId: string, deletedLabel: string): Promise<void> {
    const configs = field === 'status' ? this.plugin.settings.statuses : this.plugin.settings.priorities
    if (configs.length === 0) return
    const fallback = configs[0]
    const folder = this.plugin.settings.projectsFolder
    const projects = await this.plugin.store.loadAllProjects(folder)
    let remapped = 0
    for (const project of projects) {
      // A project defining this status or priority itself is unaffected by a global delete.
      const own = field === 'status' ? project.config?.statuses : project.config?.priorities
      if (own?.some((entry) => entry.id === deletedId)) continue
      const ids = flattenTasks(project.tasks)
        .filter(({ task }) => task[field] === deletedId)
        .map(({ task }) => task.id)
      if (ids.length) {
        await this.plugin.store.updateTasks(project, ids, { [field]: fallback.id })
        remapped += ids.length
      }
    }
    if (remapped > 0) {
      new Notice(
        t(`Remapped ${remapped} task${remapped === 1 ? '' : 's'} from '${deletedLabel}' to '${fallback.label}'.`)
      )
    }
  }
}

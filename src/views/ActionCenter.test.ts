import { describe, expect, it } from 'vitest'
import { Temporal } from '../dates'
import type { Project, Task } from '../types'
import { buildTaskIndex } from '../store/TaskIndex'
import { bucketLabelForTests, classifyActionItem, collectActionItems } from './ActionCenter'

const statuses = [
  { id: 'todo', label: 'To Do', color: '#888', icon: '', complete: false },
  { id: 'done', label: 'Done', color: '#0a0', icon: '', complete: true }
]

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Task',
    description: '',
    type: 'task',
    status: 'todo',
    priority: 'medium',
    start: '',
    due: '',
    progress: 0,
    completed: '',
    assignees: [],
    tags: [],
    subtasks: [],
    dependencies: [],
    customFields: {},
    collapsed: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  }
}

function project(tasks: Task[]): Project {
  const value = {
    id: 'project-1',
    title: 'Project',
    description: '',
    color: '#888',
    icon: 'folder-kanban',
    tasks,
    customFields: [],
    teamMembers: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    filePath: 'Projects/Project.md',
    savedViews: [],
    taskIndex: new Map()
  } as Project
  value.taskIndex = buildTaskIndex(tasks)
  return value
}

describe('Action center classification', () => {
  const reference = Temporal.PlainDate.from('2026-08-17')

  it('prioritizes overdue and due-today tasks', () => {
    const p = project([task({ id: 'overdue', due: '2026-08-16' }), task({ id: 'today', due: '2026-08-17' })])
    expect(classifyActionItem(p, p.tasks[0], statuses, reference, 7)?.bucket).toBe('overdue')
    expect(classifyActionItem(p, p.tasks[1], statuses, reference, 7)?.bucket).toBe('today')
  })

  it('marks unfinished dependencies as blocked', () => {
    const blocker = task({ id: 'blocker' })
    const dependent = task({ id: 'dependent', due: '2026-08-18', dependencies: ['blocker'] })
    const p = project([blocker, dependent])
    const result = classifyActionItem(p, dependent, statuses, reference, 7)
    expect(result?.bucket).toBe('blocked')
    expect(result?.blockedBy).toEqual(['blocker'])
  })

  it('ignores completed and archived tasks', () => {
    const done = task({ status: 'done' })
    const archived = task({ id: 'archived', archived: true })
    const p = project([done, archived])
    expect(classifyActionItem(p, done, statuses, reference, 7)).toBeNull()
    expect(classifyActionItem(p, archived, statuses, reference, 7)).toBeNull()
  })

  it('keeps far-future tasks separate from unscheduled work', () => {
    const future = task({ due: '2026-09-30' })
    const unscheduled = task({ id: 'unscheduled' })
    const p = project([future, unscheduled])
    expect(classifyActionItem(p, future, statuses, reference, 7)?.bucket).toBe('later')
    expect(classifyActionItem(p, unscheduled, statuses, reference, 7)?.bucket).toBe('unscheduled')
  })

  it('uses the configured horizon in the upcoming label', () => {
    expect(bucketLabelForTests('upcoming', 14)).toBe('Next 14 days')
  })

  it('limits embedded focus results to overdue and due-within-horizon tasks', () => {
    const overdue = task({ id: 'overdue', due: '2026-08-16' })
    const today = task({ id: 'today', due: '2026-08-17' })
    const upcoming = task({ id: 'upcoming', due: '2026-08-24' })
    const later = task({ id: 'later', due: '2026-08-25' })
    const unscheduled = task({ id: 'unscheduled' })
    const activeLater = task({ id: 'active-later', start: '2026-08-10', due: '2026-09-30' })
    const p = project([overdue, today, upcoming, later, unscheduled, activeLater])
    const config = () => ({ statuses, priorities: [] })

    const allItems = collectActionItems([p], { referenceDate: '2026-08-17', horizonDays: 7 }, config)
    expect(allItems.map((item) => item.task.id)).toEqual([
      'overdue',
      'today',
      'upcoming',
      'active-later',
      'unscheduled',
      'later'
    ])

    const items = collectActionItems([p], { referenceDate: '2026-08-17', horizonDays: 7, horizonOnly: true }, config)

    expect(items.map((item) => item.task.id)).toEqual(['overdue', 'today', 'upcoming'])
  })
})

import { describe, expect, it } from 'vitest'
import { makeProject, makeTask, type StatusConfig } from '../types'
import { summarizeProject } from './ProjectSummary'

const statuses: StatusConfig[] = [
  { id: 'todo', label: 'To Do', color: '', icon: '', complete: false },
  { id: 'in-progress', label: 'In progress', color: '', icon: '', complete: false },
  { id: 'done', label: 'Done', color: '', icon: '', complete: true }
]

describe('summarizeProject', () => {
  it('aggregates nested tasks, completion, statuses, members, and update time', () => {
    const project = makeProject('Launch', 'Projects/Launch.md')
    project.description = 'Public launch'
    project.teamMembers = ['Alice', '', 'Bob']
    project.updatedAt = '2026-08-07T08:00:00.000Z'
    project.tasks = [
      makeTask({ status: 'done', subtasks: [makeTask({ status: 'todo' })] }),
      makeTask({ status: 'in-progress' })
    ]

    const summary = summarizeProject(project, statuses)

    expect(summary.totalTasks).toBe(3)
    expect(summary.completedTasks).toBe(1)
    expect(summary.activeTasks).toBe(2)
    expect(summary.progress).toBeCloseTo(33.333)
    expect(summary.members).toEqual(['Alice', 'Bob'])
    expect(summary.updatedAt).toBe('2026-08-07T08:00:00.000Z')
    expect(summary.statusCounts).toEqual([
      { id: 'todo', label: 'To Do', count: 1, complete: false },
      { id: 'in-progress', label: 'In progress', count: 1, complete: false },
      { id: 'done', label: 'Done', count: 1, complete: true }
    ])
  })

  it('returns an empty, zero-progress summary for a project without tasks', () => {
    const summary = summarizeProject(makeProject('Empty', 'Projects/Empty.md'), statuses)

    expect(summary.totalTasks).toBe(0)
    expect(summary.completedTasks).toBe(0)
    expect(summary.activeTasks).toBe(0)
    expect(summary.progress).toBe(0)
    expect(summary.statusCounts).toEqual([])
  })
})

import type { Project, ProjectSummary, StatusConfig, Task } from '../types'
import { isTerminalStatus } from '../utils'

function flattenTasks(tasks: Task[], into: Task[] = []): Task[] {
  for (const task of tasks) {
    into.push(task)
    flattenTasks(task.subtasks, into)
  }
  return into
}

export function summarizeProject(project: Project, statuses: StatusConfig[]): ProjectSummary {
  const tasks = flattenTasks(project.tasks)
  const completedTasks = tasks.filter((task) => isTerminalStatus(task.status, statuses)).length
  const statusCounts = statuses
    .map((status) => ({
      id: status.id,
      label: status.label,
      count: tasks.filter((task) => task.status === status.id).length,
      complete: status.complete
    }))
    .filter((status) => status.count > 0)

  return {
    title: project.title,
    description: project.description,
    icon: project.icon,
    members: project.teamMembers.filter((member) => member.trim()),
    totalTasks: tasks.length,
    completedTasks,
    activeTasks: Math.max(0, tasks.length - completedTasks),
    progress: tasks.length ? (completedTasks / tasks.length) * 100 : 0,
    updatedAt: project.updatedAt,
    statusCounts
  }
}

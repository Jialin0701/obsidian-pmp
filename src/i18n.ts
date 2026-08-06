import type { Language } from './types'

export type ActiveLanguage = 'en' | 'zh'

const ZH: Record<string, string> = {
  'Project manager': '项目管理',
  Projects: '项目',
  Project: '项目',
  General: '常规',
  Style: '样式',
  Gantt: '甘特图',
  Board: '看板',
  Scheduling: '排程',
  Notifications: '通知',
  'Task fields': '任务字段',
  Integrations: '集成',
  'Projects folder': '项目文件夹',
  'Vault folder where project files are stored.': '存放项目文件的库文件夹。',
  'Default view': '默认视图',
  'View that opens when a project is opened.': '打开项目时使用的视图。',
  'Save tasks on close': '关闭时保存任务',
  'Save changes when the task editor is closed.': '关闭任务编辑器时保存更改。',
  'Show tag colors': '显示标签颜色',
  'Give each tag a colored dot derived from its name.': '根据标签名称显示对应颜色的圆点。',
  'Default granularity': '默认粒度',
  'Time unit for each column in the timeline.': '时间轴每列所代表的时间单位。',
  'Week label': '周标签',
  'Text shown in weekly header cells.': '周视图表头中显示的文本。',
  'Show subtasks': '显示子任务',
  'Display subtasks as individual cards.': '将子任务作为独立卡片显示。',
  'Show description preview': '显示描述预览',
  'Display the first few lines of each task description.': '显示每个任务描述的前几行。',
  'Auto-schedule': '自动排程',
  'Adjust dependent task dates when a task changes.': '任务变化时自动调整依赖任务的日期。',
  'Pull dependents forward': '提前依赖任务',
  'Move dependent tasks earlier when a task is completed before its due date.': '任务提前完成时，将依赖任务相应提前。',
  'Due date reminders': '截止日期提醒',
  'Show a banner when a task is approaching its due date.': '任务临近截止日期时显示提醒。',
  'Days in advance': '提前天数',
  'How many days before the due date to notify.': '在截止日期前多少天提醒。',
  Statuses: '状态',
  Priorities: '优先级',
  'Team members': '团队成员',
  TaskNotes: 'TaskNotes',
  'Share statuses and priorities with the TaskNotes plugin.': '与 TaskNotes 插件共享状态和优先级。',
  'Statuses and priorities': '状态和优先级',
  'Copies labels, colors, and completion from TaskNotes 4.10 or newer.':
    '从 TaskNotes 4.10 或更高版本复制标签、颜色和完成状态。',
  'People available as assignees across all projects.': '可在所有项目中分配任务的人员。',
  'Labels, colors, and icons for the status field.': '状态字段的标签、颜色和图标。',
  'Labels, colors, and icons for the priority field.': '优先级字段的标签、颜色和图标。',
  'Add status': '添加状态',
  'Add priority': '添加优先级',
  'Add member': '添加成员',
  'No statuses.': '暂无状态。',
  'No priorities.': '暂无优先级。',
  'No team members yet.': '暂无团队成员。',
  'Unnamed member': '未命名成员',
  'Import from TaskNotes': '从 TaskNotes 导入',
  'Update required': '需要更新',
  'Up to date': '已是最新',
  change: '项更改',
  changes: '项更改',
  status: '状态',
  statuses: '状态',
  priority: '优先级',
  priorities: '优先级',
  person: '人',
  people: '人',
  'Open projects pane': '打开项目面板',
  'Create new project': '创建新项目',
  'Create new task': '创建新任务',
  'Create new subtask': '创建新子任务',
  'Undo last action': '撤销上一步操作',
  'Redo last action': '重做上一步操作',
  'Import notes as tasks': '将笔记导入为任务',
  'Create task from selection': '根据选中文本创建任务',
  'Open current file as project': '将当前文件作为项目打开',
  'No projects yet. Create a project first.': '还没有项目，请先创建一个项目。',
  'No tasks in this project. Create a task first.': '此项目还没有任务，请先创建一个任务。',
  'No projects yet': '还没有项目',
  'Create your first project to get started.': '创建第一个项目即可开始。',
  '+ new project': '+ 新建项目',
  '+ Create project': '+ 创建项目',
  '+ add task': '+ 添加任务',
  '+ milestone': '+ 里程碑',
  'Project settings': '项目设置',
  'Project not found': '找不到项目',
  'It may have been deleted or renamed.': '项目可能已被删除或重命名。',
  Table: '表格',
  Today: '今天',
  Tomorrow: '明天',
  'Expand all': '全部展开',
  'Collapse all': '全部折叠',
  Task: '任务',
  Type: '类型',
  'Parent task': '父任务',
  Start: '开始日期',
  Assignee: '负责人',
  Tag: '标签',
  Tags: '标签',
  Completed: '已完成',
  'Due date': '截止日期',
  Overdue: '已逾期',
  'This week': '本周',
  'This month': '本月',
  'No date': '无日期',
  Status: '状态',
  Priority: '优先级',
  Assignees: '负责人',
  Due: '截止日期',
  Progress: '进度',
  Time: '时间',
  Clear: '清除',
  'Filter by': '筛选',
  'Set date': '设置日期',
  'Set value': '设置值',
  Select: '选择',
  'Search tasks…': '搜索任务…',
  'Search people…': '搜索人员…',
  'Find or create…': '查找或创建…',
  'Search tags…': '搜索标签…',
  'Search files...': '搜索文件…',
  'Search…': '搜索…',
  'Search files…': '搜索文件…',
  'Search or create a tag…': '搜索或创建标签…',
  'Select parent': '选择父任务',
  'Set start': '设置开始日期',
  'Add tags': '添加标签',
  'Add dependency': '添加依赖',
  'Add another': '添加另一个',
  'Add subtask…': '添加子任务…',
  'Remove subtask': '移除子任务',
  'Add property': '添加属性',
  'No parent': '无父任务',
  'Depends on': '依赖于',
  Repeat: '重复',
  'Does not repeat': '不重复',
  Daily: '每天',
  Weekly: '每周',
  Monthly: '每月',
  Yearly: '每年',
  'Custom fields': '自定义字段',
  Description: '描述',
  'Project name': '项目名称',
  Color: '颜色',
  'New project': '新建项目',
  'New Field': '新字段',
  'View & scheduling': '视图与排程',
  'Overrides for this project': '此项目的覆盖设置',
  'Extra properties for tasks': '任务的额外属性',
  'Use global': '使用全局设置',
  On: '开启',
  Off: '关闭',
  Show: '显示',
  Hide: '隐藏',
  Cancel: '取消',
  Save: '保存',
  OK: '确定',
  Delete: '删除',
  Archive: '归档',
  Unarchive: '取消归档',
  'Edit project': '编辑项目',
  'Delete project': '删除项目',
  'Edit task': '编辑任务',
  'Add subtask': '添加子任务',
  'Duplicate task': '复制任务',
  'Delete task': '删除任务',
  'Task only': '仅任务',
  'With subtasks': '包含子任务',
  'More actions': '更多操作',
  'Open popover': '打开弹出框',
  'Hidden until hover': '悬停后显示',
  Edit: '编辑',
  Close: '关闭',
  'Copy task ID': '复制任务 ID',
  'Copy file path': '复制文件路径',
  'Remove member': '移除成员',
  'Remove field': '移除字段',
  'Remove option': '移除选项',
  'Remove dependency': '移除依赖',
  'Task unarchived': '任务已取消归档',
  'Task archived': '任务已归档',
  'Copied task ID': '任务 ID 已复制',
  'Copied file path': '文件路径已复制',
  'Failed to save attachment': '附件保存失败',
  'Something went wrong. Check the console for details.': '发生错误，请查看控制台了解详情。',
  'Failed to set task dates. Please try again.': '设置任务日期失败，请重试。',
  'Failed to save date change. Please try again.': '保存日期更改失败，请重试。',
  'Dates reverted. Dependent task dates may need adjustment.': '日期已恢复，依赖任务的日期可能需要调整。',
  'Connect a right dot (output) to a left dot (input).': '请将右侧圆点（输出）连接到左侧圆点（输入）。',
  'This dependency already exists.': '此依赖关系已存在。',
  'Reverse dependency exists — would create a cycle.': '反向依赖已存在，将形成循环。',
  'Failed to save dependency.': '保存依赖关系失败。',
  'Bulk action failed. Please try again.': '批量操作失败，请重试。',
  'Select notes to import': '选择要导入的笔记',
  'Select all': '全选',
  Next: '下一步',
  Back: '上一步',
  'Import options': '导入选项',
  Import: '导入',
  'Create project': '创建项目',
  'Create (Shift+Enter)': '创建（Shift+Enter）',
  'Save (Shift+Enter)': '保存（Shift+Enter）',
  'Enter assignee name:': '输入负责人姓名：',
  'Enter tag:': '输入标签：',
  Assign: '分配',
  'Default status': '默认状态',
  'Default priority': '默认优先级',
  'File handling': '文件处理',
  'Move to tasks folder (default)': '移动到任务文件夹（默认）',
  'Copy (keep original)': '复制（保留原文件）',
  'To Do': '待办',
  'To do': '待办',
  'In Progress': '进行中',
  'In progress': '进行中',
  Blocked: '已阻塞',
  'In Review': '审核中',
  Done: '已完成',
  Cancelled: '已取消',
  Critical: '紧急',
  High: '高',
  Medium: '中',
  Low: '低',
  'Task actions': '任务操作',
  Milestone: '里程碑',
  Subtask: '子任务',
  Recurring: '重复任务',
  Archived: '已归档',
  'Open as note': '作为笔记打开',
  'Estimate:': '预计时间：',
  'Remove log': '移除记录',
  'Clear selection': '清除选择',
  'Set status': '设置状态',
  'Set priority': '设置优先级',
  'Set assignee': '设置负责人',
  'Set tag': '设置标签',
  'Set due date': '设置截止日期',
  'Set progress': '设置进度',
  'Set parent': '设置父任务',
  'Remove parent': '移除父任务',
  'Clear assignees': '清除负责人',
  'Clear tags': '清除标签',
  'Clear due date': '清除截止日期',
  '+ new assignee...': '+ 新建负责人…',
  '+ new tag...': '+ 新建标签…',
  'On time': '按时完成',
  'Pick date...': '选择日期…',
  'Update with current filters': '使用当前筛选更新',
  'Delete view': '删除视图',
  '+ save view': '+ 保存视图',
  'View name…': '视图名称…',
  Language: '语言',
  'Choose the interface language.': '选择界面语言。',
  Auto: '自动',
  English: 'English',
  Chinese: '中文'
}

const EN = Object.fromEntries(Object.entries(ZH).map(([en, zh]) => [zh, en]))
let activeLanguage: ActiveLanguage = 'en'

export function resolveLanguage(language: Language | undefined): ActiveLanguage {
  if (language === 'zh' || language === 'en') return language
  return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

export function setLanguage(language: Language | undefined): ActiveLanguage {
  activeLanguage = resolveLanguage(language)
  return activeLanguage
}

export function getLanguage(): ActiveLanguage {
  return activeLanguage
}

export function getDateLocale(): string {
  return activeLanguage === 'zh' ? 'zh-CN' : 'en-US'
}

export function t(text: string): string {
  if (activeLanguage === 'en') return text
  const exact = ZH[text]
  if (exact) return exact
  const overdue = text.match(/^(\d+)d overdue$/)
  if (overdue) return `逾期 ${overdue[1]} 天`
  const inDays = text.match(/^In (\d+)d$/)
  if (inDays) return `${inDays[1]} 天后`
  const late = text.match(/^(\d+)d late$/)
  if (late) return `晚了 ${late[1]} 天`
  const selected = text.match(/^(\d+) selected$/)
  if (selected) return `已选择 ${selected[1]} 项`
  const count = text.match(/^(\d+) (status|statuses|priority|priorities|person|people|change|changes)$/)
  if (count) {
    const noun = ['status', 'statuses'].includes(count[2])
      ? '个状态'
      : ['priority', 'priorities'].includes(count[2])
        ? '个优先级'
        : ['change', 'changes'].includes(count[2])
          ? '项更改'
          : '人'
    return `${count[1]} ${noun}`
  }
  const filterBy = text.match(/^Filter by (.+)$/)
  if (filterBy) return `按${t(filterBy[1])}筛选`
  const dueLabel = text.match(/^Due: (.+)$/)
  if (dueLabel) return `截止：${t(dueLabel[1])}`
  const clearCount = text.match(/^Clear \((\d+)\)$/)
  if (clearCount) return `清除（${clearCount[1]}）`
  const selectedFilter = text.match(/^(Status|Priority|Assignee|Tag): (\d+)$/)
  if (selectedFilter) return `${t(selectedFilter[1])}：${selectedFilter[2]}`
  const datedShortcut = text.match(/^(Today|Tomorrow|In 1 week|In 2 weeks) \((.+)\)$/)
  if (datedShortcut) {
    const label = { Today: '今天', Tomorrow: '明天', 'In 1 week': '一周后', 'In 2 weeks': '两周后' }[datedShortcut[1]]
    return `${label}（${datedShortcut[2]}）`
  }
  const dueSoon = text.match(/^Due in (\d+)d: (.+)$/)
  if (dueSoon) return `${dueSoon[1]} 天后截止：${dueSoon[2]}`
  const overdueNotice = text.match(/^⚠️ Overdue: (.+) in (.+) was due (\d+)d ago$/)
  if (overdueNotice) return `⚠️ 已逾期：${overdueNotice[1]}（${overdueNotice[2]}）已逾期 ${overdueNotice[3]} 天`
  const dueToday = text.match(/^📅 Due today: (.+) in (.+)$/)
  if (dueToday) return `📅 今天截止：${dueToday[1]}（${dueToday[2]}）`
  const migrating = text.match(/^Migrating project: (.+)\.\.\.$/)
  if (migrating) return `正在迁移项目：${migrating[1]}…`
  const migrated = text.match(/^Project Manager: Migrated (\d+) project\(s\) to new format\.$/)
  if (migrated) return `项目管理：已将 ${migrated[1]} 个项目迁移到新格式。`
  const conflict = text.match(/^Task not saved: a note named "(.+)" already exists\.$/)
  if (conflict) return `任务未保存：名为“${conflict[1]}”的笔记已存在。`
  const remapped = text.match(/^Remapped (\d+) tasks? from '(.+)' to '(.+)'\.$/)
  if (remapped) return `已将 ${remapped[1]} 个任务从“${remapped[2]}”映射到“${remapped[3]}”。`
  const moved = text.match(/^(Moved|Archived|Unarchived) (\d+) tasks?(.*)$/)
  if (moved) {
    const action = { Moved: '已移动', Archived: '已归档', Unarchived: '已取消归档' }[moved[1]]
    return `${action} ${moved[2]} 个任务${moved[3]}`
  }
  const tasks = text.match(/^(\d+)\/(\d+) tasks$/)
  if (tasks) return `${tasks[1]}/${tasks[2]} 个任务`
  const create = text.match(/^Create: (.+)$/)
  if (create) return `创建：${create[1]}`
  const duplicate = text.match(/^Duplicate "(.+)" with its subtasks\?$/)
  if (duplicate) return `复制“${duplicate[1]}”及其子任务？`
  const noProject = text.match(/^No project at (.+)\. It may have been deleted or renamed\.$/)
  if (noProject) return `找不到项目 ${noProject[1]}。项目可能已被删除或重命名。`
  const importCount = text.match(/^Import \((\d+)\)$/)
  if (importCount) return `导入（${importCount[1]}）`
  return text
}

function fromChinese(text: string): string {
  return activeLanguage === 'zh' ? text : (EN[text] ?? text)
}

const DYNAMIC_CONTENT_CLASSES = new Set([
  'pm-toolbar-title',
  'pm-project-card-title',
  'pm-task-title-text',
  'pm-kanban-card-title',
  'pm-kanban-card-description',
  'pm-gantt-label-title',
  'pm-te-crumb-name',
  'pm-note-suggest-name',
  'pm-note-suggest-path',
  'import-file-name',
  'import-file-folder'
])

function shouldTranslate(element: Element): boolean {
  let current: Element | null = element
  while (current) {
    if ([...current.classList].some((className) => DYNAMIC_CONTENT_CLASSES.has(className))) return false
    const className = typeof current.className === 'string' ? current.className : ''
    if (
      className.includes('pm-') ||
      className.includes('import-') ||
      className.includes('menu-item') ||
      className.includes('setting-item')
    ) {
      return true
    }
    current = current.parentElement
  }
  return false
}

export function translateElementTree(root: HTMLElement): void {
  if (typeof activeDocument === 'undefined') return
  const walker = activeDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  let node: Node | null
  while ((node = walker.nextNode())) nodes.push(node as Text)
  for (const textNode of nodes) {
    const parent = textNode.parentElement
    if (!parent || !shouldTranslate(parent)) continue
    const value = textNode.nodeValue
    if (!value || !value.trim()) continue
    const leading = value.match(/^\s*/)?.[0] ?? ''
    const trailing = value.match(/\s*$/)?.[0] ?? ''
    const content = value.trim()
    const translated = activeLanguage === 'zh' ? t(content) : fromChinese(content)
    if (translated !== content) textNode.nodeValue = `${leading}${translated}${trailing}`
  }
  for (const element of Array.from(root.querySelectorAll<HTMLElement>('*'))) {
    if (!shouldTranslate(element)) continue
    for (const attr of ['title', 'aria-label', 'placeholder']) {
      const value = element.getAttribute(attr)
      if (!value) continue
      const translated = activeLanguage === 'zh' ? t(value) : fromChinese(value)
      if (translated !== value) element.setAttribute(attr, translated)
    }
  }
}

export function observeTranslations(root: HTMLElement): MutationObserver | null {
  if (typeof MutationObserver === 'undefined') return null
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (node.nodeType === Node.ELEMENT_NODE) translateElementTree(node as HTMLElement)
      }
    }
  })
  observer.observe(root, { childList: true, subtree: true })
  translateElementTree(root)
  return observer
}

import { afterEach, describe, expect, it } from 'vitest'
import { getDateLocale, resolveLanguage, setLanguage, t } from './i18n'

describe('i18n', () => {
  afterEach(() => setLanguage('en'))

  it('keeps English text unchanged', () => {
    setLanguage('en')
    expect(t('Project manager')).toBe('Project manager')
    expect(t('Unknown user content')).toBe('Unknown user content')
    expect(getDateLocale()).toBe('en-US')
  })

  it('translates static interface text to Chinese', () => {
    setLanguage('zh')
    expect(t('Project manager')).toBe('项目管理')
    expect(t('Create new task')).toBe('创建新任务')
    expect(t('In Progress')).toBe('进行中')
    expect(t('New project')).toBe('新建项目')
    expect(t('The workflow for this project')).toBe('此项目的工作流')
    expect(t('Add custom field')).toBe('添加自定义字段')
    expect(t('Pick a project…')).toBe('选择项目…')
    expect(getDateLocale()).toBe('zh-CN')
  })

  it('translates dynamic counters and due-date text', () => {
    setLanguage('zh')
    expect(t('3 selected')).toBe('已选择 3 项')
    expect(t('2/7 tasks')).toBe('2/7 个任务')
    expect(t('3d overdue')).toBe('逾期 3 天')
    expect(t('Import (5)')).toBe('导入（5）')
    expect(t('Time tracking (2h)')).toBe('时间记录（2h）')
    expect(t('Option 3')).toBe('选项 3')
    expect(t('Imported 3 tasks (2 skipped)')).toBe('已导入 3 个任务（跳过 2 个）')
    expect(t('Moved 2 tasks under new parent')).toBe('已移动 2 个任务到新的父任务下')
    expect(t('Due: Overdue')).toBe('截止：已逾期')
  })

  it('translates dynamic dialogs and error messages', () => {
    setLanguage('zh')
    expect(t('Delete "Roadmap"?')).toBe('删除“Roadmap”？')
    expect(t('A note named "Plan" already exists. Choose a different title.')).toBe(
      '名为“Plan”的笔记已存在，请使用其他标题。'
    )
    expect(t('Project Manager: Failed to load "Alpha". Check console for details.')).toBe(
      '项目管理：加载“Alpha”失败，请查看控制台了解详情。'
    )
  })

  it('resolves explicit language choices', () => {
    expect(resolveLanguage('en')).toBe('en')
    expect(resolveLanguage('zh')).toBe('zh')
  })
})

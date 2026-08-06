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
    expect(getDateLocale()).toBe('zh-CN')
  })

  it('translates dynamic counters and due-date text', () => {
    setLanguage('zh')
    expect(t('3 selected')).toBe('已选择 3 项')
    expect(t('2/7 tasks')).toBe('2/7 个任务')
    expect(t('3d overdue')).toBe('逾期 3 天')
    expect(t('Import (5)')).toBe('导入（5）')
  })

  it('resolves explicit language choices', () => {
    expect(resolveLanguage('en')).toBe('en')
    expect(resolveLanguage('zh')).toBe('zh')
  })
})

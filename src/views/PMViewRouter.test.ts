import { TFile } from 'obsidian'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type PMPlugin from '../main'
import { PMViewRouter } from './PMViewRouter'

vi.mock('./DashboardView', () => ({ PM_DASHBOARD_VIEW_TYPE: 'pm-dashboard' }))
vi.mock('./ProjectView', () => ({ PM_PROJECT_VIEW_TYPE: 'pm-project' }))

function projectFile(path: string): TFile {
  const file = new TFile()
  file.path = path
  return file
}

describe('PMViewRouter.openProject', () => {
  const revealLeaf = vi.fn<(leaf: unknown) => void>()
  const getLeaf = vi.fn<(kind: string) => unknown>()
  const getLeavesOfType = vi.fn<(type: string) => unknown[]>()
  const workspace = { revealLeaf, getLeaf, getLeavesOfType }
  const router = new PMViewRouter({ app: { workspace } } as unknown as PMPlugin)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reveals an existing leaf for the same project without opening another tab', async () => {
    const existingLeaf = {
      getViewState: () => ({ state: { filePath: 'Projects/Launch.md' } }),
      setViewState: vi.fn<(state: unknown) => void>()
    }
    getLeavesOfType.mockReturnValue([existingLeaf])

    await router.openProject(projectFile('Projects/Launch.md'))

    expect(getLeavesOfType).toHaveBeenCalledWith('pm-project')
    expect(getLeaf).not.toHaveBeenCalled()
    expect(existingLeaf.setViewState).not.toHaveBeenCalled()
    expect(revealLeaf).toHaveBeenCalledWith(existingLeaf)
  })

  it('opens a new tab when the project is not already open', async () => {
    const newLeaf = { setViewState: vi.fn<(state: unknown) => void>() }
    getLeavesOfType.mockReturnValue([])
    getLeaf.mockReturnValue(newLeaf)

    await router.openProject(projectFile('Projects/Launch.md'))

    expect(getLeaf).toHaveBeenCalledWith('tab')
    expect(newLeaf.setViewState).toHaveBeenCalledWith({
      type: 'pm-project',
      state: { filePath: 'Projects/Launch.md' }
    })
    expect(revealLeaf).toHaveBeenCalledWith(newLeaf)
  })
})

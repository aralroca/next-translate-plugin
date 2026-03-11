import nextTranslate from '../src/index'
import fs from 'fs'
import path from 'path'

const pkgRoot = path.resolve(__dirname, '..')
const appPath = path.join(pkgRoot, 'apps', 'app')
const bunPath = path.join(pkgRoot, 'bun-app')

// Mock i18n for all test scenarios using paths relative to the test file
const mockI18n = { locales: ['en'], defaultLocale: 'en' }
jest.mock('../i18n', () => mockI18n, { virtual: true })
jest.mock('../apps/app/i18n', () => mockI18n, { virtual: true })
jest.mock('../bun-app/i18n', () => mockI18n, { virtual: true })

jest.mock('pkg-dir', () => ({
  sync: jest.fn(() => process.cwd()),
}))

jest.mock('../src/utils', () => ({
  ...jest.requireActual('../src/utils'),
  existPages: jest.fn(() => true),
  calculatePageDir: jest.fn((dir) => dir),
  getConfigFileName: jest.fn(() => 'i18n.js'),
  regexToString: jest.fn((r) => (r ? r.toString() : '')),
  existLocalesFolderWithNamespaces: jest.fn(() => true),
  parseFile: jest.fn(() => ({})),
  getDefaultExport: jest.fn((v) => v),
  hasStaticName: jest.fn(() => false),
  hasHOC: jest.fn(() => false),
}))

describe('Turbopack Config', () => {
  const originalResolve = require.resolve
  const originalCwd = process.cwd
  const originalEnv = process.env.NEXT_TRANSLATE_PATH

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(fs, 'readdirSync').mockReturnValue([])
    jest.spyOn(fs, 'existsSync').mockReturnValue(false)
    jest.spyOn(process, 'cwd').mockReturnValue(pkgRoot)
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterAll(() => {
    require.resolve = originalResolve
    process.cwd = originalCwd
    process.env.NEXT_TRANSLATE_PATH = originalEnv
  })

  test('should detect correctly properties in a regular repo', () => {
    process.cwd.mockReturnValue(pkgRoot)
    process.env.NEXT_TRANSLATE_PATH = pkgRoot

    fs.existsSync.mockImplementation((p) => {
      if (p === path.join(pkgRoot, 'i18n.js')) return true
      if (p === path.join(pkgRoot, 'yarn.lock')) return true
      return false
    })

    const config = nextTranslate({}, { turbopack: true })
    const tpConfig = config.turbopack

    expect(tpConfig).toBeDefined()
    expect(tpConfig.root).toBe(pkgRoot)
    expect(tpConfig.resolveAlias['@next-translate-root']).toBe('./')
  })

  test('should detect correctly properties in a monorepo', () => {
    process.cwd.mockReturnValue(appPath)
    process.env.NEXT_TRANSLATE_PATH = appPath

    fs.existsSync.mockImplementation((p) => {
      if (p === path.join(appPath, 'i18n.js')) return true
      if (p === path.join(pkgRoot, 'yarn.lock')) return true
      return false
    })

    const config = nextTranslate({}, { turbopack: true })
    const tpConfig = config.turbopack

    expect(tpConfig).toBeDefined()
    expect(tpConfig.root).toBe(pkgRoot)
    expect(tpConfig.resolveAlias['@next-translate-root']).toBe('./')
  })

  test('should handle bun.lockb as root marker', () => {
    process.cwd.mockReturnValue(bunPath)
    process.env.NEXT_TRANSLATE_PATH = bunPath

    fs.existsSync.mockImplementation((p) => {
      if (p === path.join(bunPath, 'i18n.js')) return true
      if (p === path.join(pkgRoot, 'bun.lockb')) return true
      return false
    })

    const config = nextTranslate({}, { turbopack: true })
    expect(config.turbopack).toBeDefined()
    expect(config.turbopack.root).toBe(pkgRoot)
  })
})

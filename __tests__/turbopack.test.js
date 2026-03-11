import nextTranslate from '../src/index'
import fs from 'fs'
import path from 'path'

jest.spyOn(fs, 'readdirSync').mockReturnValue([])
jest.spyOn(fs, 'existsSync').mockReturnValue(false)

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

// Mock for /abs/path/i18n (we'll use this root for all tests)
jest.mock('../i18n', () => ({ locales: ['en'], defaultLocale: 'en' }), {
  virtual: true,
})

describe('Turbopack Config', () => {
  const originalCwd = process.cwd
  const originalResolve = require.resolve

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_TRANSLATE_PATH = '.'
    fs.readdirSync.mockReturnValue([])
    fs.existsSync.mockReturnValue(false)
  })

  afterAll(() => {
    process.cwd = originalCwd
    require.resolve = originalResolve
  })

  test('should detect correctly properties in a regular repo', () => {
    const basePath = path.resolve(__dirname, '..')
    process.cwd = jest.fn(() => basePath)

    fs.existsSync.mockImplementation((p) => {
      if (p === path.join(basePath, 'i18n.js')) return true
      if (p === path.join(basePath, 'yarn.lock')) return true
      return false
    })

    require.resolve = jest.fn((query) => {
      if (query === 'next-translate/package.json')
        return path.join(basePath, 'node_modules/next-translate/package.json')
      return originalResolve(query)
    })

    const config = nextTranslate({}, { turbopack: true })
    const tpConfig = config.turbopack

    expect(tpConfig.root).toBe(basePath)
    expect(tpConfig.resolveAlias['@next-translate-root']).toBe('./')
    expect(tpConfig.resolveAlias['next-translate']).toBe(
      './node_modules/next-translate'
    )
  })

  test('should correctly handle bun.lockb as root marker', () => {
    const basePath = path.resolve(__dirname, '..')
    process.cwd = jest.fn(() => basePath)

    fs.existsSync.mockImplementation((p) => {
      if (p === path.join(basePath, 'i18n.js')) return true
      if (p === path.join(basePath, 'bun.lockb')) return true
      return false
    })

    const config = nextTranslate({}, { turbopack: true })
    expect(config.turbopack.root).toBe(basePath)
  })

  test('should detect correctly properties in a monorepo', () => {
    const rootPath = path.resolve(__dirname, '..')
    const appPath = path.join(rootPath, 'example-monorepo-app')
    process.cwd = jest.fn(() => appPath)

    // We mock the exact path that will be required
    const i18nMockPath = path.join(appPath, 'i18n')
    jest.doMock(
      i18nMockPath,
      () => ({ locales: ['en'], defaultLocale: 'en' }),
      { virtual: true }
    )

    fs.existsSync.mockImplementation((p) => {
      if (p === path.join(appPath, 'i18n.js')) return true
      if (p === path.join(rootPath, 'yarn.lock')) return true
      return false
    })

    require.resolve = jest.fn((query) => {
      if (query === 'next-translate/package.json')
        return path.join(rootPath, 'node_modules/next-translate/package.json')
      return originalResolve(query)
    })

    const config = nextTranslate({}, { turbopack: true })
    const tpConfig = config.turbopack

    expect(tpConfig.root).toBe(rootPath)
    expect(tpConfig.resolveAlias['@next-translate-root']).toBe('./')
    // Relative path from example-monorepo-app to monorepo root node_modules is ../node_modules
    expect(tpConfig.resolveAlias['next-translate']).toBe(
      './../node_modules/next-translate'
    )
  })
})

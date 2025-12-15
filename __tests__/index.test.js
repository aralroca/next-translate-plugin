import nextTranslate from '../src/index'
import fs from 'fs'

jest.spyOn(fs, 'readdirSync')
jest.spyOn(fs, 'existsSync')

jest.mock('../src/utils', () => ({
  ...jest.requireActual('../src/utils'),
  existPages: jest.fn(() => true),
}))

jest.mock(
  '../i18n',
  () => ({
    locales: ['en'],
    defaultLocale: 'en',
    pagesInDir: 'src/app',
    pages: {
      '*': ['common'],
    },
  }),
  { virtual: true }
)

describe('nextTranslate', () => {
  describe('nextTranslate -> pagesInDir', () => {
    test('should detect correctly the appFolder and pagesFolder depending on the pagesInDir', () => {
      fs.readdirSync.mockImplementation(() => [])
      fs.existsSync.mockImplementation(() => true)

      const config = nextTranslate({})

      expect(config.webpack({})).toEqual(
        expect.objectContaining({
          module: {
            rules: expect.arrayContaining([
              expect.objectContaining({
                use: expect.objectContaining({
                  loader: 'next-translate-plugin/loader',
                  options: expect.objectContaining({
                    appFolder: 'src/app/',
                    pagesFolder: 'src/pages/',
                    configFileName: 'i18n.json',
                  }),
                }),
              }),
            ]),
          },
        })
      )
    })
  })
  describe('nextTranslate -> turbopack', () => {
    test('should detect correctly the appFolder and pagesFolder depending on the pagesInDir', () => {
      fs.readdirSync.mockImplementation(() => [])
      fs.existsSync.mockImplementation(() => true)

      const config = nextTranslate({}, { turbopack: true })

      expect(config.turbopack).toEqual(
        expect.objectContaining({
          resolveAlias: expect.objectContaining({
            '@next-translate-root/*': './*',
          }),
          rules: expect.objectContaining({
            '*': expect.objectContaining({
              condition: expect.objectContaining({
                all: expect.arrayContaining([
                  expect.objectContaining({
                    path: /\.(tsx|ts|js|mjs|jsx)$/,
                  }),
                ]),
              }),
              loaders: expect.arrayContaining([
                expect.objectContaining({
                  loader: 'next-translate-plugin/loader',
                  options: expect.objectContaining({
                    appFolder: 'src/app/',
                    pagesFolder: 'src/pages/',
                    configFileName: 'i18n.json',
                  }),
                }),
              ]),
            }),
          }),
        })
      )
    })
  })
})

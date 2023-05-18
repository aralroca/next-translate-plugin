import { possiblePagesDirs } from '../src/utils'
import nextTranslate from '../src/index'
import path from 'path'
import fs from 'fs'

jest.spyOn(fs, 'existsSync')
jest.spyOn(fs, 'readdirSync')

const pagesInDirTests = [
  {
    name: 'pagesInDir should become array in loader pagesPaths config',
    pagesInDir: 'src/app',
    pagesPaths: expect.arrayContaining([expect.stringMatching(/src\/app\/$/)]),
  },
  {
    name: 'pagesPaths should be defaulted to possible pages paths if pagesInDir is undefined',
    pagesInDir: undefined,
    pagesPaths: possiblePagesDirs.map((possiblePagesDir) => path.resolve(possiblePagesDir) + '/'),
  },
]

describe('nextTranslate', () => {
  describe('nextTranslate -> pagesInDir', () => {
    beforeEach(() => {
      jest.resetModules()
    })

    pagesInDirTests.forEach(({ name, pagesInDir, pagesPaths }) => {
      test(name, () => {
        fs.readdirSync.mockImplementation(() => [])
        fs.existsSync.mockImplementation(() => true)

        jest.doMock(
          '../i18n',
          () => ({
            locales: ['en'],
            defaultLocale: 'en',
            pagesInDir,
            pages: {
              '*': ['common'],
            },
          }),
          { virtual: true }
        )

        const config = nextTranslate({})

        expect(config.webpack({})).toEqual(
          expect.objectContaining({
            module: {
              rules: expect.arrayContaining([
                expect.objectContaining({
                  use: expect.objectContaining({
                    loader: 'next-translate-plugin/loader',
                    options: expect.objectContaining({ pagesPaths }),
                  }),
                }),
              ]),
            },
          })
        )
      })
    })
  })
})

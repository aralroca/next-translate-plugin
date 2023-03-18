import nextTranslate from '../src/index'
import fs from 'fs'

jest.spyOn(fs, 'existsSync')
jest.spyOn(fs, 'readdirSync')

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
    test('uses app dir loader if pagesInDir points to app dir', () => {
      fs.readdirSync.mockImplementationOnce(() => [])
      fs.existsSync.mockImplementationOnce(() => true)

      const config = nextTranslate({})

      expect(config.webpack({})).toEqual(
        expect.objectContaining({
          module: {
            rules: expect.arrayContaining([
              expect.objectContaining({
                use: expect.objectContaining({
                  loader: 'next-translate-plugin/loader',
                  options: expect.objectContaining({
                    isAppDirNext13: true,
                  }),
                }),
              }),
            ]),
          },
        })
      )
    })
  })
})

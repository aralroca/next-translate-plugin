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
    test.todo('uses app dir loader if pagesInDir points to app dir')
  })
})

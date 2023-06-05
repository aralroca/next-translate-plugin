import { isPageToIgnore, calculatePageDir } from '../src/utils'
import fs from 'fs'
import path from 'path'

jest.spyOn(fs, 'existsSync')

describe('utils', () => {
  describe('utils -> isPageToIgnore', () => {
    const testPath = (path, expected) => {
      const extensions = ['js', 'jsx', 'ts', 'tsx']
      extensions.forEach((extension) => {
        expect(isPageToIgnore(`${path}.${extension}`)).toBe(expected)
      })
    }

    test('should ignore api pages', () => {
      testPath('/api/test', true)
    })

    test('should ignore nested api pages', () => {
      testPath('/api/nested/test', true)
    })

    test('should ignore _document', () => {
      testPath('/_document', true)
    })

    test('should ignore root middleware', () => {
      expect(isPageToIgnore(`/middleware.js`)).toBe(true)
      expect(isPageToIgnore(`/middleware.ts`)).toBe(true)
    })

    test('should ignore _middleware', () => {
      testPath('/_middleware', true)
    })

    test('should ignore nested _middleware', () => {
      testPath('/nested/_middleware', true)
    })

    test('should ignore files in __mocks__ folder', () => {
      testPath('/__mocks__/test', true)
    })

    test('should ignore files in __tests__ folder', () => {
      testPath('/__tests__/test', true)
    })

    test('should ignore .test files', () => {
      testPath('/file.test', true)
    })

    test('should ignore nested .test files', () => {
      testPath('/nested/file.test', true)
    })

    test('should ignore .spec files', () => {
      testPath('/file.spec', true)
    })

    test('should ignore nested .spec files', () => {
      testPath('/nested/file.spec', true)
    })

    test('should does not ignore _app', () => {
      testPath('_app', false)
    })

    test('should does not ignore page files', () => {
      testPath('index', false)
    })

    test('should does not ignore nested page files', () => {
      testPath('/nested/index', false)
    })
  })

  describe('utils -> calculatePageDir', () => {
    test('should detect src/pages', () => {
      const name = 'pages'
      const pagesInDir = undefined
      const dir = path.join('/home/user/project')

      fs.existsSync.mockImplementation((pathname) => pathname === path.join('/home/user/project/src/pages'))

      expect(calculatePageDir(name, pagesInDir, dir)).toBe(path.join('src/pages'))
    })

    test('should detect src/app', () => {
      const name = 'app'
      const pagesInDir = undefined
      const dir = path.join('/home/user/project')

      fs.existsSync.mockImplementation((pathname) => pathname === path.join('/home/user/project/src/app'))

      expect(calculatePageDir(name, pagesInDir, dir)).toBe(path.join('src/app'))
    })

    test('should use the pagesInDir for appDir', () => {
      const name = 'app'
      const dir = path.join('/home/user/project')

      fs.existsSync.mockImplementation((pathname) => pathname === path.join('/home/user/project/somepath/app'))

      expect(calculatePageDir(name, path.join('somepath/pages'), dir)).toBe(path.join('somepath/app'))
      expect(calculatePageDir(name, path.join('somepath/app'), dir)).toBe(path.join('somepath/app'))
    })

    test('should use the pagesInDir for pages folder', () => {
      const name = 'pages'
      const dir = path.join('/home/user/project')

      fs.existsSync.mockImplementation((pathname) => pathname === path.join('/home/user/project/somepath/pages'))

      expect(calculatePageDir(name, path.join('somepath/pages'), dir)).toBe(path.join('somepath/pages'))
      expect(calculatePageDir(name, path.join('somepath/app'), dir)).toBe(path.join('somepath/pages'))
    })
  })
})

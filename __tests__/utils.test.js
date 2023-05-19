import {
  isPageToIgnore,
  determineResourceType,
  possibleAppRouterPagesDirs,
  possiblePageRouterPagesDirs,
  possiblePagesDirs,
} from '../src/utils'
import fs from 'fs'

jest.spyOn(fs, 'readFileSync')

const determineResourceTypeTests = [
  {
    name: 'app router server page',
    paths: possibleAppRouterPagesDirs.map((path) => `${path}/page.tsx`),
    case: 'APP_ROUTER_SERVER_PAGE'
  },
  {
    name: 'app router server layout',
    paths: possibleAppRouterPagesDirs.map((path) => `${path}/layout.tsx`),
    case: 'APP_ROUTER_SERVER_LAYOUT'
  },
  {
    name: 'app router server loading',
    paths: possibleAppRouterPagesDirs.map((path) => `${path}/loading.tsx`),
    case: 'APP_ROUTER_SERVER_LOADING'
  },
  {
    name: 'app router server error',
    paths: possibleAppRouterPagesDirs.map((path) => `${path}/error.tsx`),
    case: 'APP_ROUTER_SERVER_ERROR'
  },

  {
    name: 'app router client page',
    paths: possibleAppRouterPagesDirs.map((path) => `${path}/page.tsx`),
    fsImpl: '"use client"',
    case: 'APP_ROUTER_CLIENT_PAGE'
  },
  {
    name: 'app router client layout',
    paths: possibleAppRouterPagesDirs.map((path) => `${path}/layout.tsx`),
    fsImpl: '"use client"',
    case: 'APP_ROUTER_CLIENT_LAYOUT'
  },
  {
    name: 'app router client loading',
    paths: possibleAppRouterPagesDirs.map((path) => `${path}/loading.tsx`),
    fsImpl: '"use client"',
    case: 'APP_ROUTER_CLIENT_LOADING'
  },
  {
    name: 'app router client error',
    paths: possibleAppRouterPagesDirs.map((path) => `${path}/error.tsx`),
    fsImpl: '"use client"',
    case: 'APP_ROUTER_CLIENT_ERROR'
  },

  {
    name: 'page router page',
    paths: possiblePageRouterPagesDirs.map((path) => `${path}/about/index.tsx`),
    case: 'PAGE_ROUTER_CLIENT_PAGE'
  },

  {
    name: 'server component',
    paths: ['app/components/index.tsx', 'components/index.tsx', 'app/index.tsx'],
    case: 'UNROUTED_SERVER_COMPONENT'
  },
  {
    name: 'client component',
    fsImpl: '"use client"',
    paths: ['app/components/index.tsx', 'components/index.tsx'],
    case: 'UNROUTED_CLIENT_COMPONENT'
  },
]

describe('utils', () => {
  describe('utils -> isPageToIgnore', () => {
    const testPath = (path, expected) => {
      const extensions = ['js', 'jsx', 'ts', 'tsx']
      extensions.forEach((extension) => {
        expect(isPageToIgnore(`${path}.${extension}`)).toBe(expected)
      })
    }

    test('ignores api pages', () => {
      testPath('/api/test', true)
    })

    test('ignores nested api pages', () => {
      testPath('/api/nested/test', true)
    })

    test('ignores _document', () => {
      testPath('/_document', true)
    })

    test('ignores root middleware', () => {
      expect(isPageToIgnore(`/middleware.js`)).toBe(true)
      expect(isPageToIgnore(`/middleware.ts`)).toBe(true)
    })

    test('ignores _middleware', () => {
      testPath('/_middleware', true)
    })

    test('ignores nested _middleware', () => {
      testPath('/nested/_middleware', true)
    })

    test('ignores files in __mocks__ folder', () => {
      testPath('/__mocks__/test', true)
    })

    test('ignores files in __tests__ folder', () => {
      testPath('/__tests__/test', true)
    })

    test('ignores .test files', () => {
      testPath('/file.test', true)
    })

    test('ignores nested .test files', () => {
      testPath('/nested/file.test', true)
    })

    test('ignores .spec files', () => {
      testPath('/file.spec', true)
    })

    test('ignores nested .spec files', () => {
      testPath('/nested/file.spec', true)
    })

    test('does not ignore _app', () => {
      testPath('_app', false)
    })

    test('does not ignore page files', () => {
      testPath('index', false)
    })

    test('does not ignore nested page files', () => {
      testPath('/nested/index', false)
    })
  })

  describe('utils -> determineResourceType', () => {
    determineResourceTypeTests.forEach(({ name, paths, fsImpl = '', case: expectCase }) => {
      test(name, () => {
        fs.readFileSync.mockImplementation(() => fsImpl)

        paths.forEach((path) => {
          const type = determineResourceType({
            normalizedResourcePath: path,
            extensionsRgx: /\.(tsx)$/,
          })
          
          expect(type).toBe(expectCase)
        })
      })
    })
  })
})

import { isPageToIgnore, splitNamespacesChunks } from '../src/utils'

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

  describe('splitNamespacesChunks', () => {
    it('should add splitChunks config to an empty webpack config with namespaces and locales', () => {
      const config = {}
      splitNamespacesChunks(config, {
        namespaces: ['common', 'test'],
        locales: ['en', 'es'],
      })
      expect(config).toEqual({
        optimization: {
          splitChunks: {
            cacheGroups: {
              common_es: {
                test: new RegExp(`locales/es/common.*$`),
                name: 'common_es',
                chunks: 'all',
                enforce: true,
              },
              common_en: {
                test: new RegExp(`locales/en/common.*$`),
                name: 'common_en',
                chunks: 'all',
                enforce: true,
              },
              test_es: {
                test: new RegExp(`locales/es/test.*$`),
                name: 'test_es',
                chunks: 'all',
                enforce: true,
              },
              test_en: {
                test: new RegExp(`locales/en/test.*$`),
                name: 'test_en',
                chunks: 'all',
                enforce: true,
              },
            },
          },
        }
      })
    })

    it('should add splitChunks config with loadLocaleFrom as string', () => {
      const config = {}
      splitNamespacesChunks(config, {
        namespaces: ['common', 'test'],
        locales: ['en', 'es'],
        loadLocaleFrom: 'src/my_locales',
      })
      expect(config).toEqual({
        optimization: {
          splitChunks: {
            cacheGroups: {
              common_es: {
                test: new RegExp(`src/my_locales/es/common.*$`),
                name: 'common_es',
                chunks: 'all',
                enforce: true,
              },
              common_en: {
                test: new RegExp(`src/my_locales/en/common.*$`),
                name: 'common_en',
                chunks: 'all',
                enforce: true,
              },
              test_es: {
                test: new RegExp(`src/my_locales/es/test.*$`),
                name: 'test_es',
                chunks: 'all',
                enforce: true,
              },
              test_en: {
                test: new RegExp(`src/my_locales/en/test.*$`),
                name: 'test_en',
                chunks: 'all',
                enforce: true,
              },
            },
          },
        }
      })
    })

    it('should add splitChunks config with loadLocaleFrom as function that return a string', () => {
      const config = {}
      splitNamespacesChunks(config, {
        namespaces: ['common', 'test'],
        locales: ['en', 'es'],
        loadLocaleFrom: (l, n) => `src/translations/${l}/${n}.json`,
      })
      expect(config).toEqual({
        optimization: {
          splitChunks: {
            cacheGroups: {
              common_es: {
                test: new RegExp(`src/translations/es/common.json.*$`),
                name: 'common_es',
                chunks: 'all',
                enforce: true,
              },
              common_en: {
                test: new RegExp(`src/translations/en/common.json.*$`),
                name: 'common_en',
                chunks: 'all',
                enforce: true,
              },
              test_es: {
                test: new RegExp(`src/translations/es/test.json.*$`),
                name: 'test_es',
                chunks: 'all',
                enforce: true,
              },
              test_en: {
                test: new RegExp(`src/translations/en/test.json.*$`),
                name: 'test_en',
                chunks: 'all',
                enforce: true,
              },
            },
          },
        }
      })
    });

    it('should not execute loadLocaleFrom when is an AsyncFunction and split the defaults chunks', () => {
      const config = {}
      const mockLoadLocaleFrom = jest.fn()
      splitNamespacesChunks(config, {
        namespaces: ['common', 'test'],
        locales: ['en', 'es'],
        loadLocaleFrom: async (l, n) => {
          mockLoadLocaleFrom(l, n)
          return `src/translations/${l}/${n}.json`
        },
      })
      expect(config).toEqual({
        optimization: {
          splitChunks: {
            cacheGroups: {
              common_es: {
                test: new RegExp(`locales/es/common.*$`),
                name: 'common_es',
                chunks: 'all',
                enforce: true,
              },
              common_en: {
                test: new RegExp(`locales/en/common.*$`),
                name: 'common_en',
                chunks: 'all',
                enforce: true,
              },
              test_es: {
                test: new RegExp(`locales/es/test.*$`),
                name: 'test_es',
                chunks: 'all',
                enforce: true,
              },
              test_en: {
                test: new RegExp(`locales/en/test.*$`),
                name: 'test_en',
                chunks: 'all',
                enforce: true,
              },
            },
          },
        }
      })
      expect(mockLoadLocaleFrom).not.toHaveBeenCalled()
    });
  })
})

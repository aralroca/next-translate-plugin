import * as utils from '../src/utils'
import loader from '../src/loader'

jest.spyOn(utils, 'getDefaultExport')
jest.spyOn(utils, 'parseFile')
jest.spyOn(utils, 'interceptExport')
jest.spyOn(utils, 'hasStaticName')
jest.spyOn(utils, 'hasExportName')

const tests = [
  {
    name: 'should use server page loader',
    code: 'export default function App() { return null }',
    file: 'app/page.tsx',
    loaderName: 'loaderName: `${dynamic} (server page)`',
  },
  {
    name: 'should use client page loader',
    code: '"use client"\nexport default function App() { return null }',
    file: 'app/page.tsx',
    loaderName: 'useEffect (client page)',
  },
  {
    name: 'should use client component loader',
    code: '"use client"\nexport default function App() { return null }',
    file: 'app/component.tsx',
    loaderName:
      "const el = [...document.querySelectorAll('#__NEXT_TRANSLATE_DATA__')].slice(-1)[0]",
  },
  {
    name: 'should use legacy page loader with getStaticProps',
    code: 'export default function App() { return null }',
    file: 'pages/index.tsx',
    loaderName: 'async function __Next_Translate__getStaticProps__',
    hasStaticName: (_, name) => name === 'getStaticProps',
  },
  {
    name: 'should use legacy page loader with getServerSideProps',
    code: 'export default function App() { return null }',
    file: 'pages/index.tsx',
    loaderName: 'async function __Next_Translate__getServerSideProps__',
    hasExport: (_, name) => name === 'getServerSideProps',
  },
  {
    name: 'should use legacy page loader with HOC',
    code: 'export default function App() { return null }',
    file: 'pages/index.tsx',
    loaderName: 'export default __appWithI18n(',
    hasStaticName: () => true,
  },
]

describe('nextTranslate', () => {
  describe('nextTranslate -> loader', () => {
    tests.forEach(
      ({
        name,
        code,
        file,
        loaderName,
        hasStaticName = () => false,
        hasExport = () => false,
      }) => {
        test.only(name, async () => {
          utils.getDefaultExport.mockImplementation(() => ({}))
          utils.parseFile.mockImplementation(() => ({
            getCode: jest.fn().mockImplementation(() => code),
          }))
          utils.interceptExport.mockImplementation(() => 'App')
          utils.hasStaticName.mockImplementation(hasStaticName)
          utils.hasExportName.mockImplementation(hasExport)

          const str = loader.call(
            {
              resourcePath: file,
              getOptions: () => ({
                basePath: '',
                pagesPaths: ['app/', 'pages/'],
                hasAppJs: false,
                hasGetInitialPropsOnAppJs: false,
                hasLoadLocaleFrom: false,
                extensionsRgx: utils.loaderTest,
                revalidate: 0,
              }),
            },
            ''
          )
          expect(str).toContain(loaderName)
        })
      }
    )
  })
})

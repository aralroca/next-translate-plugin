import loader from '../src/loader'

const mockTemplateAppDir = jest.fn()
const mockTemplateWithHoc = jest.fn()
const mockTemplateWithLoader = jest.fn()

jest.mock('../src/templateAppDir', () => ({
  __esModule: true,
  default: () => mockTemplateAppDir(),
}))

jest.mock('../src/templateWithHoc', () => ({
  __esModule: true,
  default: () => mockTemplateWithHoc(),
}))

jest.mock('../src/templateWithLoader', () => ({
  __esModule: true,
  default: () => mockTemplateWithLoader(),
}))

const mockHasStaticName = jest.fn()
const mockHasExportName = jest.fn()

jest.mock('../src/utils', () => ({
  __esModule: true,
  ...jest.requireActual('../src/utils'),
  getDefaultExport: () => 'Page',
  hasStaticName: () => mockHasStaticName(),
  hasExportName: (...args) => mockHasExportName(...args),
}))

const config = {
  getOptions: () => ({
    basePath: '',
    pagesFolder: 'pages',
    appFolder: 'app',
  }),
}

describe('loader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return templateAppDir', () => {
    const code = `
      export default function Page() {
        return <h1>Page</h1>
      }
    `
    loader.call({ ...config, resourcePath: 'app/page.ts' }, code)
    expect(mockTemplateAppDir).toBeCalled()
  })

  it('should return templateAppDir for monorepos', () => {
    const code = `
      export default function Page() {
        return <h1>Page</h1>
      }
    `
    loader.call({ ...config, resourcePath: 'apps/web/app/page.ts' }, code)
    expect(mockTemplateAppDir).toBeCalled()
  })

  it('should return templateWithLoader with pages/app', () => {
    const code = `
      export default function Page() {
        return <h1>Page</h1>
      }

      export const getStaticProps = () => ({ props: {} })
    `
    loader.call({ ...config, resourcePath: 'pages/app/some-page.ts' }, code)
    expect(mockTemplateWithLoader).toBeCalled()
  })

  it('should return templateWithLoader with pages/**/app', () => {
    const code = `
      export default function Page() {
        return <h1>Page</h1>
      }

      export const getStaticProps = () => ({ props: {} })
    `
    loader.call({ ...config, resourcePath: 'pages/some/page/app/some-page.ts' }, code)
    expect(mockTemplateWithLoader).toBeCalled()
  })

  it('should return templateWithHoc', () => {
    mockHasStaticName.mockReturnValueOnce(true)
    const code = `
      import withSomeHoc from 'some-hoc'

      export default function Page() {
        return <h1>Page</h1>
      }

      Page.getInitialProps = () => ({ props: {} })
    `
    loader.call({ ...config, resourcePath: 'pages/some-page.ts' }, code)
    expect(mockTemplateWithHoc).toBeCalled()
  })

  it('should return templateWithLoader', () => {
    const code = `
      export default function Page() {
        return <h1>Page</h1>
      }

      export const getStaticProps = () => ({ props: {} })
    `
    loader.call({ ...config, resourcePath: 'pages/some-page.ts' }, code)
    expect(mockTemplateWithLoader).toBeCalled()
  })

  it('should not call any template if a client component inside node_modules', () => {
    const code = `
      "use client";
      
      export default function Page() {
        return <h1>Page</h1>
      }
    `
    loader.call(
      { ...config, resourcePath: 'node_modules/component/some-page.ts' },
      code
    )
    expect(mockTemplateWithLoader).not.toBeCalled()
    expect(mockTemplateWithHoc).not.toBeCalled()
    expect(mockTemplateAppDir).not.toBeCalled()
  })

  it('should not call any template if a component from pages', () => {
    const code = `
      export default function Page() {
        return <h1>Page</h1>
      }
    `
    loader.call({ ...config, resourcePath: 'component/some-page.ts' }, code)
    expect(mockTemplateWithLoader).not.toBeCalled()
    expect(mockTemplateWithHoc).not.toBeCalled()
    expect(mockTemplateAppDir).not.toBeCalled()
  })

  it('should not call any template if is not rawCode', () => {
    mockHasExportName.mockImplementation((_, n) => n === '__N_SSP')
    const code = `
      export default function Page() {
        return <h1>Page</h1>
      }

      export __N_SSP = true
    `
    loader.call({ ...config, resourcePath: 'pages/some-page.ts' }, code)
    expect(mockTemplateWithLoader).not.toBeCalled()
    expect(mockTemplateWithHoc).not.toBeCalled()
    expect(mockTemplateAppDir).not.toBeCalled()
  })
})

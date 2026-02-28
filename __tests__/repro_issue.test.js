import { parseCode, hasExportName } from '../src/utils'

// Related with https://github.com/aralroca/next-translate-plugin/issues/91
describe('repro issue', () => {
  it('should detect re-exported getStaticProps', () => {
    const code = `
      export { getStaticProps } from './data'
      export default function Page() {
        return <h1>Page</h1>
      }
    `
    const pagePkg = parseCode('jsx', code)
    expect(hasExportName(pagePkg, 'getStaticProps')).toBe(true)
  })

  it('should detect re-exported getServerSideProps', () => {
    const code = `
      export { getServerSideProps as GSSP } from './data'
      export default function Page() {
        return <h1>Page</h1>
      }
    `
    const pagePkg = parseCode('jsx', code)
    // Actually hasExportName checks for the name it is exported AS.
    expect(hasExportName(pagePkg, 'GSSP')).toBe(true)
  })

  it('should detect re-exported all from another file', () => {
    const code = `
      export * from './data'
      export default function Page() {
        return <h1>Page</h1>
      }
    `
    const pagePkg = parseCode('jsx', code)
    // If ./data is not resolved, this will fail
    expect(hasExportName(pagePkg, 'getServerSideProps')).toBe(true)
  })

  it('should return false for non-data-fetching methods when export * is present', () => {
    const code = `
      export * from './data'
      export default function Page() {
        return <h1>Page</h1>
      }
    `
    const pagePkg = parseCode('jsx', code)
    expect(hasExportName(pagePkg, 'someOtherExport')).toBe(false)
  })
})

import templateAppDir from '../src/templateAppDir'
import { parseCode } from '../src/utils'
import { clean } from './templateWith.utils'

const insideAppDir = {
  normalizedResourcePath: '/Users/username/Projects/nextjs-blog/app/page.js',
  appFolder: 'app',
}

const outsideAppDir = {
  normalizedResourcePath: '/Users/username/Projects/nextjs-blog/page.js',
  appFolder: 'app',
}

const tests = [
  {
    describe: 'should not transform any page outside app dir',
    code: `
      import useTranslation from 'next-translate/useTranslation'

      export default function Page() {
        const { t, lang } = useTranslation('common')
        return  <h1>{t('title')}</h1>
      }
    `,
    cases: [{ pageNoExt: '/page', ...outsideAppDir }, { pageNoExt: '/page', hasLoadLocaleFrom: true, ...outsideAppDir }, { pageNoExt: '/about/us/page', ...outsideAppDir }],
  },
  {
    describe: 'should load translations in a server page without dynamic export',
    code: `
      import useTranslation from 'next-translate/useTranslation'

      export default function Page() {
        const { t, lang } = useTranslation('common')
        return  <h1>{t('title')}</h1>
      }
    `,
    cases: [{ pageNoExt: '/page', ...insideAppDir }, { pageNoExt: '/page', hasLoadLocaleFrom: true, ...insideAppDir }, { pageNoExt: '/about/us/page', ...insideAppDir }],
  },
  {
    describe: 'should load translations in a server page with dynamic export force-dynamic',
    code: `
      import useTranslation from 'next-translate/useTranslation'

      export const dynamic = 'force-dynamic'

      export default function Page() {
        const { t, lang } = useTranslation('common')
        return  <h1>{t('title')}</h1>
      }
    `,
    cases: [{ pageNoExt: '/page', ...insideAppDir }, { pageNoExt: '/page', hasLoadLocaleFrom: true, ...insideAppDir }, { pageNoExt: '/about/us/page', ...insideAppDir }],
  },
  {
    describe: 'should load translations in a server page with dynamic export force-static',
    code: `
      import useTranslation from 'next-translate/useTranslation'

      export const dynamic = 'force-static'

      export default function Page() {
        const { t, lang } = useTranslation('common')
        return  <h1>{t('title')}</h1>
      }
    `,
    cases: [{ pageNoExt: '/page', ...insideAppDir }, { pageNoExt: '/page', hasLoadLocaleFrom: true, ...insideAppDir }, { pageNoExt: '/about/us/page', ...insideAppDir }],
  },
  {
    describe: 'should load using an useEffect the translations in a client page ("use client" with double quotes and comment before)',
    code: `
      // Some comment before

      /* 
        Another comment before
      */
      "use client"
      import useTranslation from 'next-translate/useTranslation'

      export const dynamic = 'force-static'

      export default function Page() {
        const { t, lang } = useTranslation('common')
        return  <h1>{t('title')}</h1>
      }
    `,
    cases: [{ pageNoExt: '/page', ...insideAppDir }, { pageNoExt: '/page', hasLoadLocaleFrom: true, ...insideAppDir }, { pageNoExt: '/about/us/page', ...insideAppDir }],
  },
  {
    describe: 'should load using an useEffect the translations in a client page (\'use client\` with simple quotes)',
    code: `
      'use client';
      import useTranslation from 'next-translate/useTranslation'

      export const dynamic = 'force-static'

      export default function Page() {
        const { t, lang } = useTranslation('common')
        return  <h1>{t('title')}</h1>
      }
    `,
    cases: [{ pageNoExt: '/page', ...insideAppDir }, { pageNoExt: '/page', hasLoadLocaleFrom: true, ...insideAppDir }, { pageNoExt: '/about/us/page', ...insideAppDir }],
  },
  {
    describe: 'should not do any transformation in a server component (already have the namespaces from the page)',
    code: `
      import useTranslation from 'next-translate/useTranslation'

      export default function Component() {
        const { t, lang } = useTranslation('common')
        return  <h1>{t('title')}</h1>
      }
    `,
    cases: [{ pageNoExt: '/component', ...insideAppDir }, { pageNoExt: '/component', hasLoadLocaleFrom: true, ...insideAppDir }, { pageNoExt: '/about/us/component', ...insideAppDir }],
  },
  {
    describe: 'should hydrate (if is not done yet) the translations in a client component (already have the namespaces from the page)',
    code: `
      "use client"

      import useTranslation from 'next-translate/useTranslation'

      export default function Component() {
        const { t, lang } = useTranslation('common')
        return  <h1>{t('title')}</h1>
      }
    `,
    cases: [{ pageNoExt: '/component', ...insideAppDir }, { pageNoExt: '/component', hasLoadLocaleFrom: true, ...insideAppDir }, { pageNoExt: '/about/us/component', ...insideAppDir }],
  },
]

describe('templateAppDir', () => {
  tests.forEach((d) => {
    describe(d.describe, () => {
      d.cases.forEach(({ expected, debug, ...options }) => {
        const fn = debug ? test.only : test
        const testName = Object.entries(options).map(([k, v]) => `${k}: ${v}`)
        fn(testName.join(' | '), () => {
          Date.now = jest.fn(() => 587764800000)
          expect(
            clean(templateAppDir(parseCode('jsx', d.code), options))
          ).toMatchSnapshot()
        })
      })
    })
  })
})

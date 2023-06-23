import templateAppDir from '../src/templateAppDir'
import { parseCode } from '../src/utils'
import { clean } from './templateWith.utils'

const insideAppDir = pageNoExt => ({
  pageNoExt,
  normalizedResourcePath: `app${pageNoExt}.js`,
  appFolder: 'app',
})

const outsideAppDir = pageNoExt => ({
  pageNoExt,
  normalizedResourcePath: `/components${pageNoExt}.js`,
  appFolder: 'app',
})

const monorepoAppDir = pageNoExt => ({
  pageNoExt,
  normalizedResourcePath: `packages/app${pageNoExt}.js`,
  appFolder: 'app/',
})

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
    cases: [
      outsideAppDir('/page'),
      outsideAppDir('/about/us/page')
    ],
  },
  {
    describe:
      'should load translations in a server page without dynamic export',
    code: `
      import useTranslation from 'next-translate/useTranslation'

      export default function Page() {
        const { t, lang } = useTranslation('common')
        return  <h1>{t('title')}</h1>
      }
    `,
    cases: [
      insideAppDir('/page'),
      monorepoAppDir('/page'),
      insideAppDir('/about/us/page'),
      monorepoAppDir('/about/us/page'),
    ],
  },
  {
    describe:
      'should load translations in a layout',
    code: `
      import useTranslation from 'next-translate/useTranslation'

      export default function Layout() {
        const { t, lang } = useTranslation('common')
        return  <h1>{t('title')}</h1>
      }
    `,
    cases: [
      insideAppDir('/layout'),
      monorepoAppDir('/layout'),
      insideAppDir('/about/us/layout'),
      monorepoAppDir('/about/us/layout'),
    ],
  },
  {
    describe:
      'should load translations in a not-found page',
    code: `
      import useTranslation from 'next-translate/useTranslation'

      export default function NotFound() {
        const { t, lang } = useTranslation('common')
        return  <h1>{t('title')}</h1>
      }
    `,
    cases: [
      insideAppDir('/not-found'),
      monorepoAppDir('/not-found'),
      insideAppDir('/about/us/not-found'),
      monorepoAppDir('/about/us/not-found'),
    ],
  },
  {
    describe:
      'should load translations in a loading page',
    code: `
      import useTranslation from 'next-translate/useTranslation'

      export default function Loading() {
        const { t, lang } = useTranslation('common')
        return  <h1>{t('title')}</h1>
      }
    `,
    cases: [
      insideAppDir('/loading'),
      monorepoAppDir('/loading'),
      insideAppDir('/about/us/loading'),
      monorepoAppDir('/about/us/loading'),
    ],
  },
  {
    describe:
      'should load translations in a error page',
    code: `
      import useTranslation from 'next-translate/useTranslation'

      export default function Error() {
        const { t, lang } = useTranslation('common')
        return  <h1>{t('title')}</h1>
      }
    `,
    cases: [
      insideAppDir('/error'),
      monorepoAppDir('/error'),
      insideAppDir('/about/us/error'),
      monorepoAppDir('/about/us/error'),
    ],
  },
  {
    describe:
      'should load translations in a global-error page',
    code: `
      import useTranslation from 'next-translate/useTranslation'

      export default function GlobalError() {
        const { t, lang } = useTranslation('common')
        return  <h1>{t('title')}</h1>
      }
    `,
    cases: [
      insideAppDir('/global-error'),
      monorepoAppDir('/global-error'),
      insideAppDir('/about/us/global-error'),
      monorepoAppDir('/about/us/global-error'),
    ],
  },
  {
    describe:
      'should load translations in a server page with dynamic export force-dynamic',
    code: `
      import useTranslation from 'next-translate/useTranslation'

      export const dynamic = 'force-dynamic'

      export default function Page() {
        const { t, lang } = useTranslation('common')
        return  <h1>{t('title')}</h1>
      }
    `,
    cases: [
      insideAppDir('/page'),
      monorepoAppDir('/page'),
      insideAppDir('/about/us/page'),
      monorepoAppDir('/about/us/page'),
    ],
  },
  {
    describe:
      'should load translations in a server page with dynamic export force-static',
    code: `
      import useTranslation from 'next-translate/useTranslation'

      export const dynamic = 'force-static'

      export default function Page() {
        const { t, lang } = useTranslation('common')
        return  <h1>{t('title')}</h1>
      }
    `,
    cases: [
      insideAppDir('/page'),
      monorepoAppDir('/page'),
      insideAppDir('/about/us/page'),
      monorepoAppDir('/about/us/page'),
    ],
  },
  {
    describe:
      'should load using an "use" client hook the translations in a client page ("use client" with double quotes and comment before)',
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
    cases: [
      { isClientComponent: true, ...insideAppDir('/page') },
      { isClientComponent: true, ...insideAppDir('/page') },
      { isClientComponent: true, ...insideAppDir('/about/us/page') },
    ],
  },
  {
    describe:
      'should not transform a client component if there are no consuming translations',
    code: `
      // Some comment before

      /* 
        Another comment before
      */
      "use client"

      export default function Component() {
        return  <h1>Should not convert this component</h1>
      }
    `,
    cases: [
      { isClientComponent: true, ...insideAppDir('/component') },
      { isClientComponent: true, ...outsideAppDir('/component') },
      { isClientComponent: true, ...insideAppDir('/about/us/component') },
    ],
  },
  {
    describe:
      "should load using an 'use' client hook the translations in a client page ('use client' with simple quotes)",
    code: `
      'use client';
      import useTranslation from 'next-translate/useTranslation'

      export const dynamic = 'force-static'

      export default function Page() {
        const { t, lang } = useTranslation('common')
        return  <h1>{t('title')}</h1>
      }
    `,
    cases: [
      { isClientComponent: true, ...insideAppDir('/page') },
      { isClientComponent: true, ...insideAppDir('/page') },
      { isClientComponent: true, ...insideAppDir('/about/us/page') },
    ],
  },
  {
    describe:
      'should not do any transformation in a server component (already have the namespaces from the page)',
    code: `
      import useTranslation from 'next-translate/useTranslation'

      export default function Component() {
        const { t, lang } = useTranslation('common')
        return  <h1>{t('title')}</h1>
      }
    `,
    cases: [
      insideAppDir('/component'),
      insideAppDir('/about/us/component'),
    ],
  },
  {
    describe:
      'should load using an "use" client hook the translations in client component (already have the namespaces from the page)',
    code: `
      "use client"

      import useTranslation from 'next-translate/useTranslation'

      export default function Component() {
        const { t, lang } = useTranslation('common')
        return  <h1>{t('title')}</h1>
      }
    `,
    cases: [
      { isClientComponent: true, ...insideAppDir('/component') },
      { isClientComponent: true, ...insideAppDir('/component') },
      {
        ...insideAppDir('/about/us/component'),
        isClientComponent: true,
      },
    ],
  },
  {
    describe:
      'should load using an "use" client hook the translations in a client component with named export (already have the namespaces from the page)',
    code: `
      "use client"

      import useTranslation from 'next-translate/useTranslation'

      export function Component() {
        const { t, lang } = useTranslation('common')
        return  <h1>{t('title')}</h1>
      }
    `,
    cases: [
      { isClientComponent: false, ...insideAppDir('/component') },
      { isClientComponent: true, ...insideAppDir('/component') },
      {
        ...insideAppDir('/about/us/component'),
        isClientComponent: true,
      },
    ],
  },
  {
    describe:
      'should use an empty loader fallback if doesnt have any namespaces inside locales/{lang}/${namespace}',
    code: `
      "use client"

      import useTranslation from 'next-translate/useTranslation'

      export function Component() {
        const { t, lang } = useTranslation('common')
        return  <h1>{t('title')}</h1>
      }
    `,
    cases: [
      { isClientComponent: true, existLocalesFolder: false, ...insideAppDir('/component') },
      {
        ...insideAppDir('/about/us/component'),
        isClientComponent: true,
        existLocalesFolder: false,
      },
    ],
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
            clean(
              templateAppDir(parseCode('jsx', d.code), {
                ...options,
                code: d.code,
              })
            )
          ).toMatchSnapshot()
        })
      })
    })
  })
})

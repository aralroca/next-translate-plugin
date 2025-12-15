import { ParsedFilePkg } from './types'
import {
  interceptExport,
  addLoadLocalesFrom,
  clientLine,
  INTERNAL_CONFIG_KEY,
} from './utils'

const validPages = [
  '/page',
  '/layout',
  '/error',
  '/loading',
  '/not-found',
  '/global-error',
]
const validPagesRegex = new RegExp(`(${validPages.join('|')})$`)

export default function templateAppDir(
  pagePkg: ParsedFilePkg,
  {
    code = '',
    pageNoExt = '/',
    normalizedResourcePath = '',
    appFolder = '',
    isClientComponent = false,
    existLocalesFolder = true,
    configFileName = 'i18n.json',
  } = {}
) {
  const routeType =
    validPages.find((pageName) => pageNoExt.endsWith(pageName)) || 'component'
  const isPage =
    routeType !== 'component' && normalizedResourcePath.includes(appFolder)

  // Ignore files that are not RSC or RCC valid pages
  if (!isPage) return code

  const hash = Date.now().toString(16)
  const pathname = pageNoExt.replace(validPagesRegex, '/')

  // Removes the export default from the page
  // and tells under what name we can get the old export
  const pageVariableName = interceptExport(
    pagePkg,
    'default',
    `__Next_Translate__Page__${hash}__`
  )

  // Client/Server pages without default export should not be transpiled
  if (isPage && !pageVariableName) return code

  // Client pages (RCC)
  if (isClientComponent) {
    return templateRCCPage({
      pagePkg,
      hash,
      pageVariableName,
      pathname,
      routeType,
      existLocalesFolder,
      configFileName,
    })
  }

  // Server pages (RSC)
  return templateRSCPage({
    pagePkg,
    hash,
    pageVariableName,
    pathname,
    routeType,
    existLocalesFolder,
    configFileName,
  })
}

type Params = {
  pagePkg: ParsedFilePkg
  hash: string
  pageVariableName: string
  pathname?: string
  routeType: string
  existLocalesFolder: boolean
  configFileName: string
}

function templateRSCPage({
  pagePkg,
  hash,
  pageVariableName,
  pathname,
  routeType,
  existLocalesFolder,
  configFileName,
}: Params) {
  const code = pagePkg.getCode()

  return `
  import ${INTERNAL_CONFIG_KEY} from '@next-translate-root/${configFileName}'
  import AppDirI18nProvider from 'next-translate/AppDirI18nProvider'
  import __loadNamespaces from 'next-translate/loadNamespaces'

  ${code}

  export default async function __Next_Translate_new__${hash}__(props) {
    const params = await props.params
    const searchParams = await props.searchParams
    const detectedLang = params?.lang ?? searchParams?.lang

    if (detectedLang === 'favicon.ico') return <${pageVariableName} {...props} />

    ${
      routeType !== '/page'
        ? // Related with https://github.com/aralroca/next-translate/issues/1090
          // Early return to avoid conflicts with /layout or /loading that don't have detectedLang
          `if (globalThis.__NEXT_TRANSLATE__ && !detectedLang) return <${pageVariableName} {...props} />`
        : ''
    }
  
    const config = { 
      ...${INTERNAL_CONFIG_KEY},
      locale: detectedLang ?? ${INTERNAL_CONFIG_KEY}.defaultLocale,
      loaderName: 'server ${routeType}',
      pathname: '${pathname}'
    }

    const { __lang, __namespaces } = await __loadNamespaces({ ...config, ${addLoadLocalesFrom(
      existLocalesFolder
    )} });
  
    const oldNamespaces = globalThis.__NEXT_TRANSLATE__?.namespaces ?? {}
    const namespaces = { ...oldNamespaces, ...__namespaces }

    globalThis.__NEXT_TRANSLATE__ = { lang: __lang, namespaces, config }

    return <AppDirI18nProvider lang={__lang} namespaces={namespaces} config={JSON.parse(JSON.stringify(config))}><${pageVariableName} {...props} /></AppDirI18nProvider>
  }
`
}

function templateRCCPage({
  pagePkg,
  hash,
  pageVariableName,
  pathname,
  routeType,
  existLocalesFolder,
  configFileName,
}: Params) {
  const topLine = clientLine[0]
  let clientCode = pagePkg.getCode()

  // Clear current "use client" top line
  clientLine.forEach((line) => {
    clientCode = clientCode.replace(line, '')
  })

  return `${topLine}
  import ${INTERNAL_CONFIG_KEY} from '@next-translate-root/${configFileName}'
  import AppDirI18nProvider from 'next-translate/AppDirI18nProvider'
  import { useSearchParams as __useSearchParams, useParams as __useParams } from 'next/navigation'
  import { use as __use, Suspense as __Suspense } from 'react'
  import __loadNamespaces from 'next-translate/loadNamespaces'

  ${clientCode}

  export default function __Next_Translate_new__${hash}__(props) {
    const searchParams = __useSearchParams()
    const params = __useParams()
    const detectedLang = params.lang ?? searchParams.get('lang')

    if (detectedLang === 'favicon.ico') return <${pageVariableName} {...props} />

    ${
      routeType !== '/page'
        ? // Related with https://github.com/aralroca/next-translate/issues/1090
          // Early return to avoid conflicts with /layout or /loading that don't have detectedLang
          `if (globalThis.__NEXT_TRANSLATE__ && !detectedLang) return <${pageVariableName} {...props} />`
        : ''
    }

    const lang = detectedLang ?? ${INTERNAL_CONFIG_KEY}.defaultLocale
    const config = {
      ...${INTERNAL_CONFIG_KEY},
      locale: lang,
      loaderName: 'client ${routeType}',
      pathname: '${pathname}',
    }

    return (
      <__Suspense fallback={null}>
        <__Next_Translate__child__${hash}__ 
          {...props} 
          config={config} 
          promise={__loadNamespaces({ ...config, ${addLoadLocalesFrom(
            existLocalesFolder
          )} })}
         />
      </__Suspense>
    )
  }

  function __Next_Translate__child__${hash}__({ promise, config, ...props }) {
    const { __lang, __namespaces } = __use(promise);
    const oldNamespaces = globalThis.__NEXT_TRANSLATE__?.namespaces ?? {};
    globalThis.__NEXT_TRANSLATE__ = { lang: __lang, namespaces: { ...oldNamespaces, ...__namespaces }, config };
    return <${pageVariableName} {...props} />;
  }
`
}

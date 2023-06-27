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
  })
}

type Params = {
  pagePkg: ParsedFilePkg
  hash: string
  pageVariableName: string
  pathname?: string
  routeType: string
  existLocalesFolder: boolean
}

function templateRSCPage({
  pagePkg,
  hash,
  pageVariableName,
  pathname,
  routeType,
  existLocalesFolder,
}: Params) {
  const code = pagePkg.getCode()

  return `
  import ${INTERNAL_CONFIG_KEY} from '@next-translate-root/i18n'
  import AppDirI18nProvider from 'next-translate/AppDirI18nProvider'
  import __loadNamespaces from 'next-translate/loadNamespaces'

  ${code}

  export default async function __Next_Translate_new__${hash}__(props) {
    const config = { 
      ...${INTERNAL_CONFIG_KEY},
      locale: props.params?.lang ?? props.searchParams?.lang ?? ${INTERNAL_CONFIG_KEY}.defaultLocale,
      loaderName: 'server ${routeType}',
      pathname: '${pathname}'
    }

    const { __lang, __namespaces } = await __loadNamespaces({ ...config, ${addLoadLocalesFrom(
    existLocalesFolder
  )} });
    globalThis.__NEXT_TRANSLATE__ = { lang: __lang, namespaces: __namespaces, config }

    return <AppDirI18nProvider lang={__lang} namespaces={__namespaces} config={JSON.parse(JSON.stringify(config))}><${pageVariableName} {...props} /></AppDirI18nProvider>
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
}: Params) {
  const topLine = clientLine[0]
  let clientCode = pagePkg.getCode()

  // Clear current "use client" top line
  clientLine.forEach((line) => {
    clientCode = clientCode.replace(line, '')
  })

  return `${topLine}
  import ${INTERNAL_CONFIG_KEY} from '@next-translate-root/i18n'
  import AppDirI18nProvider from 'next-translate/AppDirI18nProvider'
  import { useSearchParams as __useSearchParams, useParams as __useParams } from 'next/navigation'
  import { use as __use } from 'react'
  import __loadNamespaces from 'next-translate/loadNamespaces'

  ${clientCode}

  export default function __Next_Translate_new__${hash}__(props) {
    const searchParams = __useSearchParams()
    const params = __useParams()
    const lang = params.lang ?? searchParams.get('lang') ?? ${INTERNAL_CONFIG_KEY}.defaultLocale
    const config = {
      ...${INTERNAL_CONFIG_KEY},
      locale: lang,
      loaderName: 'client ${routeType}',
      pathname: '${pathname}',
    }

    const { __lang, __namespaces } = __use(__loadNamespaces({ ...config, ${addLoadLocalesFrom(
    existLocalesFolder
  )} }));
    globalThis.__NEXT_TRANSLATE__ = { lang: __lang, namespaces: __namespaces, config }

    return <${pageVariableName} {...props} />
  }
`
}

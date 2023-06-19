import { ParsedFilePkg } from './types'
import {
  interceptExport,
  addLoadLocalesFrom,
  getNamedExport,
  clientLine,
  interceptNamedExportsFromReactComponents,
  INTERNAL_CONFIG_KEY,
} from './utils'

const defaultDynamicExport = `export const dynamic = 'force-dynamic';`
const validPages = ['/page', '/layout', '/error', '/loading', '/not-found', '/global-error']
let lastPathname = ''

export default function templateAppDir(
  pagePkg: ParsedFilePkg,
  {
    code = '',
    pageNoExt = '/',
    normalizedResourcePath = '',
    appFolder = '',
    isClientComponent = false,
  } = {}
) {
  const isPage =
    validPages.some(pageName => pageNoExt.endsWith(pageName)) && normalizedResourcePath.includes(appFolder)

  if (!isPage && !isClientComponent) return code

  const hash = Date.now().toString(16)
  const pathname = isPage ? pageNoExt.replace('/page', '/') : lastPathname

  // For client components we need to remember the pathname of the current page
  lastPathname = pathname

  // Removes the export default from the page
  // and tells under what name we can get the old export
  const pageVariableName = interceptExport(
    pagePkg,
    'default',
    `__Next_Translate__Page__${hash}__`
  )

  if (isPage && !pageVariableName) return code

  // Client server components
  if (isClientComponent) {
    return templateClientComponent({
      pagePkg,
      hash,
      pageVariableName,
      pathname,
      isPage,
    });
  }

  // RSC Pages
  return templateServerPage({
    pagePkg,
    hash,
    pageVariableName,
    pathname,
  })
}

type Params = {
  pagePkg: ParsedFilePkg
  hash: string
  pageVariableName: string
  pathname?: string
  isPage?: boolean
}

function templateServerPage({
  pagePkg,
  hash,
  pageVariableName,
  pathname,
}: Params) {
  const code = pagePkg.getCode()
  const dynamicVariable = getNamedExport(pagePkg, 'dynamic', false)
  const dynamicExport = dynamicVariable ? '' : defaultDynamicExport

  return `
  import ${INTERNAL_CONFIG_KEY} from '@next-translate-root/i18n'
  import __loadNamespaces from 'next-translate/loadNamespaces'
  import __nt_store from 'next-translate/_store'

  ${code}

  ${dynamicExport}

  export default async function __Next_Translate_new__${hash}__(props) {
    const config = { 
      ...${INTERNAL_CONFIG_KEY},
      locale: props.searchParams?.lang ?? props.params?.lang ?? ${INTERNAL_CONFIG_KEY}.defaultLocale,
      loaderName: \`\${dynamic} (server page)\`,
      pathname: '${pathname}',
      ${addLoadLocalesFrom()}
    }
    const { __lang, __namespaces } = await __loadNamespaces(config)

    __nt_store.set({ lang: __lang, namespaces: __namespaces, config })

    return <${pageVariableName} {...props} />
  }
`
}

function templateClientComponent({
  pagePkg,
  hash,
  pageVariableName,
  pathname,
  isPage
}: Params) {
  const topLine = clientLine[0]
  const namedExportsModified = modifyNamedExportsComponents(pagePkg, hash)
  const exportDefault = pageVariableName
    ? "export default " + wrapClientComponent({ name: `__Next_Translate_new__${hash}__`, pathname, isPage, pageVariableName })
    : ''


  let clientCode = pagePkg.getCode()

  // Clear current "use client" top line
  clientLine.forEach((line) => {
    clientCode = clientCode.replace(line, '')
  })

  return `${topLine}
  import ${INTERNAL_CONFIG_KEY} from '@next-translate-root/i18n'
  import __loadNamespaces from 'next-translate/loadNamespaces'
  import __nt_store from 'next-translate/_store'
  import { useSearchParams as __useSearchParams, useParams as __useParams } from 'next/navigation'
  import { use as __use } from 'react';

  ${clientCode}

  ${exportDefault}
  ${namedExportsModified}
`
}

function wrapClientComponent({ name = '', pathname = '', isPage = false, pageVariableName = '' }) {
  return `function ${name}(props) {
    const searchParams = __useSearchParams()
    const params = __useParams()
    const lang = searchParams.get('lang') ?? params.lang ?? ${INTERNAL_CONFIG_KEY}.defaultLocale
    const config = { 
      ...${INTERNAL_CONFIG_KEY},
      locale: lang,
      loaderName: 'client',
      pathname: '${pathname}',
      logBuild: ${isPage},
      ${addLoadLocalesFrom()}
    }
    const { __lang, __namespaces } = __use(__loadNamespaces(config));

    __nt_store.set({ lang, namespaces: __namespaces, config })

    return <${pageVariableName} {...props} />
  }`
}

function modifyNamedExportsComponents(pagePkg: ParsedFilePkg, hash: string) {
  return interceptNamedExportsFromReactComponents(pagePkg, hash)
    .map(
      ({ exportName, defaultLocalName }) => `
    ${wrapClientComponent({ name: defaultLocalName, pathname: lastPathname, isPage: false, pageVariableName: exportName })}
    export { ${defaultLocalName} as ${exportName} }
  `
    )
    .join('')
    .trim()
}

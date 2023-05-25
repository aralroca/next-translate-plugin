import { interceptExport, overwriteLoadLocales, getNamedExport, removeCommentsFromCode, rootLayoutRgx } from "./utils";
import { ParsedFilePkg } from "./types";

const clientLine = ['"use client"', "'use client'"]
const defaultDynamicExport = `export const dynamic = 'force-dynamic';`
const appDirPagesEnding = ['/page', '/layout', '/error', '/loading']

export default function templateAppDir(pagePkg: ParsedFilePkg, { hasLoadLocaleFrom = false, pageNoExt = '/', normalizedResourcePath = '', normalizedPagesPath = '' } = {}) {
  let code = pagePkg.getCode()
  const codeWithoutComments = removeCommentsFromCode(code).trim()
  const isClientCode = clientLine.some(line => codeWithoutComments.startsWith(line))
  const isPage = appDirPagesEnding.some((ending) => pageNoExt.endsWith(ending)) && normalizedResourcePath.startsWith(normalizedPagesPath)

  const isLayout = pageNoExt.endsWith('/layout')
  const isRootLayout = rootLayoutRgx.test(pageNoExt)
  const isLayoutExceptRootLayout = isLayout && !isRootLayout
  const isAppPage = pageNoExt.endsWith('/page')

  if (!isPage && !isClientCode) return code

  const hash = Date.now().toString(16)
  const pathname = pageNoExt.replace('/page', '/')

  // Removes the export default from the page
  // and tells under what name we can get the old export
  const pageVariableName = interceptExport(
    pagePkg,
    'default',
    `__Next_Translate__Page__${hash}__`
  )

  const dynamicVariable = getNamedExport(pagePkg, 'dynamic', false)
  const dynamicExport = dynamicVariable ? '' : defaultDynamicExport;

  if (!pageVariableName) return code

  // Get the new code after intercepting the export
  code = pagePkg.getCode()

  if (isClientCode && !isPage) return templateAppDirClientComponent({ code, hash, pageVariableName })
  if (isClientCode && isPage) return templateAppDirClientPage({ code, hash, pageVariableName, pathname, hasLoadLocaleFrom })

  return `
    import __i18nConfig from '@next-translate-root/i18n'
    import __loadNamespaces from 'next-translate/loadNamespaces'
    ${code}

    globalThis.i18nConfig = __i18nConfig

    ${dynamicExport}

    export default async function __Next_Translate_new__${hash}__(props) {
      let config = { 
        ...__i18nConfig,
        locale: props.params?.lang || props.searchParams?.lang,
        loaderName: \`\${dynamic} (server page)\`,
        pathname: '${pathname}',
        ${overwriteLoadLocales(hasLoadLocaleFrom)}
      }

      const { __lang, __namespaces } = await __loadNamespaces(config)
      ${(isLayout || isAppPage) ? `
        globalThis.__NEXT_TRANSLATE__ = {
          lang: __lang,
          namespaces: globalThis.__NEXT_TRANSLATE__?.lang !== __lang
            ? [__namespaces]
            : [...(globalThis.__NEXT_TRANSLATE__?.namespaces || []), __namespaces],
          pathname: '${pathname}'
        }
      ` : ''}

      return (
        <>
          ${(isLayoutExceptRootLayout || isAppPage) ? (`
            <div 
              id="__NEXT_TRANSLATE_DATA__" 
              data-lang={__lang} 
              data-ns={JSON.stringify(__namespaces)}
              data-pathname="${pathname}"
            />
          `) : ''}
          <${pageVariableName} {...props} />
        </>
      )
    }
`
}

type ClientTemplateParams = { code: string, hash: string, pageVariableName: string, pathname?: string, hasLoadLocaleFrom?: boolean }

function templateAppDirClientComponent({ code, hash, pageVariableName }: ClientTemplateParams) {
  let clientCode = code
  const topLine = clientLine[0]

  // Clear current "use client" top line
  clientLine.forEach(line => { clientCode = clientCode.replace(line, '') })

  return `${topLine}
    import __i18nConfig from '@next-translate-root/i18n'
    import * as __react from 'react'

    ${clientCode}

    export default function __Next_Translate_new__${hash}__(props) {
      const forceUpdate = __react.useReducer(() => [])[1]
      const isClient = typeof window !== 'undefined'

      if (isClient && !globalThis.__NEXT_TRANSLATE__) {
        update(false)
      }

      if (isClient && !window.i18nConfig) {
        window.i18nConfig = __i18nConfig
      }

      __react.useEffect(update)

      function update(rerender = true) {
        const el = [...document.querySelectorAll('#__NEXT_TRANSLATE_DATA__')].slice(-1)[0]

        if (!el) return

        if (!globalThis.__NEXT_TRANSLATE__) {
          globalThis.__NEXT_TRANSLATE__ = { lang: __i18nConfig.defaultLocale, namespaces: {} }
        }

        const { lang, ns, pathname } = el.dataset
        const shouldRerender = lang !== globalThis.__NEXT_TRANSLATE__.lang || pathname !== globalThis.__NEXT_TRANSLATE__.pathname
        globalThis.__NEXT_TRANSLATE__ = { lang, namespaces: JSON.parse(ns), pathname }
        if (shouldRerender && rerender) {
          forceUpdate()
        }
      }

      return <${pageVariableName} {...props} />
    }
  `
}

function templateAppDirClientPage({ code, hash, pageVariableName, pathname, hasLoadLocaleFrom }: ClientTemplateParams) {
  let clientCode = code
  const topLine = clientLine[0]

  // Clear current "use client" top line
  clientLine.forEach(line => { clientCode = clientCode.replace(line, '') })

  return `${topLine}
    import __i18nConfig from '@next-translate-root/i18n'
    import __loadNamespaces, { log as __log } from 'next-translate/loadNamespaces'
    import { useSearchParams as __useSearchParams } from 'next/navigation'
    import * as __react from 'react'

    ${clientCode}

    export default function __Next_Translate_new__${hash}__(props) {
      const forceUpdate = __react.useReducer(() => [])[1]
      const lang = props.params?.lang || __useSearchParams().get('lang')
      const pathname = '${pathname}'
      const isServer = typeof window === 'undefined'
      const config = { 
        ...__i18nConfig,
        locale: lang,
        loaderName: 'useEffect (client page)',
        pathname,
        ${overwriteLoadLocales(hasLoadLocaleFrom!)}
      }

      __react.useEffect(() => {
        const shouldLoad = lang !== globalThis.__NEXT_TRANSLATE__?.lang || pathname !== globalThis.__NEXT_TRANSLATE__?.pathname

        if (!shouldLoad) return

        __loadNamespaces(config).then(({ __lang, __namespaces }) => {
          globalThis.__NEXT_TRANSLATE__ = { lang: __lang, namespaces: __namespaces, pathname: '${pathname}' }
          globalThis.i18nConfig = __i18nConfig
          forceUpdate()
        })
      }, [lang])

      if (isServer) __log(config, { page: pathname, lang, namespaces: ['calculated in client-side'] })
      if (isServer || !globalThis.__NEXT_TRANSLATE__) return null

      return <${pageVariableName} {...props} />
    }
  `
}

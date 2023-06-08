import { ParsedFilePkg } from "./types";
import { interceptExport, overwriteLoadLocales, getNamedExport, clientLine, interceptNamedExportsFromReactComponents } from "./utils";

const defaultDynamicExport = `export const dynamic = 'force-dynamic';`

export default function templateAppDir(pagePkg: ParsedFilePkg, { hasLoadLocaleFrom = false, pageNoExt = '/', normalizedResourcePath = '', appFolder = '', isClientComponent = false } = {}) {
  let code = pagePkg.getCode()
  const isPage = pageNoExt.endsWith('/page') && normalizedResourcePath.startsWith(appFolder)

  if (!isPage && !isClientComponent) return code

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

  if (isPage && !pageVariableName) return code

  // Get the new code after intercepting the export
  code = pagePkg.getCode()

  if (isClientComponent && !isPage) return templateAppDirClientComponent({ pagePkg, code, hash, pageVariableName })
  if (isClientComponent && isPage) return templateAppDirClientPage({ pagePkg, code, hash, pageVariableName, pathname, hasLoadLocaleFrom })

  return `
    import __i18nConfig from '@next-translate-root/i18n'
    import __loadNamespaces from 'next-translate/loadNamespaces'
    ${code}

    globalThis.i18nConfig = __i18nConfig

    ${dynamicExport}

    export default async function __Next_Translate_new__${hash}__(props) {
      let config = { 
        ...__i18nConfig,
        locale: props.searchParams?.lang,
        loaderName: \`\${dynamic} (server page)\`,
        pathname: '${pathname}',
        ${overwriteLoadLocales(hasLoadLocaleFrom)}
      }
  
      if (!globalThis.__NEXT_TRANSLATE__) {
        globalThis.__NEXT_TRANSLATE__ = {}
      }
  
      const { __lang, __namespaces } = await __loadNamespaces(config)
      globalThis.__NEXT_TRANSLATE__ = { lang: __lang, namespaces: __namespaces, pathname: '${pathname}' }

      return (
        <>
          <div 
            id="__NEXT_TRANSLATE_DATA__" 
            data-lang={__lang} 
            data-ns={JSON.stringify(__namespaces)}
            data-pathname="${pathname}"
          />
          <${pageVariableName} {...props} />
        </>
      )
    }
`
}

type ClientTemplateParams = { pagePkg: ParsedFilePkg, code: string, hash: string, pageVariableName: string, pathname?: string, hasLoadLocaleFrom?: boolean }

function templateAppDirClientComponent({ pagePkg, hash, pageVariableName }: ClientTemplateParams) {
  const topLine = clientLine[0]
  const namedExports = interceptNamedExportsFromReactComponents(pagePkg, hash)
  let clientCode = pagePkg.getCode()

  // Clear current "use client" top line
  clientLine.forEach(line => { clientCode = clientCode.replace(line, '') })

  const wrapComponent = (exportName: string, defaultLocalName: string, exportDefault = true) => `
    ${exportDefault ? 'export default' : ''} function ${defaultLocalName}(props) {
      const forceUpdate = __react.useReducer(() => [])[1]
      const isClient = typeof window !== 'undefined'

      if (isClient && !window.__NEXT_TRANSLATE__) {
        window.__NEXT_TRANSLATE__ = { lang: __i18nConfig.defaultLocale, namespaces: {} }
        update(false)
      }

      if (isClient && !window.i18nConfig) {
        window.i18nConfig = __i18nConfig
      }

      __react.useEffect(update)

      function update(rerender = true) {
        const el = document.getElementById('__NEXT_TRANSLATE_DATA__')

        if (!el) return

        const { lang, ns, pathname } = el.dataset
        const shouldRerender = lang !== window.__NEXT_TRANSLATE__.lang || pathname !== window.__NEXT_TRANSLATE__.pathname
        window.__NEXT_TRANSLATE__ = { lang, namespaces: JSON.parse(ns), pathname }
        if (shouldRerender && rerender) forceUpdate()
      }

      return <${exportName} {...props} />
    }
    ${exportDefault ? '' : `export { ${defaultLocalName} as ${exportName} }`}
  `

  const defaultExportModified = pageVariableName ? wrapComponent(pageVariableName, `__Next_Translate_new__${hash}__`) : ''
  const namedExportsModified = namedExports.map(({ exportName, defaultLocalName }) => wrapComponent(exportName, defaultLocalName, false)).join('\n')

  return `${topLine}
    import __i18nConfig from '@next-translate-root/i18n'
    import * as __react from 'react'

    ${clientCode}

    ${defaultExportModified}

    ${namedExportsModified}
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
      const lang = __useSearchParams().get('lang')
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
        const shouldLoad = lang !== window.__NEXT_TRANSLATE__?.lang || pathname !== window.__NEXT_TRANSLATE__?.pathname

        if (!shouldLoad) return

        __loadNamespaces(config).then(({ __lang, __namespaces }) => {
          window.__NEXT_TRANSLATE__ = { lang: __lang, namespaces: __namespaces, pathname: '${pathname}' }
          window.i18nConfig = __i18nConfig
          forceUpdate()
        })
      }, [lang])

      if (isServer) __log(config, { page: pathname, lang, namespaces: ['calculated in client-side'] })
      if (isServer || !window.__NEXT_TRANSLATE__) return null

      return <${pageVariableName} {...props} />
    }
  `
}

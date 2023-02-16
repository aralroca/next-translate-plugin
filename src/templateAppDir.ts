import { ParsedFilePkg } from "./types";
import { interceptExport, overwriteLoadLocales } from "./utils";

const clientLine = ['"use client"', "'use client'"]

// TODO:
// - Si és una page en clientside, que utilitzi un dynamic import y el fallback sigui el loading (si te, sino buit)
export default function templateAppDir(pagePkg: ParsedFilePkg, { hasLoadLocaleFrom = false, pageNoExt = '/' } = {}) {
  if (!pageNoExt.endsWith('/page')) return pagePkg.getCode();

  const hash = Date.now().toString(16)
  const pathname = pageNoExt.replace('/page', '/')

  // Removes the export default from the page
  // and tells under what name we can get the old export
  const pageVariableName = interceptExport(
    pagePkg,
    'default',
    `__Next_Translate__Page__${hash}__`
  )

  if (!pageVariableName) return pagePkg.getCode();

  let code = pagePkg.getCode();
  const isClientCode = clientLine.some(line => code.startsWith(line))
  const topLine = isClientCode ? clientLine[0] : ''

  if (isClientCode) {
    clientLine.forEach(line => {
      code = code.replace(line, '')
    })
  }

  const loadNsInServer = isClientCode ? '' : `
    let config = { 
      ...__i18nConfig,
      locale: props.searchParams?.lang,
      loaderName: 'appDir',
      pathname: '${pathname}',
      ${overwriteLoadLocales(hasLoadLocaleFrom)}
    }

    if (!globalThis.__NEXT_TRANSLATE__) {
      globalThis.__NEXT_TRANSLATE__ = {}
    }

    const { __lang, __namespaces } = await __loadNamespaces(config)
    globalThis.__NEXT_TRANSLATE__ = {[__lang]:__namespaces}
  `

  const hydrateNamespaces = isClientCode ? '' : `<div key={'${pathname}'+__lang} dangerouslySetInnerHTML={{ 
    __html: '<img src onerror="window.__NEXT_TRANSLATE__=' + JSON.stringify({[__lang]:__namespaces}).replace(/\"/g,'&quot;') + ';window.i18nConfig='+JSON.stringify(__i18nConfig).replace(/\"/g,'&quot;')+'"/>'
    }}
  />`

  return `${topLine}
    import __i18nConfig from '@next-translate-root/i18n'
    import __loadNamespaces from 'next-translate/loadNamespaces'
    ${code}

    globalThis.i18nConfig = __i18nConfig

    export default ${isClientCode ? '' : 'async'} function __Next_Translate_new__${hash}__(props) {
      ${loadNsInServer}
      return (
        <>
          ${hydrateNamespaces}
          <${pageVariableName} {...props} />
        </>
      )
    }
`
}

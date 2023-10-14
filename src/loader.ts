import type webpack from 'webpack'
import path from 'path'

import templateWithHoc from './templateWithHoc'
import templateWithLoader from './templateWithLoader'
import templateAppDir from './templateAppDir'
import type { LoaderOptions } from './types'
import ts from 'typescript'

import {
  parseFile,
  getDefaultAppJs,
  getDefaultExport,
  hasExportName,
  hasStaticName,
  isPageToIgnore,
  hasHOC,
  removeCommentsFromCode,
  clientLine,
  isInsideAppDir,
} from './utils'

const REGEX_STARTS_WITH_APP = /\/+_app.*/

export default function loader(
  this: webpack.LoaderContext<LoaderOptions>,
  rawCode: string
) {
  const {
    basePath,
    pagesFolder,
    appFolder,
    hasAppJs,
    hasGetInitialPropsOnAppJs,
    extensionsRgx,
    revalidate,
    existLocalesFolder,
  } = this.getOptions()
  try {
    const codeWithoutComments = removeCommentsFromCode(rawCode).trim()
    const normalizedResourcePath = path
      .join(path.relative(basePath, this.resourcePath))
      .replace(/\\/g, '/')

    const isNextInternal = normalizedResourcePath.includes(
      'node_modules/next/dist/'
    )

    const isClientComponent =
      !isNextInternal &&
      clientLine.some((line) => codeWithoutComments.startsWith(line))

    const shouldUseTemplateAppDir =
      isClientComponent ||
      isInsideAppDir(normalizedResourcePath, appFolder, pagesFolder)

    const pagesPath = (
      shouldUseTemplateAppDir ? appFolder : pagesFolder
    ) as string

    // In case that there aren't /_app.js we want to overwrite the default _app
    // to provide the I18Provider on top.
    if (
      !hasAppJs &&
      normalizedResourcePath.includes('node_modules/next/dist/pages/_app')
    ) {
      const transpileTsx = (tsCode: string) => {
        const result = ts.transpileModule(tsCode, {
          compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            outDir: './lib/cjs',
            declaration: false,
            declarationDir: undefined,
            jsx: ts.JsxEmit.React,
          },
        })

        return result.outputText
      }

      const jsCode = transpileTsx(getDefaultAppJs(existLocalesFolder))
      return jsCode
    }

    // Skip node_modules
    if (normalizedResourcePath.includes('node_modules/')) return rawCode

    // Skip rest of files that are not inside /pages and is not detected as appDir.
    // In /pages dir we only need to transform pages and always are inside the /pages folder.
    // However, for /app dir we also need to transform the client components and these can be
    // outside the /app folder.
    if (!shouldUseTemplateAppDir && !normalizedResourcePath.includes(pagesPath))
      return rawCode

    const page = normalizedResourcePath.replace(pagesPath, '/')
    const pageNoExt = page.replace(extensionsRgx, '')
    const pagePkg = parseFile(basePath, normalizedResourcePath)

    // Skip any transformation if the page is not in raw code
    // Fixes issues with Nx:
    // - https://github.com/aralroca/next-translate/issues/677
    // - https://github.com/aralroca/next-translate-plugin/issues/28
    if (
      hasExportName(pagePkg, '__N_SSP') ||
      hasExportName(pagePkg, '__N_SSG')
    ) {
      return rawCode
    }

    // In case the page is inside the app folder, we need to use the template
    // for pages (default export) and client components (default export or named export)
    if (shouldUseTemplateAppDir) {
      return templateAppDir(pagePkg, {
        pageNoExt,
        normalizedResourcePath,
        appFolder,
        isClientComponent,
        code: rawCode,
        existLocalesFolder,
      })
    }

    const defaultExport = getDefaultExport(pagePkg)

    // Skip any transformation if for some reason they forgot to write the
    // "export default" on the page
    if (!defaultExport) return rawCode

    // In case there is a getInitialProps in _app it means that we can
    // reuse the existing getInitialProps on the top to load the namespaces.
    //
    // - Wrapping the _app.js with the HoC appWithI18n from next-translate
    // - Do not make any transformation in the rest of the pages
    //
    // This way, the only modified file has to be the _app.js.
    if (hasGetInitialPropsOnAppJs) {
      return REGEX_STARTS_WITH_APP.test(pageNoExt)
        ? templateWithHoc(pagePkg, { existLocalesFolder })
        : rawCode
    }

    // In case the _app does not have getInitialProps, we can add only the
    // I18nProvider to ensure that translations work inside _app.js
    if (REGEX_STARTS_WITH_APP.test(pageNoExt)) {
      return templateWithHoc(pagePkg, {
        skipInitialProps: true,
        existLocalesFolder,
      })
    }

    // There are some files that although they are inside pages, are not pages:
    // _app, _document, /api... In that case, let's skip any transformation :)
    if (isPageToIgnore(page)) return rawCode

    // This is where the most complicated part is, since to support automatic page
    // optimization what we do is use:
    //
    // - getStaticProps by default
    // - Use an existing page loader. For example if the page already uses
    //   getServerSideProps, in this case we need to overwrite it.
    // - getServerSideProps for [dynamic] pages and [..catchall] @todo Review if
    //   is possible to change it to getStaticProps + getStaticPaths
    // - getInitialProps when the page uses an external HoC (not the
    //   withTranslation HoC).
    //   This is in order to avoid issues because the getInitialProps is the only
    //   one that can be overwritten on a HoC.
    // Use getInitialProps to load the namespaces
    const isWrapperWithExternalHOC = hasHOC(pagePkg)
    const isDynamicPage = page.includes('[')
    const isGetStaticProps = hasExportName(pagePkg, 'getStaticProps')
    const isGetStaticPaths = hasExportName(pagePkg, 'getStaticPaths')
    const isGetServerSideProps = hasExportName(pagePkg, 'getServerSideProps')
    const isGetInitialProps = hasStaticName(
      pagePkg,
      defaultExport,
      'getInitialProps'
    )

    const hasLoader =
      isGetStaticProps || isGetServerSideProps || isGetInitialProps

    if (isGetInitialProps || (!hasLoader && isWrapperWithExternalHOC)) {
      return templateWithHoc(pagePkg, { existLocalesFolder })
    }

    const loader =
      isGetServerSideProps || (!hasLoader && isDynamicPage && !isGetStaticPaths)
        ? 'getServerSideProps'
        : 'getStaticProps'

    return templateWithLoader(pagePkg, {
      page: pageNoExt,
      loader,
      revalidate,
      existLocalesFolder,
    })
  } catch (e) {
    console.error('next-translate-plugin ERROR', e)
    return rawCode
  }
}

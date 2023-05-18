import fs from 'fs'
import path from 'path'
import type webpack from 'webpack'
import type { NextConfig } from 'next'

import {
  getDefaultExport,
  hasHOC,
  hasStaticName,
  parseFile,
  possiblePagesDirs,
} from './utils'
import { LoaderOptions } from './types'
import type { I18nConfig, NextI18nConfig } from 'next-translate'

const test = /\.(tsx|ts|js|mjs|jsx)$/

function nextTranslate(nextConfig: NextConfig = {}): NextConfig {
  const basePath = pkgDir()

  // NEXT_TRANSLATE_PATH env is supported both relative and absolute path
  const dir = path.resolve(
    path.relative(basePath, process.env.NEXT_TRANSLATE_PATH || '.')
  )

  const nextConfigI18n: NextI18nConfig = nextConfig.i18n || {}
  let {
    locales = nextConfigI18n.locales || [],
    defaultLocale = nextConfigI18n.defaultLocale || 'en',
    domains = nextConfigI18n.domains,
    localeDetection = nextConfigI18n.localeDetection,
    loader = true,
    pagesInDir,
    ...restI18n
  } = require(path.join(dir, 'i18n')) as I18nConfig

  let nextConfigWithI18n: NextConfig = {
    ...nextConfig,
    i18n: {
      locales,
      defaultLocale,
      domains,
      localeDetection,
    },
  }

  let hasGetInitialPropsOnAppJs = false

  const pagesInDirs = pagesInDir
    ? [pagesInDir]
    : possiblePagesDirs.filter((possiblePagesDir) =>
        fs.existsSync(path.join(dir, possiblePagesDir))
      )

  if (!pagesInDirs.length) {
    // Pages folder not found, so we're not using the loader
    return nextConfigWithI18n
  }

  const pagesPaths = pagesInDirs.map((pagesInDir) => path.join(dir, pagesInDir))
  const app = pagesPaths
    .filter((pagePath) => pagePath.endsWith('/pages'))
    .map((pagePath) => {
      const appPagePath = fs
        .readdirSync(pagePath)
        .find((page) => page.startsWith('_app.'))
      return appPagePath && path.join(pagePath, appPagePath)
    })
    .find(Boolean)

  if (app) {
    const appPkg = parseFile(dir, app)
    const defaultExport = getDefaultExport(appPkg)

    if (defaultExport) {
      const isGetInitialProps = hasStaticName(
        appPkg,
        defaultExport,
        'getInitialProps'
      )
      hasGetInitialPropsOnAppJs = isGetInitialProps || hasHOC(appPkg)
    }
  }

  return {
    ...nextConfigWithI18n,
    webpack(conf: webpack.Configuration, options) {
      const config: webpack.Configuration =
        typeof nextConfig.webpack === 'function'
          ? nextConfig.webpack(conf, options)
          : conf

      // Creating some "slots" if they don't exist
      if (!config.resolve) config.resolve = {}
      if (!config.module) config.module = {}
      if (!config.module.rules) config.module.rules = []

      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        '@next-translate-root': path.resolve(dir),
      }

      // we give the opportunity for people to use next-translate without altering
      // any document, allowing them to manually add the necessary helpers on each
      // page to load the namespaces.
      if (!loader) return config

      config.module.rules.push({
        test,
        use: {
          loader: 'next-translate-plugin/loader',
          options: {
            basePath,
            pagesPaths: pagesPaths.map((pagePath) => path.join(pagePath, '/')),
            hasAppJs: Boolean(app),
            hasGetInitialPropsOnAppJs,
            hasLoadLocaleFrom: typeof restI18n.loadLocaleFrom === 'function',
            extensionsRgx: restI18n.extensionsRgx || test,
            revalidate: restI18n.revalidate || 0,
          } as LoaderOptions,
        },
      })

      return config
    },
  }
}

function pkgDir() {
  try {
    return (require('pkg-dir').sync() as string) || process.cwd()
  } catch (e) {
    return process.cwd()
  }
}

module.exports = nextTranslate
export default nextTranslate

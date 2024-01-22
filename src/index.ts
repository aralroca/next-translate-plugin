import fs from 'fs'
import path from 'path'
import type webpack from 'webpack'
import type { NextConfig } from 'next'

import {
  getDefaultExport,
  hasHOC,
  hasStaticName,
  parseFile,
  calculatePageDir,
  existPages,
  existLocalesFolderWithNamespaces,
} from './utils'
import { LoaderOptions } from './types'
import type { I18nConfig, NextI18nConfig } from 'next-translate'

const test = /\.(tsx|ts|js|mjs|jsx)$/

function nextTranslate(nextConfig: NextConfig = {}): NextConfig {
  let basePath = pkgDir()

  // NEXT_TRANSLATE_PATH env is supported both relative and absolute path
  basePath = path.resolve(
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
    extensionsRgx = test,
    revalidate = 0,
  } = require(path.join(basePath, 'i18n')) as I18nConfig

  const pagesFolder = calculatePageDir('pages', pagesInDir, basePath)
  const appFolder = calculatePageDir('app', pagesInDir, basePath)
  const existLocalesFolder = existLocalesFolderWithNamespaces(basePath)
  const existPagesFolder = existPages(basePath, pagesFolder)
  let hasGetInitialPropsOnAppJs = false
  let hasAppJs = false

  // Pages folder not found, so we're not using the loader
  if (!existPagesFolder && !existPages(basePath, appFolder)) {
    return nextConfig
  }

  if (existPagesFolder) {
    const pagesPath = path.join(basePath, pagesFolder)
    const app = fs
      .readdirSync(pagesPath)
      .find((page) => page.startsWith('_app.'))

    if (app) {
      const appPkg = parseFile(basePath, path.join(pagesPath, app))
      const defaultExport = getDefaultExport(appPkg)

      hasAppJs = true

      if (defaultExport) {
        const isGetInitialProps = hasStaticName(
          appPkg,
          defaultExport,
          'getInitialProps'
        )
        hasGetInitialPropsOnAppJs = isGetInitialProps || hasHOC(appPkg)
      }
    }
  }

  let nextConfigWithI18n: NextConfig = hasAppJs ? nextConfig : {
    ...nextConfig,
    i18n: {
      locales,
      defaultLocale,
      domains,
      localeDetection,
    },
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
        '@next-translate-root': path.resolve(basePath),
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
            // Normalize slashes in a file path to be posix/unix-like forward slashes
            pagesFolder: path.join(pagesFolder, '/').replace(/\\/g, '/'),
            appFolder: path.join(appFolder, '/').replace(/\\/g, '/'),
            hasAppJs,
            hasGetInitialPropsOnAppJs,
            extensionsRgx,
            revalidate,
            existLocalesFolder,
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

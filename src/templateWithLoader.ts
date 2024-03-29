import {
  interceptExport,
  addLoadLocalesFrom,
  INTERNAL_CONFIG_KEY,
} from './utils'
import { ParsedFilePkg } from './types'

export default function templateWithLoader(
  pagePkg: ParsedFilePkg,
  {
    page = '',
    loader = 'getStaticProps',
    revalidate = 0,
    existLocalesFolder = true,
  } = {}
) {
  // Random string based on current time
  const hash = Date.now().toString(16)

  // Removes export modifiers from the loader, if any,
  // and tells under what name we can get it
  const oldLoaderName = interceptExport(
    pagePkg,
    loader,
    `__Next_Translate_old_${loader}__${hash}__`
  )

  const newLoaderName = `__Next_Translate__${loader}__${hash}__`
  const hasLoader = Boolean(oldLoaderName)

  return `
    import ${INTERNAL_CONFIG_KEY} from '@next-translate-root/i18n'
    import __loadNamespaces from 'next-translate/loadNamespaces'
    ${pagePkg.getCode()}
    async function ${newLoaderName}(ctx) {
      ${hasLoader ? `const res = await ${oldLoaderName}(ctx)` : ''}
      return {
        ${hasLoader && revalidate > 0 ? `revalidate: ${revalidate},` : ''}
        ${hasLoader ? '...res,' : ''}
        props: {
          ${hasLoader ? '...(res.props || {}),' : ''}
          ...(await __loadNamespaces({
            ...ctx,
            ...${INTERNAL_CONFIG_KEY},
            pathname: '${page}',
            loaderName: '${loader}',
            ${addLoadLocalesFrom(existLocalesFolder)}
          }))
        }
      }
    }
    export { ${newLoaderName} as ${loader} }
  `
}

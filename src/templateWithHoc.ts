import {
  INTERNAL_CONFIG_KEY,
  interceptExport,
  addLoadLocalesFrom,
} from './utils'
import { ParsedFilePkg } from './types'

export default function templateWithHoc(
  pagePkg: ParsedFilePkg,
  {
    skipInitialProps = false,
    existLocalesFolder = true,
    configFileName = 'i18n.json',
  } = {}
) {
  // Random string based on current time
  const hash = Date.now().toString(16)

  // Removes export modifiers from the page
  // and tells under what name we can get the old export
  const pageVariableName = interceptExport(
    pagePkg,
    'default',
    `__Next_Translate__Page__${hash}__`
  )

  // Do not process code if there is no default export
  const hasDefaultExport = Boolean(pageVariableName)
  if (!hasDefaultExport) return pagePkg.getCode()

  return `
    import ${INTERNAL_CONFIG_KEY} from '@next-translate-root/${configFileName}'
    import __appWithI18n from 'next-translate/appWithI18n'
    ${pagePkg.getCode()}
    export default __appWithI18n(${pageVariableName}, {
      ...${INTERNAL_CONFIG_KEY},
      isLoader: true,
      skipInitialProps: ${skipInitialProps},
      ${addLoadLocalesFrom(existLocalesFolder)}
    });
  `
}

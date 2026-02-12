import type ts from 'typescript'

export interface NextTranslatePluginOptions {
  turbopack?: boolean
}

export interface LoaderOptions {
  basePath: string
  pagesFolder: string
  appFolder: string
  hasAppJs: boolean
  hasGetInitialPropsOnAppJs: boolean
  extensionsRgx: RegExp | string
  revalidate: number
  existLocalesFolder: boolean
  configFileName: string
}

export type Transformer = (
  rootNode: ts.SourceFile,
  context: ts.TransformationContext
) => ts.SourceFile

export interface ParsedFilePkg {
  program: ts.Program
  checker: ts.TypeChecker
  sourceFile: ts.SourceFile
  fileSymbol?: ts.Symbol
  transform: (transformer: Transformer) => void
  getCode: () => string
}

import type ts from 'typescript'

export interface LoaderOptions {
  basePath: string
  pagesPath: string
  hasAppJs: boolean
  hasGetInitialPropsOnAppJs: boolean
  hasLoadLocaleFrom: boolean
  extensionsRgx: RegExp
  revalidate: number
  isAppDirNext13: boolean
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

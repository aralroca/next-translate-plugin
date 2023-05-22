import type ts from 'typescript'

export interface LoaderOptions {
  basePath: string
  pagesPaths: string[]
  hasAppJs: boolean
  hasGetInitialPropsOnAppJs: boolean
  hasLoadLocaleFrom: boolean
  extensionsRgx: RegExp
  revalidate: number
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

export type RouterType = 'APP_ROUTER' | 'PAGE_ROUTER' | 'UNROUTED'
export type SideType = 'SERVER' | 'CLIENT'
export type ComponentType = 'PAGE' | 'LAYOUT' | 'ERROR' | 'LOADING' | 'COMPONENT'
export type ResourceType = Exclude<
  `${RouterType}_${SideType}_${ComponentType}`,
  // Here we exclude some non sense types
  // It doesn't make sense to rave unrouted page, layout, error & loading
  | `UNROUTED_${SideType}_${Exclude<ComponentType, 'COMPONENT'>}`
  // It doesn't make sense to have routed components
  | `APP_ROUTER_${SideType}_COMPONENT`
  | `PAGE_ROUTER_${SideType}_COMPONENT`
  // Page Router only includes client page
  | `PAGE_ROUTER_SERVER_${ComponentType}`
  | `PAGE_ROUTER_CLIENT_${Exclude<ComponentType, 'PAGE'>}`
>

export interface DetermineResourceTypeParams {
  normalizedResourcePath: string
  extensionsRgx: RegExp
  basePath?: string
}

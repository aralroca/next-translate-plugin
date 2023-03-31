import templateWithHoc from './templateWithHoc';
import templateWithLoader from './templateWithLoader';
import { parseFile, getDefaultAppJs, getDefaultExport, hasExportName, hasStaticName, isPageToIgnore, hasHOC, } from './utils';
import templateAppDir from './templateAppDir';
export default function loader(rawCode) {
    var _a = this.getOptions(), basePath = _a.basePath, pagesPath = _a.pagesPath, hasAppJs = _a.hasAppJs, hasGetInitialPropsOnAppJs = _a.hasGetInitialPropsOnAppJs, hasLoadLocaleFrom = _a.hasLoadLocaleFrom, extensionsRgx = _a.extensionsRgx, revalidate = _a.revalidate, isAppDirNext13 = _a.isAppDirNext13, forceStatic = _a.forceStatic;
    var normalizedPagesPath = pagesPath.replace(/\\/g, '/');
    var normalizedResourcePath = this.resourcePath.replace(/\\/g, '/');
    if (normalizedResourcePath.includes('node_modules/next/dist/pages/_app')) {
        if (hasAppJs)
            return rawCode;
        return getDefaultAppJs(hasLoadLocaleFrom);
    }
    if (!isAppDirNext13 && !normalizedResourcePath.startsWith(normalizedPagesPath))
        return rawCode;
    var page = normalizedResourcePath.replace(normalizedPagesPath, '/');
    var pageNoExt = page.replace(extensionsRgx, '');
    var pagePkg = parseFile(basePath, normalizedResourcePath);
    var defaultExport = getDefaultExport(pagePkg);
    if (!defaultExport)
        return rawCode;
    if (isAppDirNext13) {
        return templateAppDir(pagePkg, { hasLoadLocaleFrom: hasLoadLocaleFrom, pageNoExt: pageNoExt, normalizedResourcePath: normalizedResourcePath, normalizedPagesPath: normalizedPagesPath });
    }
    if (hasExportName(pagePkg, '__N_SSP') || hasExportName(pagePkg, '__N_SSG')) {
        return rawCode;
    }
    if (hasGetInitialPropsOnAppJs) {
        return pageNoExt === '/_app'
            ? templateWithHoc(pagePkg, { hasLoadLocaleFrom: hasLoadLocaleFrom })
            : rawCode;
    }
    if (pageNoExt === '/_app') {
        return templateWithHoc(pagePkg, {
            skipInitialProps: true,
            hasLoadLocaleFrom: hasLoadLocaleFrom,
        });
    }
    if (isPageToIgnore(page))
        return rawCode;
    if (forceStatic) {
        return templateWithLoader(pagePkg, {
            page: pageNoExt,
            loader: 'getStaticProps',
            hasLoadLocaleFrom: hasLoadLocaleFrom,
            revalidate: revalidate,
        });
    }
    var isWrapperWithExternalHOC = hasHOC(pagePkg);
    var isDynamicPage = page.includes('[');
    var isGetStaticProps = hasExportName(pagePkg, 'getStaticProps');
    var isGetStaticPaths = hasExportName(pagePkg, 'getStaticPaths');
    var isGetServerSideProps = hasExportName(pagePkg, 'getServerSideProps');
    var isGetInitialProps = hasStaticName(pagePkg, defaultExport, 'getInitialProps');
    var hasLoader = isGetStaticProps || isGetServerSideProps || isGetInitialProps;
    if (isGetInitialProps || (!hasLoader && isWrapperWithExternalHOC)) {
        return templateWithHoc(pagePkg, { hasLoadLocaleFrom: hasLoadLocaleFrom });
    }
    var loader = isGetServerSideProps || (!hasLoader && isDynamicPage && !isGetStaticPaths)
        ? 'getServerSideProps'
        : 'getStaticProps';
    return templateWithLoader(pagePkg, {
        page: pageNoExt,
        loader: loader,
        hasLoadLocaleFrom: hasLoadLocaleFrom,
        revalidate: revalidate,
    });
}

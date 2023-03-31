"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var templateWithHoc_1 = __importDefault(require("./templateWithHoc"));
var templateWithLoader_1 = __importDefault(require("./templateWithLoader"));
var utils_1 = require("./utils");
var templateAppDir_1 = __importDefault(require("./templateAppDir"));
function loader(rawCode) {
    var _a = this.getOptions(), basePath = _a.basePath, pagesPath = _a.pagesPath, hasAppJs = _a.hasAppJs, hasGetInitialPropsOnAppJs = _a.hasGetInitialPropsOnAppJs, hasLoadLocaleFrom = _a.hasLoadLocaleFrom, extensionsRgx = _a.extensionsRgx, revalidate = _a.revalidate, isAppDirNext13 = _a.isAppDirNext13, forceStatic = _a.forceStatic;
    var normalizedPagesPath = pagesPath.replace(/\\/g, '/');
    var normalizedResourcePath = this.resourcePath.replace(/\\/g, '/');
    if (normalizedResourcePath.includes('node_modules/next/dist/pages/_app')) {
        if (hasAppJs)
            return rawCode;
        return (0, utils_1.getDefaultAppJs)(hasLoadLocaleFrom);
    }
    if (!isAppDirNext13 && !normalizedResourcePath.startsWith(normalizedPagesPath))
        return rawCode;
    var page = normalizedResourcePath.replace(normalizedPagesPath, '/');
    var pageNoExt = page.replace(extensionsRgx, '');
    var pagePkg = (0, utils_1.parseFile)(basePath, normalizedResourcePath);
    var defaultExport = (0, utils_1.getDefaultExport)(pagePkg);
    if (!defaultExport)
        return rawCode;
    if (isAppDirNext13) {
        return (0, templateAppDir_1.default)(pagePkg, { hasLoadLocaleFrom: hasLoadLocaleFrom, pageNoExt: pageNoExt, normalizedResourcePath: normalizedResourcePath, normalizedPagesPath: normalizedPagesPath });
    }
    if ((0, utils_1.hasExportName)(pagePkg, '__N_SSP') || (0, utils_1.hasExportName)(pagePkg, '__N_SSG')) {
        return rawCode;
    }
    if (hasGetInitialPropsOnAppJs) {
        return pageNoExt === '/_app'
            ? (0, templateWithHoc_1.default)(pagePkg, { hasLoadLocaleFrom: hasLoadLocaleFrom })
            : rawCode;
    }
    if (pageNoExt === '/_app') {
        return (0, templateWithHoc_1.default)(pagePkg, {
            skipInitialProps: true,
            hasLoadLocaleFrom: hasLoadLocaleFrom,
        });
    }
    if ((0, utils_1.isPageToIgnore)(page))
        return rawCode;
    if (forceStatic) {
        return (0, templateWithLoader_1.default)(pagePkg, {
            page: pageNoExt,
            loader: 'getStaticProps',
            hasLoadLocaleFrom: hasLoadLocaleFrom,
            revalidate: revalidate,
        });
    }
    var isWrapperWithExternalHOC = (0, utils_1.hasHOC)(pagePkg);
    var isDynamicPage = page.includes('[');
    var isGetStaticProps = (0, utils_1.hasExportName)(pagePkg, 'getStaticProps');
    var isGetStaticPaths = (0, utils_1.hasExportName)(pagePkg, 'getStaticPaths');
    var isGetServerSideProps = (0, utils_1.hasExportName)(pagePkg, 'getServerSideProps');
    var isGetInitialProps = (0, utils_1.hasStaticName)(pagePkg, defaultExport, 'getInitialProps');
    var hasLoader = isGetStaticProps || isGetServerSideProps || isGetInitialProps;
    if (isGetInitialProps || (!hasLoader && isWrapperWithExternalHOC)) {
        return (0, templateWithHoc_1.default)(pagePkg, { hasLoadLocaleFrom: hasLoadLocaleFrom });
    }
    var loader = isGetServerSideProps || (!hasLoader && isDynamicPage && !isGetStaticPaths)
        ? 'getServerSideProps'
        : 'getStaticProps';
    return (0, templateWithLoader_1.default)(pagePkg, {
        page: pageNoExt,
        loader: loader,
        hasLoadLocaleFrom: hasLoadLocaleFrom,
        revalidate: revalidate,
    });
}
exports.default = loader;

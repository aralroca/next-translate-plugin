"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
function templateWithLoader(pagePkg, _a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.page, page = _c === void 0 ? '' : _c, _d = _b.loader, loader = _d === void 0 ? 'getStaticProps' : _d, _e = _b.revalidate, revalidate = _e === void 0 ? 0 : _e, _f = _b.hasLoadLocaleFrom, hasLoadLocaleFrom = _f === void 0 ? false : _f, _g = _b.isDynamicPage, isDynamicPage = _g === void 0 ? false : _g, _h = _b.isGetStaticPaths, isGetStaticPaths = _h === void 0 ? false : _h;
    var hash = Date.now().toString(16);
    var oldLoaderName = (0, utils_1.interceptExport)(pagePkg, loader, "__Next_Translate_old_".concat(loader, "__").concat(hash, "__"));
    var newLoaderName = "__Next_Translate__".concat(loader, "__").concat(hash, "__");
    var hasLoader = Boolean(oldLoaderName);
    return "\n    import __i18nConfig from '@next-translate-root/i18n'\n    import __loadNamespaces from 'next-translate/loadNamespaces'\n    ".concat(pagePkg.getCode(), "\n    async function ").concat(newLoaderName, "(ctx) {\n      ").concat(hasLoader ? "const res = await ".concat(oldLoaderName, "(ctx)") : '', "\n      return {\n        ").concat(hasLoader && revalidate > 0 ? "revalidate: ".concat(revalidate, ",") : '', "\n        ").concat(hasLoader ? '...res,' : '', "\n        props: {\n          ").concat(hasLoader ? '...(res.props || {}),' : '', "\n          ...(await __loadNamespaces({\n            ...ctx,\n            ...__i18nConfig,\n            pathname: '").concat(page, "',\n            loaderName: '").concat(loader, "',\n            ").concat((0, utils_1.overwriteLoadLocales)(hasLoadLocaleFrom), "\n          }))\n        }\n      }\n    }\n    export { ").concat(newLoaderName, " as ").concat(loader, " }\n\n    ").concat(loader === 'getStaticProps' && isDynamicPage && !isGetStaticPaths ?
        "export const getStaticPaths = () => {\n      return {\n        paths: [],\n        fallback: true,\n      };\n    };"
        : '', "\n  ");
}
exports.default = templateWithLoader;

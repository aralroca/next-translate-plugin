import { interceptExport, overwriteLoadLocales } from './utils';
export default function templateWithHoc(pagePkg, _a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.skipInitialProps, skipInitialProps = _c === void 0 ? false : _c, _d = _b.hasLoadLocaleFrom, hasLoadLocaleFrom = _d === void 0 ? false : _d;
    var hash = Date.now().toString(16);
    var pageVariableName = interceptExport(pagePkg, 'default', "__Next_Translate__Page__".concat(hash, "__"));
    var hasDefaultExport = Boolean(pageVariableName);
    if (!hasDefaultExport)
        return pagePkg.getCode();
    return "\n    import __i18nConfig from '@next-translate-root/i18n'\n    import __appWithI18n from 'next-translate/appWithI18n'\n    ".concat(pagePkg.getCode(), "\n    export default __appWithI18n(").concat(pageVariableName, ", {\n      ...__i18nConfig,\n      isLoader: true,\n      skipInitialProps: ").concat(skipInitialProps, ",\n      ").concat(overwriteLoadLocales(hasLoadLocaleFrom), "\n    });\n  ");
}
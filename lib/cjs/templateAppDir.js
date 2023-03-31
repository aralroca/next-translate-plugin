"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var clientLine = ['"use client"', "'use client'"];
var defaultDynamicExport = "export const dynamic = 'force-dynamic';";
function templateAppDir(pagePkg, _a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.hasLoadLocaleFrom, hasLoadLocaleFrom = _c === void 0 ? false : _c, _d = _b.pageNoExt, pageNoExt = _d === void 0 ? '/' : _d, _e = _b.normalizedResourcePath, normalizedResourcePath = _e === void 0 ? '' : _e, _f = _b.normalizedPagesPath, normalizedPagesPath = _f === void 0 ? '' : _f;
    var code = pagePkg.getCode();
    var codeWithoutComments = (0, utils_1.removeCommentsFromCode)(code).trim();
    var isClientCode = clientLine.some(function (line) { return codeWithoutComments.startsWith(line); });
    var isPage = pageNoExt.endsWith('/page') && normalizedResourcePath.startsWith(normalizedPagesPath);
    if (!isPage && !isClientCode)
        return code;
    var hash = Date.now().toString(16);
    var pathname = pageNoExt.replace('/page', '/');
    var pageVariableName = (0, utils_1.interceptExport)(pagePkg, 'default', "__Next_Translate__Page__".concat(hash, "__"));
    var dynamicVariable = (0, utils_1.getNamedExport)(pagePkg, 'dynamic', false);
    var dynamicExport = dynamicVariable ? '' : defaultDynamicExport;
    if (!pageVariableName)
        return code;
    code = pagePkg.getCode();
    if (isClientCode && !isPage)
        return templateAppDirClientComponent({ code: code, hash: hash, pageVariableName: pageVariableName });
    if (isClientCode && isPage)
        return templateAppDirClientPage({ code: code, hash: hash, pageVariableName: pageVariableName, pathname: pathname, hasLoadLocaleFrom: hasLoadLocaleFrom });
    return "\n    import __i18nConfig from '@next-translate-root/i18n'\n    import __loadNamespaces from 'next-translate/loadNamespaces'\n    ".concat(code, "\n\n    globalThis.i18nConfig = __i18nConfig\n\n    ").concat(dynamicExport, "\n\n    export default async function __Next_Translate_new__").concat(hash, "__(props) {\n      let config = { \n        ...__i18nConfig,\n        locale: props.searchParams?.lang,\n        loaderName: `${dynamic} (server page)`,\n        pathname: '").concat(pathname, "',\n        ").concat((0, utils_1.overwriteLoadLocales)(hasLoadLocaleFrom), "\n      }\n  \n      if (!globalThis.__NEXT_TRANSLATE__) {\n        globalThis.__NEXT_TRANSLATE__ = {}\n      }\n  \n      const { __lang, __namespaces } = await __loadNamespaces(config)\n      globalThis.__NEXT_TRANSLATE__ = { lang: __lang, namespaces: __namespaces, pathname: '").concat(pathname, "' }\n\n      return (\n        <>\n          <div \n            id=\"__NEXT_TRANSLATE_DATA__\" \n            data-lang={__lang} \n            data-ns={JSON.stringify(__namespaces)}\n            data-pathname=\"").concat(pathname, "\"\n          />\n          <").concat(pageVariableName, " {...props} />\n        </>\n      )\n    }\n");
}
exports.default = templateAppDir;
function templateAppDirClientComponent(_a) {
    var code = _a.code, hash = _a.hash, pageVariableName = _a.pageVariableName;
    var clientCode = code;
    var topLine = clientLine[0];
    clientLine.forEach(function (line) { clientCode = clientCode.replace(line, ''); });
    return "".concat(topLine, "\n    import __i18nConfig from '@next-translate-root/i18n'\n    import * as __react from 'react'\n\n    ").concat(clientCode, "\n\n    export default function __Next_Translate_new__").concat(hash, "__(props) {\n      const forceUpdate = __react.useReducer(() => [])[1]\n      const isClient = typeof window !== 'undefined'\n\n      if (isClient && !window.__NEXT_TRANSLATE__) {\n        window.__NEXT_TRANSLATE__ = { lang: __i18nConfig.defaultLocale, namespaces: {} }\n        update(false)\n      }\n\n      if (isClient && !window.i18nConfig) {\n        window.i18nConfig = __i18nConfig\n      }\n\n      __react.useEffect(update)\n\n      function update(rerender = true) {\n        const el = document.getElementById('__NEXT_TRANSLATE_DATA__')\n\n        if (!el) return\n\n        const { lang, ns, pathname } = el.dataset\n        const shouldRerender = lang !== window.__NEXT_TRANSLATE__.lang || pathname !== window.__NEXT_TRANSLATE__.pathname\n        window.__NEXT_TRANSLATE__ = { lang, namespaces: JSON.parse(ns), pathname }\n        if (shouldRerender && rerender) forceUpdate()\n      }\n\n      return <").concat(pageVariableName, " {...props} />\n    }\n  ");
}
function templateAppDirClientPage(_a) {
    var code = _a.code, hash = _a.hash, pageVariableName = _a.pageVariableName, pathname = _a.pathname, hasLoadLocaleFrom = _a.hasLoadLocaleFrom;
    var clientCode = code;
    var topLine = clientLine[0];
    clientLine.forEach(function (line) { clientCode = clientCode.replace(line, ''); });
    return "".concat(topLine, "\n    import __i18nConfig from '@next-translate-root/i18n'\n    import __loadNamespaces, { log as __log } from 'next-translate/loadNamespaces'\n    import { useSearchParams as __useSearchParams } from 'next/navigation'\n    import * as __react from 'react'\n\n    ").concat(clientCode, "\n\n    export default function __Next_Translate_new__").concat(hash, "__(props) {\n      const forceUpdate = __react.useReducer(() => [])[1]\n      const lang = __useSearchParams().get('lang')\n      const pathname = '").concat(pathname, "'\n      const isServer = typeof window === 'undefined'\n      const config = { \n        ...__i18nConfig,\n        locale: lang,\n        loaderName: 'useEffect (client page)',\n        pathname,\n        ").concat((0, utils_1.overwriteLoadLocales)(hasLoadLocaleFrom), "\n      }\n\n      __react.useEffect(() => {\n        const shouldLoad = lang !== window.__NEXT_TRANSLATE__?.lang || pathname !== window.__NEXT_TRANSLATE__?.pathname\n\n        if (!shouldLoad) return\n\n        __loadNamespaces(config).then(({ __lang, __namespaces }) => {\n          window.__NEXT_TRANSLATE__ = { lang: __lang, namespaces: __namespaces, pathname: '").concat(pathname, "' }\n          window.i18nConfig = __i18nConfig\n          forceUpdate()\n        })\n      }, [lang])\n\n      if (isServer) __log(config, { page: pathname, lang, namespaces: ['calculated in client-side'] })\n      if (isServer || !window.__NEXT_TRANSLATE__) return null\n\n      return <").concat(pageVariableName, " {...props} />\n    }\n  ");
}

"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var utils_1 = require("./utils");
var test = /\.(tsx|ts|js|mjs|jsx)$/;
var appDirNext13 = [
    'app',
    'src/app',
    'app/app',
    'integrations/app'
];
var possiblePageDirs = [
    'pages',
    'src/pages',
    'app/pages',
    'integrations/pages',
];
function nextTranslate(nextConfig) {
    var _a;
    if (nextConfig === void 0) { nextConfig = {}; }
    var basePath = pkgDir();
    var isAppDirNext13 = (_a = nextConfig.experimental) === null || _a === void 0 ? void 0 : _a.appDir;
    var dirs = isAppDirNext13 ? appDirNext13 : possiblePageDirs;
    var dir = path_1.default.resolve(path_1.default.relative(basePath, process.env.NEXT_TRANSLATE_PATH || '.'));
    var nextConfigI18n = nextConfig.i18n || {};
    var _b = require(path_1.default.join(dir, 'i18n')), _c = _b.locales, locales = _c === void 0 ? nextConfigI18n.locales || [] : _c, _d = _b.defaultLocale, defaultLocale = _d === void 0 ? nextConfigI18n.defaultLocale || 'en' : _d, _e = _b.domains, domains = _e === void 0 ? nextConfigI18n.domains : _e, _f = _b.localeDetection, localeDetection = _f === void 0 ? nextConfigI18n.localeDetection : _f, _g = _b.loader, loader = _g === void 0 ? true : _g, pagesInDir = _b.pagesInDir, restI18n = __rest(_b, ["locales", "defaultLocale", "domains", "localeDetection", "loader", "pagesInDir"]);
    var nextConfigWithI18n = __assign(__assign({}, nextConfig), { i18n: {
            locales: locales,
            defaultLocale: defaultLocale,
            domains: domains,
            localeDetection: localeDetection,
        } });
    var hasGetInitialPropsOnAppJs = false;
    if (!pagesInDir) {
        for (var _i = 0, dirs_1 = dirs; _i < dirs_1.length; _i++) {
            var possiblePageDir = dirs_1[_i];
            if (fs_1.default.existsSync(path_1.default.join(dir, possiblePageDir))) {
                pagesInDir = possiblePageDir;
                break;
            }
        }
    }
    if (!pagesInDir || !fs_1.default.existsSync(path_1.default.join(dir, pagesInDir))) {
        return nextConfigWithI18n;
    }
    var pagesPath = path_1.default.join(dir, pagesInDir);
    var app = fs_1.default.readdirSync(pagesPath).find(function (page) { return page.startsWith('_app.'); });
    if (app) {
        var appPkg = (0, utils_1.parseFile)(dir, path_1.default.join(pagesPath, app));
        var defaultExport = (0, utils_1.getDefaultExport)(appPkg);
        if (defaultExport) {
            var isGetInitialProps = (0, utils_1.hasStaticName)(appPkg, defaultExport, 'getInitialProps');
            hasGetInitialPropsOnAppJs = isGetInitialProps || (0, utils_1.hasHOC)(appPkg);
        }
    }
    return __assign(__assign({}, nextConfigWithI18n), { webpack: function (conf, options) {
            var config = typeof nextConfig.webpack === 'function'
                ? nextConfig.webpack(conf, options)
                : conf;
            if (!config.resolve)
                config.resolve = {};
            if (!config.module)
                config.module = {};
            if (!config.module.rules)
                config.module.rules = [];
            config.resolve.alias = __assign(__assign({}, (config.resolve.alias || {})), { '@next-translate-root': path_1.default.resolve(dir) });
            if (!loader)
                return config;
            config.module.rules.push({
                test: test,
                use: {
                    loader: 'next-translate-plugin/loader',
                    options: {
                        basePath: basePath,
                        pagesPath: path_1.default.join(pagesPath, '/'),
                        hasAppJs: Boolean(app),
                        hasGetInitialPropsOnAppJs: hasGetInitialPropsOnAppJs,
                        hasLoadLocaleFrom: typeof restI18n.loadLocaleFrom === 'function',
                        extensionsRgx: restI18n.extensionsRgx || test,
                        revalidate: restI18n.revalidate || 0,
                        forceStatic: !!restI18n.forceStatic,
                        isAppDirNext13: isAppDirNext13,
                    },
                },
            });
            return config;
        } });
}
function pkgDir() {
    try {
        return require('pkg-dir').sync() || process.cwd();
    }
    catch (e) {
        return process.cwd();
    }
}
module.exports = nextTranslate;
exports.default = nextTranslate;

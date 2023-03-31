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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeCommentsFromCode = exports.interceptExport = exports.isNotExportModifier = exports.hasHOC = exports.isPageToIgnore = exports.hasStaticName = exports.getStaticName = exports.hasExportName = exports.getDefaultExport = exports.getNamedExport = exports.resolveIdentifier = exports.resolveParenthesis = exports.getImportedNames = exports.getSymbol = exports.parseCode = exports.parseFile = exports.getFilePkg = exports.getTsCompilerOptions = exports.overwriteLoadLocales = exports.getDefaultAppJs = exports.defaultLoader = void 0;
var typescript_1 = __importDefault(require("typescript"));
var specFileOrFolderRgx = /(__mocks__|__tests__)|(\.(spec|test)\.(tsx|ts|js|jsx)$)/;
exports.defaultLoader = '(l, n) => import(`@next-translate-root/locales/${l}/${n}`).then(m => m.default)';
function getDefaultAppJs(hasLoadLocaleFrom) {
    return "\n    import i18nConfig from '@next-translate-root/i18n'\n    import appWithI18n from 'next-translate/appWithI18n'\n  \n    function MyApp({ Component, pageProps }) {\n      return <Component {...pageProps} />\n    }\n  \n    export default appWithI18n(MyApp, {\n      ...i18nConfig,\n      skipInitialProps: true,\n      isLoader: true,\n      ".concat(overwriteLoadLocales(hasLoadLocaleFrom), "\n    })\n  ");
}
exports.getDefaultAppJs = getDefaultAppJs;
function overwriteLoadLocales(hasLoadLocaleFrom) {
    if (hasLoadLocaleFrom)
        return '';
    return "loadLocaleFrom: ".concat(exports.defaultLoader, ",");
}
exports.overwriteLoadLocales = overwriteLoadLocales;
function getTsCompilerOptions(basePath, cutDependencies) {
    if (cutDependencies === void 0) { cutDependencies = false; }
    var options;
    var configPath = typescript_1.default.findConfigFile(basePath, typescript_1.default.sys.fileExists, 'tsconfig.json');
    if (!configPath) {
        options = { allowJs: true };
    }
    else {
        var readConfigFileResult = typescript_1.default.readConfigFile(configPath, typescript_1.default.sys.readFile);
        var jsonConfig = readConfigFileResult.config;
        var convertResult = typescript_1.default.convertCompilerOptionsFromJson(jsonConfig.compilerOptions, basePath);
        options = convertResult.options;
    }
    if (cutDependencies) {
        options = __assign(__assign({}, options), { types: [], noResolve: true, noLib: true });
    }
    return options;
}
exports.getTsCompilerOptions = getTsCompilerOptions;
function getFilePkg(program, filename) {
    var checker = program.getTypeChecker();
    var sourceFile = program.getSourceFile(filename);
    var printer = typescript_1.default.createPrinter({ newLine: typescript_1.default.NewLineKind.LineFeed });
    var fileSymbol = checker.getSymbolAtLocation(sourceFile);
    var filePkg;
    function transform(transformer) {
        var sourceFile = filePkg.sourceFile;
        var transformationResult = typescript_1.default.transform(sourceFile, [
            function (context) { return function (sourceFile) { return transformer(sourceFile, context); }; },
        ]);
        filePkg.sourceFile = transformationResult.transformed[0];
        filePkg.fileSymbol = checker.getSymbolAtLocation(filePkg.sourceFile);
    }
    function getCode() {
        var sourceFile = filePkg.sourceFile;
        return printer.printNode(typescript_1.default.EmitHint.Unspecified, sourceFile, sourceFile);
    }
    filePkg = { program: program, checker: checker, sourceFile: sourceFile, fileSymbol: fileSymbol, transform: transform, getCode: getCode };
    return filePkg;
}
exports.getFilePkg = getFilePkg;
function parseFile(basePath, filename) {
    var options = getTsCompilerOptions(basePath, true);
    var program = typescript_1.default.createProgram([filename], options);
    return getFilePkg(program, filename);
}
exports.parseFile = parseFile;
function parseCode(format, code) {
    var options = getTsCompilerOptions('/', true);
    var host = typescript_1.default.createCompilerHost(options);
    var filename = "source.".concat(format);
    host.getSourceFile = function (fileName) {
        return typescript_1.default.createSourceFile(fileName, code, typescript_1.default.ScriptTarget.Latest);
    };
    var program = typescript_1.default.createProgram([filename], options, host);
    return getFilePkg(program, filename);
}
exports.parseCode = parseCode;
function getSymbol(filePkg, node) {
    var location = typescript_1.default.isVariableDeclaration(node) ? node.name : node;
    return filePkg.checker.getSymbolAtLocation(location);
}
exports.getSymbol = getSymbol;
function getImportedNames(filePkg, moduleName) {
    var importClause = filePkg.sourceFile.forEachChild(function (node) {
        if (typescript_1.default.isImportDeclaration(node)) {
            if (node.moduleSpecifier.getText().slice(1, -1) === moduleName) {
                return node.importClause;
            }
        }
        return undefined;
    });
    if (importClause) {
        var exportedNamesToImported_1 = new Map();
        if (importClause.name) {
            exportedNamesToImported_1.set('default', importClause.name);
        }
        if (importClause.namedBindings) {
            importClause.namedBindings.forEachChild(function (node) {
                if (typescript_1.default.isImportSpecifier(node)) {
                    if (node.propertyName) {
                        exportedNamesToImported_1.set(node.propertyName.getText(), node.name);
                    }
                    else {
                        exportedNamesToImported_1.set(node.name.getText(), node.name);
                    }
                }
            });
        }
        return exportedNamesToImported_1;
    }
    return undefined;
}
exports.getImportedNames = getImportedNames;
function resolveParenthesis(filePkg, parenthesizedExpression) {
    var content = parenthesizedExpression.expression;
    if (typescript_1.default.isParenthesizedExpression(content)) {
        return resolveParenthesis(filePkg, content);
    }
    else {
        return content;
    }
}
exports.resolveParenthesis = resolveParenthesis;
function resolveIdentifier(filePkg, identifier) {
    var identifierSymbol = getSymbol(filePkg, identifier);
    if (identifierSymbol && Array.isArray(identifierSymbol.declarations)) {
        var identifierDeclaration = identifierSymbol.declarations[0];
        if (typescript_1.default.isVariableDeclaration(identifierDeclaration)) {
            var initializer = identifierDeclaration.initializer;
            if (initializer && typescript_1.default.isParenthesizedExpression(initializer)) {
                initializer = resolveParenthesis(filePkg, initializer);
            }
            if (initializer && typescript_1.default.isIdentifier(initializer)) {
                return resolveIdentifier(filePkg, initializer);
            }
        }
        return identifierDeclaration;
    }
    return identifier;
}
exports.resolveIdentifier = resolveIdentifier;
function getNamedExport(filePkg, name, resolveExport) {
    if (resolveExport === void 0) { resolveExport = true; }
    var checker = filePkg.checker, fileSymbol = filePkg.fileSymbol;
    var exportContent;
    if (fileSymbol) {
        var exportSymbol = checker.tryGetMemberInModuleExports(name, fileSymbol);
        if (exportSymbol && Array.isArray(exportSymbol.declarations)) {
            var exportDeclaration = exportSymbol.declarations[0];
            if (resolveExport && typescript_1.default.isExportAssignment(exportDeclaration)) {
                exportContent = exportDeclaration.expression;
                if (typescript_1.default.isParenthesizedExpression(exportContent)) {
                    exportContent = resolveParenthesis(filePkg, exportContent);
                }
                if (typescript_1.default.isIdentifier(exportContent)) {
                    exportContent = resolveIdentifier(filePkg, exportContent);
                }
            }
            else {
                exportContent = exportDeclaration;
            }
        }
    }
    return exportContent;
}
exports.getNamedExport = getNamedExport;
function getDefaultExport(filePkg, resolveExport) {
    if (resolveExport === void 0) { resolveExport = true; }
    return getNamedExport(filePkg, 'default', resolveExport);
}
exports.getDefaultExport = getDefaultExport;
function hasExportName(filePkg, name) {
    return Boolean(getNamedExport(filePkg, name, false));
}
exports.hasExportName = hasExportName;
function getStaticName(filePkg, target, name) {
    var symbol = getSymbol(filePkg, target);
    if (symbol) {
        return filePkg.checker.tryGetMemberInModuleExports(name, symbol);
    }
    return undefined;
}
exports.getStaticName = getStaticName;
function hasStaticName(filePkg, target, name) {
    return Boolean(getStaticName(filePkg, target, name));
}
exports.hasStaticName = hasStaticName;
function isPageToIgnore(pageFilePath) {
    var fileName = pageFilePath.substring(pageFilePath.lastIndexOf('/') + 1);
    return (pageFilePath.startsWith('/api/') ||
        pageFilePath.startsWith('/_document.') ||
        pageFilePath.startsWith('/middleware.') ||
        fileName.startsWith('_middleware.') ||
        specFileOrFolderRgx.test(pageFilePath));
}
exports.isPageToIgnore = isPageToIgnore;
function hasHOC(filePkg) {
    var defaultExport = getDefaultExport(filePkg);
    if (!defaultExport ||
        hasExportName(filePkg, 'getStaticProps') ||
        hasExportName(filePkg, 'getServerSideProps') ||
        hasExportName(filePkg, 'getStaticPaths')) {
        return false;
    }
    if (typescript_1.default.isVariableDeclaration(defaultExport) && defaultExport.initializer) {
        defaultExport = defaultExport.initializer;
        if (typescript_1.default.isParenthesizedExpression(defaultExport)) {
            defaultExport = resolveParenthesis(filePkg, defaultExport);
        }
        if (typescript_1.default.isIdentifier(defaultExport)) {
            defaultExport = resolveIdentifier(filePkg, defaultExport);
        }
        if (!typescript_1.default.isCallExpression(defaultExport)) {
            return false;
        }
    }
    if (typescript_1.default.isFunctionDeclaration(defaultExport) ||
        typescript_1.default.isClassDeclaration(defaultExport)) {
        return false;
    }
    var importedNames = getImportedNames(filePkg, 'next-translate/withTranslation');
    var withTranslationId = importedNames === null || importedNames === void 0 ? void 0 : importedNames.get('default');
    function isCallExpressionWithHOC(callExpression) {
        var _a;
        var callable = callExpression.expression;
        var expressionsToVisit = __spreadArray([callable], callExpression.arguments, true);
        for (var _i = 0, expressionsToVisit_1 = expressionsToVisit; _i < expressionsToVisit_1.length; _i++) {
            var expression = expressionsToVisit_1[_i];
            if (typescript_1.default.isCallExpression(expression)) {
                return isCallExpressionWithHOC(expression);
            }
            if (typescript_1.default.isIdentifier(expression)) {
                var resolved = resolveIdentifier(filePkg, expression);
                if (typescript_1.default.isVariableDeclaration(resolved)) {
                    var initializer = resolved.initializer;
                    if (initializer && typescript_1.default.isParenthesizedExpression(initializer)) {
                        initializer = resolveParenthesis(filePkg, initializer);
                    }
                    if (initializer && typescript_1.default.isCallExpression(initializer)) {
                        return isCallExpressionWithHOC(initializer);
                    }
                }
                if (typescript_1.default.isImportClause(resolved)) {
                    if (((_a = resolved.name) === null || _a === void 0 ? void 0 : _a.getText()) !== (withTranslationId === null || withTranslationId === void 0 ? void 0 : withTranslationId.getText())) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    if (typescript_1.default.isCallExpression(defaultExport)) {
        if (withTranslationId) {
            return isCallExpressionWithHOC(defaultExport);
        }
        else {
            return true;
        }
    }
    return false;
}
exports.hasHOC = hasHOC;
function isNotExportModifier(modifier) {
    var exportModifiers = [
        typescript_1.default.SyntaxKind.DefaultKeyword,
        typescript_1.default.SyntaxKind.ExportKeyword,
    ];
    return !exportModifiers.includes(modifier.kind);
}
exports.isNotExportModifier = isNotExportModifier;
function interceptExport(filePkg, exportName, defaultLocalName) {
    var exportContent = getNamedExport(filePkg, exportName, false);
    var finalLocalName = '';
    var extraImport;
    if (!exportContent)
        return finalLocalName;
    filePkg.transform(function (sourceFile, context) {
        function visitor(node) {
            var _a, _b, _c, _d, _e, _f, _g;
            if (typescript_1.default.isClassDeclaration(node) && node === exportContent) {
                if (node.name)
                    finalLocalName = node.name.getText();
                return typescript_1.default.factory.updateClassDeclaration(node, node.decorators, (_a = node.modifiers) === null || _a === void 0 ? void 0 : _a.filter(isNotExportModifier), (_b = node.name) !== null && _b !== void 0 ? _b : typescript_1.default.factory.createIdentifier(defaultLocalName), node.typeParameters, node.heritageClauses, node.members);
            }
            if (typescript_1.default.isFunctionDeclaration(node) && node === exportContent) {
                if (node.name)
                    finalLocalName = node.name.getText();
                return typescript_1.default.factory.updateFunctionDeclaration(node, node.decorators, (_c = node.modifiers) === null || _c === void 0 ? void 0 : _c.filter(isNotExportModifier), node.asteriskToken, (_d = node.name) !== null && _d !== void 0 ? _d : typescript_1.default.factory.createIdentifier(defaultLocalName), node.typeParameters, node.parameters, node.type, node.body);
            }
            if (typescript_1.default.isVariableStatement(node) &&
                typescript_1.default.isVariableDeclaration(exportContent) &&
                node.declarationList.declarations.includes(exportContent)) {
                finalLocalName = exportContent.name.getText();
                return typescript_1.default.factory.updateVariableStatement(node, (_e = node.modifiers) === null || _e === void 0 ? void 0 : _e.filter(isNotExportModifier), node.declarationList);
            }
            if (typescript_1.default.isExportDeclaration(node) &&
                typescript_1.default.isExportSpecifier(exportContent) &&
                node.exportClause &&
                typescript_1.default.isNamedExports(node.exportClause)) {
                var filteredSpecifiers = node.exportClause.elements.filter(function (specifier) { return specifier !== exportContent; });
                if (node.moduleSpecifier) {
                    finalLocalName = defaultLocalName;
                    extraImport = typescript_1.default.factory.createImportDeclaration(undefined, undefined, typescript_1.default.factory.createImportClause(node.isTypeOnly, undefined, typescript_1.default.factory.createNamedImports([
                        typescript_1.default.factory.createImportSpecifier(exportContent.isTypeOnly, (_f = exportContent.propertyName) !== null && _f !== void 0 ? _f : exportContent.name, typescript_1.default.factory.createIdentifier(defaultLocalName)),
                    ])), node.moduleSpecifier);
                }
                else {
                    var localId = (_g = exportContent.propertyName) !== null && _g !== void 0 ? _g : exportContent.name;
                    finalLocalName = localId.getText();
                }
                return typescript_1.default.factory.updateExportDeclaration(node, node.decorators, node.modifiers, node.isTypeOnly, typescript_1.default.factory.updateNamedExports(node.exportClause, filteredSpecifiers), node.moduleSpecifier, node.assertClause);
            }
            if (typescript_1.default.isExportAssignment(node) && node === exportContent) {
                finalLocalName = defaultLocalName;
                return typescript_1.default.factory.createVariableStatement(undefined, typescript_1.default.factory.createVariableDeclarationList([
                    typescript_1.default.factory.createVariableDeclaration(defaultLocalName, undefined, undefined, node.expression),
                ], typescript_1.default.NodeFlags.Const));
            }
            return typescript_1.default.visitEachChild(node, visitor, context);
        }
        return typescript_1.default.visitNode(sourceFile, visitor);
    });
    if (extraImport) {
        filePkg.transform(function (sourceFile) {
            return typescript_1.default.factory.updateSourceFile(sourceFile, __spreadArray([
                extraImport
            ], sourceFile.statements, true));
        });
    }
    return finalLocalName;
}
exports.interceptExport = interceptExport;
function removeCommentsFromCode(code) {
    return code.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '');
}
exports.removeCommentsFromCode = removeCommentsFromCode;

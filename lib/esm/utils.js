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
import ts from 'typescript';
var specFileOrFolderRgx = /(__mocks__|__tests__)|(\.(spec|test)\.(tsx|ts|js|jsx)$)/;
export var defaultLoader = '(l, n) => import(`@next-translate-root/locales/${l}/${n}`).then(m => m.default)';
export function getDefaultAppJs(hasLoadLocaleFrom) {
    return "\n    import i18nConfig from '@next-translate-root/i18n'\n    import appWithI18n from 'next-translate/appWithI18n'\n  \n    function MyApp({ Component, pageProps }) {\n      return <Component {...pageProps} />\n    }\n  \n    export default appWithI18n(MyApp, {\n      ...i18nConfig,\n      skipInitialProps: true,\n      isLoader: true,\n      ".concat(overwriteLoadLocales(hasLoadLocaleFrom), "\n    })\n  ");
}
export function overwriteLoadLocales(hasLoadLocaleFrom) {
    if (hasLoadLocaleFrom)
        return '';
    return "loadLocaleFrom: ".concat(defaultLoader, ",");
}
export function getTsCompilerOptions(basePath, cutDependencies) {
    if (cutDependencies === void 0) { cutDependencies = false; }
    var options;
    var configPath = ts.findConfigFile(basePath, ts.sys.fileExists, 'tsconfig.json');
    if (!configPath) {
        options = { allowJs: true };
    }
    else {
        var readConfigFileResult = ts.readConfigFile(configPath, ts.sys.readFile);
        var jsonConfig = readConfigFileResult.config;
        var convertResult = ts.convertCompilerOptionsFromJson(jsonConfig.compilerOptions, basePath);
        options = convertResult.options;
    }
    if (cutDependencies) {
        options = __assign(__assign({}, options), { types: [], noResolve: true, noLib: true });
    }
    return options;
}
export function getFilePkg(program, filename) {
    var checker = program.getTypeChecker();
    var sourceFile = program.getSourceFile(filename);
    var printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    var fileSymbol = checker.getSymbolAtLocation(sourceFile);
    var filePkg;
    function transform(transformer) {
        var sourceFile = filePkg.sourceFile;
        var transformationResult = ts.transform(sourceFile, [
            function (context) { return function (sourceFile) { return transformer(sourceFile, context); }; },
        ]);
        filePkg.sourceFile = transformationResult.transformed[0];
        filePkg.fileSymbol = checker.getSymbolAtLocation(filePkg.sourceFile);
    }
    function getCode() {
        var sourceFile = filePkg.sourceFile;
        return printer.printNode(ts.EmitHint.Unspecified, sourceFile, sourceFile);
    }
    filePkg = { program: program, checker: checker, sourceFile: sourceFile, fileSymbol: fileSymbol, transform: transform, getCode: getCode };
    return filePkg;
}
export function parseFile(basePath, filename) {
    var options = getTsCompilerOptions(basePath, true);
    var program = ts.createProgram([filename], options);
    return getFilePkg(program, filename);
}
export function parseCode(format, code) {
    var options = getTsCompilerOptions('/', true);
    var host = ts.createCompilerHost(options);
    var filename = "source.".concat(format);
    host.getSourceFile = function (fileName) {
        return ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest);
    };
    var program = ts.createProgram([filename], options, host);
    return getFilePkg(program, filename);
}
export function getSymbol(filePkg, node) {
    var location = ts.isVariableDeclaration(node) ? node.name : node;
    return filePkg.checker.getSymbolAtLocation(location);
}
export function getImportedNames(filePkg, moduleName) {
    var importClause = filePkg.sourceFile.forEachChild(function (node) {
        if (ts.isImportDeclaration(node)) {
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
                if (ts.isImportSpecifier(node)) {
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
export function resolveParenthesis(filePkg, parenthesizedExpression) {
    var content = parenthesizedExpression.expression;
    if (ts.isParenthesizedExpression(content)) {
        return resolveParenthesis(filePkg, content);
    }
    else {
        return content;
    }
}
export function resolveIdentifier(filePkg, identifier) {
    var identifierSymbol = getSymbol(filePkg, identifier);
    if (identifierSymbol && Array.isArray(identifierSymbol.declarations)) {
        var identifierDeclaration = identifierSymbol.declarations[0];
        if (ts.isVariableDeclaration(identifierDeclaration)) {
            var initializer = identifierDeclaration.initializer;
            if (initializer && ts.isParenthesizedExpression(initializer)) {
                initializer = resolveParenthesis(filePkg, initializer);
            }
            if (initializer && ts.isIdentifier(initializer)) {
                return resolveIdentifier(filePkg, initializer);
            }
        }
        return identifierDeclaration;
    }
    return identifier;
}
export function getNamedExport(filePkg, name, resolveExport) {
    if (resolveExport === void 0) { resolveExport = true; }
    var checker = filePkg.checker, fileSymbol = filePkg.fileSymbol;
    var exportContent;
    if (fileSymbol) {
        var exportSymbol = checker.tryGetMemberInModuleExports(name, fileSymbol);
        if (exportSymbol && Array.isArray(exportSymbol.declarations)) {
            var exportDeclaration = exportSymbol.declarations[0];
            if (resolveExport && ts.isExportAssignment(exportDeclaration)) {
                exportContent = exportDeclaration.expression;
                if (ts.isParenthesizedExpression(exportContent)) {
                    exportContent = resolveParenthesis(filePkg, exportContent);
                }
                if (ts.isIdentifier(exportContent)) {
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
export function getDefaultExport(filePkg, resolveExport) {
    if (resolveExport === void 0) { resolveExport = true; }
    return getNamedExport(filePkg, 'default', resolveExport);
}
export function hasExportName(filePkg, name) {
    return Boolean(getNamedExport(filePkg, name, false));
}
export function getStaticName(filePkg, target, name) {
    var symbol = getSymbol(filePkg, target);
    if (symbol) {
        return filePkg.checker.tryGetMemberInModuleExports(name, symbol);
    }
    return undefined;
}
export function hasStaticName(filePkg, target, name) {
    return Boolean(getStaticName(filePkg, target, name));
}
export function isPageToIgnore(pageFilePath) {
    var fileName = pageFilePath.substring(pageFilePath.lastIndexOf('/') + 1);
    return (pageFilePath.startsWith('/api/') ||
        pageFilePath.startsWith('/_document.') ||
        pageFilePath.startsWith('/middleware.') ||
        fileName.startsWith('_middleware.') ||
        specFileOrFolderRgx.test(pageFilePath));
}
export function hasHOC(filePkg) {
    var defaultExport = getDefaultExport(filePkg);
    if (!defaultExport ||
        hasExportName(filePkg, 'getStaticProps') ||
        hasExportName(filePkg, 'getServerSideProps') ||
        hasExportName(filePkg, 'getStaticPaths')) {
        return false;
    }
    if (ts.isVariableDeclaration(defaultExport) && defaultExport.initializer) {
        defaultExport = defaultExport.initializer;
        if (ts.isParenthesizedExpression(defaultExport)) {
            defaultExport = resolveParenthesis(filePkg, defaultExport);
        }
        if (ts.isIdentifier(defaultExport)) {
            defaultExport = resolveIdentifier(filePkg, defaultExport);
        }
        if (!ts.isCallExpression(defaultExport)) {
            return false;
        }
    }
    if (ts.isFunctionDeclaration(defaultExport) ||
        ts.isClassDeclaration(defaultExport)) {
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
            if (ts.isCallExpression(expression)) {
                return isCallExpressionWithHOC(expression);
            }
            if (ts.isIdentifier(expression)) {
                var resolved = resolveIdentifier(filePkg, expression);
                if (ts.isVariableDeclaration(resolved)) {
                    var initializer = resolved.initializer;
                    if (initializer && ts.isParenthesizedExpression(initializer)) {
                        initializer = resolveParenthesis(filePkg, initializer);
                    }
                    if (initializer && ts.isCallExpression(initializer)) {
                        return isCallExpressionWithHOC(initializer);
                    }
                }
                if (ts.isImportClause(resolved)) {
                    if (((_a = resolved.name) === null || _a === void 0 ? void 0 : _a.getText()) !== (withTranslationId === null || withTranslationId === void 0 ? void 0 : withTranslationId.getText())) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    if (ts.isCallExpression(defaultExport)) {
        if (withTranslationId) {
            return isCallExpressionWithHOC(defaultExport);
        }
        else {
            return true;
        }
    }
    return false;
}
export function isNotExportModifier(modifier) {
    var exportModifiers = [
        ts.SyntaxKind.DefaultKeyword,
        ts.SyntaxKind.ExportKeyword,
    ];
    return !exportModifiers.includes(modifier.kind);
}
export function interceptExport(filePkg, exportName, defaultLocalName) {
    var exportContent = getNamedExport(filePkg, exportName, false);
    var finalLocalName = '';
    var extraImport;
    if (!exportContent)
        return finalLocalName;
    filePkg.transform(function (sourceFile, context) {
        function visitor(node) {
            var _a, _b, _c, _d, _e, _f, _g;
            if (ts.isClassDeclaration(node) && node === exportContent) {
                if (node.name)
                    finalLocalName = node.name.getText();
                return ts.factory.updateClassDeclaration(node, node.decorators, (_a = node.modifiers) === null || _a === void 0 ? void 0 : _a.filter(isNotExportModifier), (_b = node.name) !== null && _b !== void 0 ? _b : ts.factory.createIdentifier(defaultLocalName), node.typeParameters, node.heritageClauses, node.members);
            }
            if (ts.isFunctionDeclaration(node) && node === exportContent) {
                if (node.name)
                    finalLocalName = node.name.getText();
                return ts.factory.updateFunctionDeclaration(node, node.decorators, (_c = node.modifiers) === null || _c === void 0 ? void 0 : _c.filter(isNotExportModifier), node.asteriskToken, (_d = node.name) !== null && _d !== void 0 ? _d : ts.factory.createIdentifier(defaultLocalName), node.typeParameters, node.parameters, node.type, node.body);
            }
            if (ts.isVariableStatement(node) &&
                ts.isVariableDeclaration(exportContent) &&
                node.declarationList.declarations.includes(exportContent)) {
                finalLocalName = exportContent.name.getText();
                return ts.factory.updateVariableStatement(node, (_e = node.modifiers) === null || _e === void 0 ? void 0 : _e.filter(isNotExportModifier), node.declarationList);
            }
            if (ts.isExportDeclaration(node) &&
                ts.isExportSpecifier(exportContent) &&
                node.exportClause &&
                ts.isNamedExports(node.exportClause)) {
                var filteredSpecifiers = node.exportClause.elements.filter(function (specifier) { return specifier !== exportContent; });
                if (node.moduleSpecifier) {
                    finalLocalName = defaultLocalName;
                    extraImport = ts.factory.createImportDeclaration(undefined, undefined, ts.factory.createImportClause(node.isTypeOnly, undefined, ts.factory.createNamedImports([
                        ts.factory.createImportSpecifier(exportContent.isTypeOnly, (_f = exportContent.propertyName) !== null && _f !== void 0 ? _f : exportContent.name, ts.factory.createIdentifier(defaultLocalName)),
                    ])), node.moduleSpecifier);
                }
                else {
                    var localId = (_g = exportContent.propertyName) !== null && _g !== void 0 ? _g : exportContent.name;
                    finalLocalName = localId.getText();
                }
                return ts.factory.updateExportDeclaration(node, node.decorators, node.modifiers, node.isTypeOnly, ts.factory.updateNamedExports(node.exportClause, filteredSpecifiers), node.moduleSpecifier, node.assertClause);
            }
            if (ts.isExportAssignment(node) && node === exportContent) {
                finalLocalName = defaultLocalName;
                return ts.factory.createVariableStatement(undefined, ts.factory.createVariableDeclarationList([
                    ts.factory.createVariableDeclaration(defaultLocalName, undefined, undefined, node.expression),
                ], ts.NodeFlags.Const));
            }
            return ts.visitEachChild(node, visitor, context);
        }
        return ts.visitNode(sourceFile, visitor);
    });
    if (extraImport) {
        filePkg.transform(function (sourceFile) {
            return ts.factory.updateSourceFile(sourceFile, __spreadArray([
                extraImport
            ], sourceFile.statements, true));
        });
    }
    return finalLocalName;
}
export function removeCommentsFromCode(code) {
    return code.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '');
}

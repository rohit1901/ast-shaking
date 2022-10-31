const esprima = require('esprima');
const fs = require('fs');

// parser class
class Parser {
    // simply set some default values
    constructor(entryModule) {
        this.importedVals = new Map();
        this.exportedVals = [];
        this.modulesSet = [];
        this.module = entryModule;
        // bind bc no transform plugin
        this.followImportSources = this.followImportSources.bind(this);
    }

    // or trigger the extractImports fn
    get Imports() {
        return this.importedVals.length ? this.importedVals : this.extractImports(this.module);
    }

    // traverse the tree of module
    // look for ImportDeclaration type

    // pull in the path and parse its content
    parseModule(relPath) {
        const codeBuffer = fs.readFileSync(__dirname + relPath);
        return esprima.parseModule(codeBuffer.toString());
    }

    // define the function to follow import sources
    // either push the module name into the Modules Map

    // follow imports recursively
    extractImports(module) {
        const extractedImports = this.traverseSyntaxTree({
            AST: this.parseModule(`/modules/${module}.js`),
            extractType: 'ImportDeclaration',
            recursiveCaller: this.followImportSources,
            extractor: (node) => {
                // look for the imported key and return its name
                return node.specifiers
                    .map(val => val.imported.name);
            }
        });
        // put the extracted import into our hashmap
        extractedImports
            .forEach(imp => this.importedVals.set(imp, imp.toString()))
        return this.importedVals;
    }

    // traverse the AST and do whatever

    // or don't do anything
    followImportSources({source}) {
        const followModule = source.value.replace('./', '');
        followModule.length ? (() => {
            this.extractImports(followModule);
            this.modulesSet.push({
                name: followModule, module: this.parseModule(`/modules/${followModule}.js`)
            });
        })() : undefined;
    }

    // either return importedVals if we had them already

    //extractImports function told us to do
    traverseSyntaxTree({
                           AST, extractType, extractor, recursiveCaller = noop => noop
                       }) {
        const {body} = AST;
        let extractedNodes = [];
        body.forEach(node => {
            if (extractType === node.type) {
                const extractedVals = extractor(node);
                extractedNodes = [...extractedNodes, ...extractedVals];
                recursiveCaller(node);
            }
        })
        return extractedNodes;
    }
}

class TreeShaker {
    // store the unshaked modules
    // shake the modules when initializing
    constructor({Imports, modulesSet}) {
        this.unshaked = modulesSet;
        this.modules = TreeShaker.shake(modulesSet, Imports);
    }

    // make the original modules accessible
    get Unshaked() {
        return this.unshaked;
    }

    // and the optimized modules are of course accessible as well
    get Modules() {
        return this.modules;
    }

    // do static because... well 🤷🏻‍
    static shake(modules, importedVals) {
        // get all the values from the module map defined in Parser
        // and turn them into an array
        return Array.from(modules.entries())
            .map(([, {module: m, name}]) => {
                const module = {...m};
                const {body} = module;
                const shakedBody = [];
                // traverse every body of every module
                // look for export declarations &&
                // if the exported name is in the array of imports
                // we include it in our new body
                // also we include everything else that is not an export
                body.forEach(node => {
                    if (node.type === 'ExportNamedDeclaration') {
                        node.declaration.declarations
                            .forEach(({id}) => {
                                if (importedVals.has(id.name)) {
                                    shakedBody.push(node);
                                }
                            });
                    } else {
                        shakedBody.push(node);
                    }
                })
                module.body = shakedBody;
                return module;
            })
    }
}

module.exports = {
    Parser, TreeShaker
}

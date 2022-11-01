const escodegen = require('escodegen');
const {Parser} = require('./Parser');
const {TreeShaker} = require('./TreeShaker');

const treeShaker = new TreeShaker(new Parser('module1'));
// create one big bundle
const moduleStringOptimized = treeShaker.getModules
    .map(m => escodegen.generate(m))
    .join('');
// another bundle for comparison
// NOTE: the module prop has to be specified on the module object
const moduleStringUnshaked = treeShaker.getUnshakenModules
    .map(u => escodegen.generate(u.module))
    .join('');
// we will compare the two bundles
console.log('\nUnshaken module string \n');
console.log(moduleStringUnshaked);

console.log('\nOptimized module string \n');
console.log(moduleStringOptimized);

// a naive comparison by counting the characters in percent
const improvement = Math.floor((1 - moduleStringOptimized.length / moduleStringUnshaked.length) * 100);

console.log('\nIMPROVEMENT: ', improvement, '% 🎉');

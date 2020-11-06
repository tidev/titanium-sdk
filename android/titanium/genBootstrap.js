'use strict';

const path = require('path');
const fs = require('fs-extra');
const ejs = require('ejs');

const KROLL_DEFAULT = 'org.appcelerator.kroll.annotations.Kroll.DEFAULT';
const TI_MODULE = 'ti.modules.titanium.TitaniumModule';

/**
 * @returns {object}
 */
async function loadBindings() {
	const bindingPath = path.join(__dirname, '../../dist/android/titanium.bindings.json');
	return fs.readJson(bindingPath);
}

/**
 * Recursively hangs proxies off the parent proxy listing as 'children' array
 * @param {object} bindings loaded from titanium.bindings.json
 * @param {string} parentName parent module name to match
 * @returns {object[]} the children who report the given parent module as their proxyAttrs.creatableInModule or proxyAttrs.parentModule value
 */
function buildTree(bindings, parentName) {
	const tiProxies = Object.values(bindings.proxies).filter(p => {
		let parent = TI_MODULE; // if both values are set to default, treat TiModule as parent
		if (p.proxyAttrs.creatableInModule && p.proxyAttrs.creatableInModule !== KROLL_DEFAULT) {
			parent = p.proxyAttrs.creatableInModule;
		} else if (p.proxyAttrs.parentModule && p.proxyAttrs.parentModule !== KROLL_DEFAULT) {
			parent = p.proxyAttrs.parentModule;
		}
		// don't include module as child of itself!
		return parent === parentName && p.proxyAttrs.proxyClassName !== parentName;
	});
	// tiProxies now holds an array of all the children proxies for the parent
	// What we want to do now, is to hang any children of those off them!
	const modules = tiProxies.filter(p => p.isModule);
	for (const mod of modules) {
		mod.children = buildTree(bindings, mod.proxyAttrs.proxyClassName);
		mod.createProxies = bindings.modules[mod.proxyAttrs.proxyClassName].createProxies;
	}
	return tiProxies;
}

async function generateJS(bindings, outDir) {
	// Loop through the proxies to gather the stuff we need:
	// invocationAPIs: namespace (the original proxy/module holding the method), apiName (the method to wrap)
	// globals: delegate (the original proxy/module holding the method), method (the original method), name (the global alias)
	// bootstrapJS - collection of lazy bindings calls....
	const invocationAPIs = [];
	const globals = [];
	const bindEntries = [];
	for (const [ className, proxyMap ] of Object.entries(bindings.proxies)) {
		const namespace = proxyMap.proxyAttrs.fullAPIName;
		// check for methods that take a KrollInvocation
		if (proxyMap.methods) {
			for (const method of Object.values(proxyMap.methods)) {
				if (method.hasInvocation) {
					invocationAPIs.push({ apiName: method.apiName, namespace });
				}
			}
		}

		// check for property accessors that take a KrollInvocation
		if (proxyMap.dynamicProperties) {
			for (const dynamicProperty of Object.values(proxyMap.dynamicProperties)) {
				if (dynamicProperty.getHasInvocation) {
					invocationAPIs.push({ apiName: dynamicProperty.getMethodName, namespace });
				}
				if (dynamicProperty.setHasInvocation) {
					invocationAPIs.push({ apiName: dynamicProperty.setMethodName, namespace });
				}
			}
		}

		// Check for create* proxy factory methods - they all implicitly use invocations
		if (proxyMap.isModule) {
			const moduleEntry = bindings.modules[className];
			if (moduleEntry.createProxies) {
				moduleEntry.createProxies.forEach(create => {
					invocationAPIs.push({ apiName: `create${create.name}`, namespace });
				});
			}
		}

		// Check for methods that get re-exported under a global alias (or aliases)
		if (proxyMap.topLevelMethods) {
			for (const [ method, aliases ] of Object.entries(proxyMap.topLevelMethods)) {
				const delegate = namespace.indexOf('Titanium') !== 0 ? `Titanium.${namespace}` : namespace;
				for (const name of aliases) {
					globals.push({ delegate, method, name });
				}
			}
		}

		// Generate the bind entries for KrollGeneratedBindings.gperf
		// take namespace, drop last segment, replace with proxy.proxyClassName
		let cNamespace = namespace.split('.').slice(0, -1).map(s => s.toLowerCase()).concat([ proxyMap.proxyClassName ]).join('::');
		// if doesn't have leading "titanium", inject it
		if (!cNamespace.startsWith('titanium')) {
			cNamespace = `titanium::${cNamespace}`;
		}
		bindEntries.push({ className: proxyMap.proxyAttrs.proxyClassName, namespace: cNamespace });
	}

	// Ok, so let's recurse starting with TitaniumModule, grabbing all the children proxies/modules
	// creating a tree structure for the lazy API wrappers
	const mod = bindings.modules[TI_MODULE];
	mod.children = buildTree(bindings, TI_MODULE);

	const jsTemplate = await fs.readFile(path.join(__dirname, 'bootstrap.js.ejs'), 'utf8');
	const bootstrapJs = ejs.render(jsTemplate, {
		invocationAPIs,
		globals,
		mod,
	}, { filename: path.join(__dirname, 'bootstrap.js.ejs') });
	await fs.writeFile(path.join(outDir, 'bootstrap.js'), bootstrapJs);

	const gperfTemplate = await fs.readFile(path.join(__dirname, 'KrollGeneratedBindings.gperf.ejs'), 'utf8');
	const genBindings = ejs.render(gperfTemplate, {
		proxies: Object.keys(bindings.proxies),
		bindEntries
	});
	await fs.writeFile(path.join(outDir, 'KrollGeneratedBindings.gperf'), genBindings);
}

/**
 * @param {string} [outDir='../runtime/v8/generated'] path to place the output files
 * @returns {Promise<void>}
 */
async function genBootstrap(outDir = path.join(__dirname, '../runtime/v8/generated')) {
	const bindings = await loadBindings();
	return generateJS(bindings, outDir);
}

if (require.main === module) {
	genBootstrap().then(() => process.exit(0))
		.catch(e => {
			console.error(e);
			process.exit(1);
		});
}

module.exports = genBootstrap;

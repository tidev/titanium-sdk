'use strict';

const fs = require('fs-extra');
const path = require('path');

const NODE_MODULES = 'node_modules';

const copier = {};
/**
 * @param {string} projectPath absolute filepath for project root directory
 * @param {object} [options] options object
 * @param {boolean} [options.includeOptional=true] whether to include optional dependencies when gathering
 * @param {boolean} [options.includePeers=true] whether to include peer dependencies when gathering
 * @returns {Promise<Set<string>>} A Promise that resolves on completion
 */
copier.gather = async function (projectPath, options = { includeOptional: true, includePeers: true }) {
	if (projectPath === null || projectPath === undefined) {
		throw new Error('projectPath must be defined.');
	}
	// resolve path names for file copying
	projectPath = path.resolve(projectPath);

	// recursively gather the full set of dependencies/directories we need to copy
	const root = new Dependency(null, 'fake-id', projectPath);
	const directoriesToBeCopied = await root.getDirectoriesToCopy(options.includeOptional, options.includePeers);

	return new Set(directoriesToBeCopied); // de-duplicate
};

/**
 * @param {string} projectPath absolute filepath for project root directory
 * @param {string} targetPath absolute filepath for target directory to copy node_modules into
 * @param {object} [options] options object
 * @param {boolean} [options.includeOptional=true] whether to include optional dependencies when gathering
 * @param {boolean} [options.includePeers=true] whether to include peer dependencies when gathering
 * @returns {Promise<void>} A Promise that resolves on completion
 */
copier.execute = async function (projectPath, targetPath, options = { includeOptional: true, includePeers: true }) {
	if (projectPath === null || projectPath === undefined) {
		throw new Error('projectPath must be defined.');
	}
	if (targetPath === null || targetPath === undefined) {
		throw new Error('targetPath must be defined.');
	}

	// resolve path names for file copying
	projectPath = path.resolve(projectPath);
	targetPath = path.resolve(targetPath);

	const dirSet = await copier.gather(projectPath, options);
	// back to Array so we can #map()
	const deDuplicated = Array.from(dirSet);

	// Then copy them over
	return Promise.all(deDuplicated.map(async directory => {
		const relativePath = directory.substring(projectPath.length);
		const destPath = path.join(targetPath, relativePath);
		return fs.copy(directory, destPath, { overwrite: true }); // TODO: Allow incremental copying! Maybe use gulp/vinyl?
	}));
};

class Dependency {
	constructor(parent, name, directory) {
		this.name = name;
		this.parent = parent;
		this.directory = directory;
	}

	isRoot() {
		return this.parent === null;
	}

	/**
	 * @description Get directories that need to be copied to target.
	 * @param {boolean} [includeOptional=true] - Include optional dependencies?
	 * @param {boolean} [includePeers=true] - Include peer dependencies?
	 * @returns {Promise<string[]>} Full set of directories to copy.
	 */
	async getDirectoriesToCopy(includeOptional = true, includePeers = true) {
		const childrenNames = await this.gatherChildren(includeOptional, includePeers);
		if (childrenNames.length === 0) {
			if (this.isRoot()) {
				return []; // if root has no children, return empty set of dirs!
			}
			return [ this.directory ]; // just need our own directory!
		}

		const children = (await Promise.all(childrenNames.map(name => this.resolve(name)))).filter(child => child !== null);
		const allDirs = await Promise.all(children.map(c => c.getDirectoriesToCopy(includeOptional, includePeers)));
		// flatten allDirs doen to single Array
		const flattened = allDirs.reduce((acc, val) => acc.concat(val), []); // TODO: replace with flat() call once Node 11+

		// if this isn't the "root" module...
		if (!this.isRoot()) {
			// ...prune any children directories that are underneath this one
			const filtered = flattened.filter(dir => !dir.startsWith(this.directory + path.sep));
			filtered.push(this.directory); // We need to include our own directory
			return filtered;
		}
		return flattened;
	}

	/**
	 * @description Gather a list of all child dependencies.
	 * @param {boolean} [includeOptional=true] - Include optional dependencies?
	 * @param {boolean} [includePeers=true] - Include peer dependencies?
	 * @returns {Promise<string[]>} Set of dependency names.
	 */
	async gatherChildren(includeOptional = true, includePeers = true) {
		try {
			const packageJson = await fs.readJson(path.join(this.directory, 'package.json'));

			// if package is specifically marked to be ignored or is a native module wrapped in a package, skip it
			if (packageJson.titanium) {
				if (packageJson.titanium.ignore) {
					return []; // ignore this module
				}

				// native modules as npm packages are handled separately by CLI native module code
				if (packageJson.titanium.type === 'native-module') {
					return [];
				}
			}

			const dependencies = Object.keys(packageJson.dependencies || {});
			// include optional dependencies too?
			if (includeOptional && packageJson.optionalDependencies) {
				dependencies.push(...Object.keys(packageJson.optionalDependencies));
			}

			if (includePeers && packageJson.peerDependencies) {
				dependencies.push(...Object.keys(packageJson.peerDependencies));
			}

			return dependencies;
		} catch (err) {
			return [];
		}
	}

	/**
	 * Attempts to resolve a given module by id to the correct
	 * @param {string} subModule id of a module that is it's dependency
	 * @returns {Promise<Dependency>} the resolved dependency
	 */
	async resolve(subModule) {
		try {
			// First try underneath the current module
			const targetDir = path.join(this.directory, NODE_MODULES, subModule);
			const packageJsonExists = await fs.pathExists(path.join(targetDir, 'package.json'));
			if (packageJsonExists) {
				return new Dependency(this, subModule, targetDir);
			}
		} catch (err) {
			// do nothing...
		}
		if (!this.isRoot()) {
			return this.parent.resolve(subModule); // Try the parent (recursively)
		}
		return null;
	}
}

module.exports = copier;

'use strict';

const copier = {};
module.exports = copier;

const fs = require('fs-extra');
const path = require('path');

const NODE_MODULES = 'node_modules';

/**
 * @param {string} projectPath absolute filepath for project root directory
 * @param {string} targetPath absolute filepath for target directory to copy node_modules into
 * @param {object} [options] options object
 * @param {boolean} [options.includeOptional=true] whether to include optional dependencies when gathering
 * @returns {Promise<void>} A Promise that resolves on completion
 */
copier.execute = async (projectPath, targetPath, options = { includeOptional: true }) => {
	if (projectPath === null || projectPath === undefined) {
		throw new Error('projectPath must be defined.');
	}
	if (targetPath === null || targetPath === undefined) {
		throw new Error('targetPath must be defined.');
	}

	// resolve path names for file copying
	projectPath = path.resolve(projectPath);
	targetPath = path.resolve(targetPath);

	// recursively gather the full set of dependencies/directories we need to copy
	const root = new Dependency(null, 'fake-id', projectPath);
	const directoriesToBeCopied = await root.getDirectoriesToCopy(options.includeOptional);

	const dirSet = new Set(directoriesToBeCopied); // de-duplicate
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

	/**
	 * @param {boolean} [includeOptional=true] include optional dependencies?
	 * @returns {Promise<string[]>} full set of directories to copy
	 */
	async getDirectoriesToCopy(includeOptional = true) {
		const childrenNames = await this.gatherChildren(includeOptional);
		if (childrenNames.length === 0) {
			return [ this.directory ]; // just need our own directory!
		}

		const children = (await Promise.all(childrenNames.map(name => this.resolve(name)))).filter(child => child !== null);
		const allDirs = await Promise.all(children.map(c => c.getDirectoriesToCopy(includeOptional)));
		// flatten allDirs doen to single Array
		const flattened = allDirs.reduce((acc, val) => acc.concat(val), []); // TODO: replace with flat() call once Node 11+

		// if this isn't the "root" module...
		if (this.parent !== null) {
			// ...prune any children directories that are underneath this one
			const filtered = flattened.filter(dir => !dir.startsWith(this.directory + path.sep));
			filtered.push(this.directory); // We need to include our own directory
			return filtered;
		}
		return flattened;
	}

	/**
	 * @param {boolean} [includeOptional] include optional dependencies?
	 * @returns {Promise<string[]>} set of dependency names
	 */
	async gatherChildren(includeOptional = true) {
		const packageJson = await fs.readJson(path.join(this.directory, 'package.json'));
		const dependencies = Object.keys(packageJson.dependencies || {});
		// include optional dependencies too?
		if (includeOptional && packageJson.optionalDependencies) {
			dependencies.push(...Object.keys(packageJson.optionalDependencies));
		}
		return dependencies;
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
		if (this.parent !== null) {
			return this.parent.resolve(subModule); // Try the parent (recursively)
		}
		return null;
	}
}

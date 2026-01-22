import { Arborist } from '@npmcli/arborist';
import fs from 'fs-extra';
import path from 'node:path';

/**
 * Reads of the node_modules on disk, and then produces a Set of paths to copy that match the
 * criteria. Will always ignore development dependencies, Titanium native modules (denoted by
 * titanium.type in package.json being native-modules), and optionally peer and optional
 * dependencies
 *
 * @param {string} projectPath absolute filepath for project root directory
 * @param {object} [options] options object
 * @param {boolean} [options.includeOptional=true] whether to include optional dependencies when gathering
 * @param {boolean} [options.includePeers=true] whether to include peer dependencies when gathering
 * @returns {Promise<Set<string>>} A Promise that resolves on completion
 */
export async function gather(projectPath, options = { includeOptional: true, includePeers: true }) {
	if (projectPath === null || projectPath === undefined) {
		throw new Error('projectPath must be defined.');
	}
	// resolve path names for file copying
	projectPath = path.resolve(projectPath);

	const arb = new Arborist({ path: projectPath });
	const tree = await arb.loadActual();

	const directoriesToBeCopied = await getDirectoriesToCopy(tree, projectPath, options.includeOptional, options.includePeers, projectPath);

	return new Set(directoriesToBeCopied); // de-duplicate
}

/**
 * Given a path, traverse its node_modules and determine the directories to copy across, then copy
 * those directories.
 *
 * @param {string} projectPath absolute filepath for project root directory
 * @param {string} targetPath absolute filepath for target directory to copy node_modules into
 * @param {object} [options] options object
 * @param {boolean} [options.includeOptional=true] whether to include optional dependencies when gathering
 * @param {boolean} [options.includePeers=true] whether to include peer dependencies when gathering
 * @returns {Promise<void>} A Promise that resolves on completion
 */
export async function execute(projectPath, targetPath, options = { includeOptional: true, includePeers: true }) {
	if (projectPath === null || projectPath === undefined) {
		throw new Error('projectPath must be defined.');
	}
	if (targetPath === null || targetPath === undefined) {
		throw new Error('targetPath must be defined.');
	}

	// resolve path names for file copying
	projectPath = path.resolve(projectPath);
	targetPath = path.resolve(targetPath);

	const dirSet = await gather(projectPath, options);
	// back to Array so we can #map()
	const deDuplicated = Array.from(dirSet);

	// Then copy them over
	return Promise.all(deDuplicated.map(async directory => {
		const relativePath = directory.substring(projectPath.length);
		const destPath = path.join(targetPath, relativePath);
		return fs.copy(directory, destPath, { overwrite: true }); // TODO: Allow incremental copying! Maybe use gulp/vinyl?
	}));
}

/**
 * Walks a tree from @npmcli/arborist, gathering the required paths to copy from node_modules
 *
 * @param {Object} tree A tree loaded from @npmcli/arborist.loadActual
 * @param {string} projectPath The path of the root project
 * @param {boolean} includeOptional Whether to include optional dependencies
 * @param {boolean} includePeers Whether to include peer dependencies
 * @returns {Promise<string[]>} An array of directory paths to copy
 */
async function getDirectoriesToCopy(tree, projectPath, includeOptional, includePeers) {
	const children = await gatherChildren(tree.children, includeOptional, includePeers);
	if (children.size === 0) {
		if (tree.path === projectPath) {
			return [];
		}
		return [ tree.path ];
	}

	const allDirs = [];
	for (const child of children) {
		const dirs = await getDirectoriesToCopy(child, projectPath, includeOptional, includePeers, child.path);
		allDirs.push(...dirs.flat());
	}

	if (tree.path !== projectPath) {
		const filtered = allDirs.filter(dir => !dir.startsWith(tree.path + path.sep));
		filtered.push(tree.path);
		return filtered;
	}

	return allDirs;
}

/**
 * Filters the children property to exclude development dependencies, Titanium native modules,
 * and optionally peer or optional dependencies.
 *
 * @param {Object} children The children property from a @npmcli/arborist Node
 * @param {boolean} includeOptional Whether to include optional dependencies
 * @param {boolean} includePeers Whether to include peer dependencies
 * @returns {Promise<Node[]>} An array of Nodes from the provided children object that should be
 * traversed
 */
async function gatherChildren (children, includeOptional, includePeers) {
	const filteredChildren = [];
	for (const [ , node ] of children) {

		if (node.dev) {
			continue;
		}

		if (node.optional && !includeOptional) {
			continue;
		}

		if (node.peer && !includePeers) {
			continue;
		}

		const packageJson = await fs.readJson(path.join(node.path, 'package.json'));

		if (packageJson.titanium) {
			if (packageJson.titanium.ignore || packageJson.titanium.type === 'native-module') {
				continue;
			}
		}

		filteredChildren.push(node);
	}

	return filteredChildren;
}

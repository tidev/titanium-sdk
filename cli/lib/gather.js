'use strict';

const fs = require('fs-extra');
const path = require('path');
const jsanalyze = require('node-titanium-sdk/lib/jsanalyze');

// RegExps used to match against files
const FILENAME_REGEXP = /^(.*)\.(\w+)$/;
// iOS specific stuff
const LAUNCH_IMAGE_REGEXP = /^(Default(-(Landscape|Portrait))?(-[0-9]+h)?(@[2-9]x)?)\.png$/;
const LAUNCH_LOGO_REGEXP = /^LaunchLogo(?:@([23])x)?(?:~(iphone|ipad))?\.(?:png|jpg)$/;
const BUNDLE_FILE_REGEXP = /.+\.bundle\/.+/;

/**
 * Merges multiple maps
 * @param {Array<Map>} maps maps to merge
 * @returns {Map}
 */
function mergeMaps(maps) {
	const merged = new Map();
	if (maps.length !== 0) {
		return maps.reduce((combined, list) => {
			return new Map([ ...combined, ...list ]);
		}, merged);
	}
	return merged;
}

class FileInfo {
	/**
	 * @param {string} name file basename
	 * @param {string} from src filepath (absolute)
	 * @param {string} to destination filepath (absolute)
	 */
	constructor(name, from, to) {
		// TODO: Why not use path methods to grab the basename/extension?
		const parts = name.match(FILENAME_REGEXP);
		this.name = parts ? parts[1] : name;
		this.ext = parts ? parts[2] : null;
		this.src = from;
		this.dest = to; // NOTE: Removed srcStat property since it appeared to be unused (and instead re-calculated by copyResources())
	}
}

class Result {
	constructor() {
		this.appIcons = new Map(); // ios specific
		this.cssFiles = new Map(); // css files to be processed (minified optionally)
		this.jsFiles = new Map(); // js files to be processed (transpiled/sourcemapped/minified/etc)
		this.launchImages = new Map(); // ios specific
		this.launchLogos = new Map(); // ios specific
		this.imageAssets = new Map(); // ios specific
		this.resourcesToCopy = new Map(); // "plain" files to copy to the app
		this.htmlJsFiles = new Set(); // used internally to track js files we shouldn't process (basically move from jsFiles to resourcesToCopy bucket)
	}

	/**
	 * If a js file is references by HTML, don't minify/transpile/etc, treat like any resource we just copy over as-is
	 */
	dontProcessJsFilesReferencedFromHTML() {
		for (const file of this.htmlJsFiles.keys()) {
			if (this.jsFiles.has(file)) {
				this.resourcesToCopy.set(file, this.jsFiles.get(file));
				this.jsFiles.delete(file);
			}
		}
	}

	/**
	 * @param  {Result[]} results to be merged
	 * @returns {Result}
	 */
	static merge(results) {
		const merged = new Result();
		const mapFields = [ 'appIcons', 'cssFiles', 'jsFiles', 'launchImages', 'launchLogos', 'imageAssets', 'resourcesToCopy' ];
		for (const key of mapFields) {
			const maps = results.map(aResult => aResult[key]).filter(m => m.size !== 0);
			merged[key] = mergeMaps(maps);
		}
		const sets = [ 'htmlJsFiles' ];
		for (const key of sets) {
			const sets = results.map(aResult => aResult[key]).filter(s => s.size !== 0);
			if (sets.length !== 0) {
				merged[key] = sets.reduce((combined, list) => {
					return new Set([ ...combined, ...list ]);
				}, merged[key]);
			}
		}
		return merged;
	}
}

class Walker {
	/**
	 *
	 * @param {object} [options] options
	 * @param {RegExp} [options.ignoreDirs=undefined] RegExp used to filter directories
	 * @param {RegExp} [options.ignoreFiles=undefined] RegExp used to filter files
	 * @param {function(object):Promise<void>} [options.entryCallback=undefined]
	 * Callback that is invoked for every file/directory entry found by the walk() method.
	 * Can be used to "exclude" the entry from being gathered or change the "toPath" destination.
	 */
	constructor(options) {
		this.ignoreDirs = options.ignoreDirs;
		this.ignoreFiles = options.ignoreFiles;
		this.entryCallback = options.entryCallback;
	}

	/**
	 * Walks a directory tree gathering the files and throwing them into different buckets to be handled separately:
	 * JS to encrypt/minify/transpile/etc
	 * CSS
	 * HTML to analyze (though we do that here...)
	 * JPG/PNG to look for app icons/launch images
	 * Everything else to copy straight up
	 * @param {string} src source path
	 * @param {string} dest destination path
	 * @param {RegExp} ignore regexp of directories/files to ignore
	 * @param {string} [origSrc] A way of preserving the original root src directory we started with?
	 * @param {string} [prefix] replaces the original src dir name in the relative path we record
	 * @returns {Promise<Map<string, FileInfo>>} collected resources/assets
	 */
	async walk(src, dest, ignore, origSrc, prefix) {
		const results = new Map();
		// TODO: Instead of checking existence here, why not just catch Error on readdirSync below? (what's faster?)
		if (!await fs.exists(src)) {
			return results;
		}

		return this._walkDir(results, src, dest, ignore, origSrc, prefix);
	}

	/**
	 * Walks a directory tree gathering the files and throwing them into different buckets to be handled separately:
	 * JS to encrypt/minify/transpile/etc
	 * CSS
	 * HTML to analyze (though we do that here...)
	 * JPG/PNG to look for app icons/launch images
	 * Everything else to copy straight up
	 * @param {Map<string, FileInfo>} results collected results
	 * @param {string} src source path
	 * @param {string} dest destination path
	 * @param {RegExp} ignore regexp of directories/files to ignore
	 * @param {string} [origSrc] A way of preserving the original root src directory we started with?
	 * @param {string} [prefix] replaces the original src dir name in the relative path we record
	 * @returns {Promise<Map<string, FileInfo>>} collected results
	 */
	async _walkDir(results, src, dest, ignore, origSrc, prefix) {
		const list = await fs.readdir(src, { withFileTypes: true });
		await Promise.all(list.map(dirent => this._visitListing(results, dirent, src, dest, ignore, origSrc, prefix)));
		return results; // We know all results here are from a single call in to walk, so we merge them as we go (by passing along the results object)
	}

	/**
	 * @param {Map<string, FileInfo>} results collecting results
	 * @param {fs.Dir} dirent directory entry
	 * @param {string} src source directory path
	 * @param {string} dest destination path
	 * @param {RegExp} ignore regexp of directories/files to ignore
	 * @param {string} [origSrc] original source dir/path
	 * @param {string} [prefix] prefix to be used in relative path in place of origSrc || src
	 */
	async _visitListing(results, dirent, src, dest, ignore, origSrc, prefix) {
		// Apply file/directory name ignore filter.
		const name = dirent.name;
		if (ignore && ignore.test(name)) {
			return;
		}

		// Set up our to/from copy parameters.
		const params = {
			fromDirent: dirent,
			fromPath: path.join(src, name),
			toPath: path.join(dest, name),
			rootSourceDir: origSrc || src,
			exclude: false,
		};
		if (dirent.isSymbolicLink()) {
			params.isDirectory = (await fs.stat(params.fromPath)).isDirectory();
		} else {
			params.isDirectory = await dirent.isDirectory();
		}

		// Apply ignore file/directory filters.
		if (params.isDirectory) {
			if (this.ignoreDirs && this.ignoreDirs.test(name)) {
				return;
			}
		} else if (this.ignoreFiles && this.ignoreFiles.test(name)) {
			return;
		}

		// Allow a callback to override entry handling such as changing the "toPath" or to "exclude" the entry.
		// Note: Above ignore patterns must always be applied first.
		if (this.entryCallback) {
			await Promise.resolve(this.entryCallback(params));
			if (params.exclude) {
				return;
			}
		}

		// If this is a directory, then walk its file tree.
		if (params.isDirectory) {
			return this._walkDir(results, params.fromPath, params.toPath, null, params.rootSourceDir, prefix);
		}

		// Add file to the collection.
		const info = new FileInfo(name, params.fromPath, params.toPath);
		const relPath = params.fromPath.replace(
			params.rootSourceDir + path.sep, prefix ? prefix + path.sep : '').replace(/\\/g, '/');
		results.set(relPath, info);
	}
}

class Categorizer {
	/**
	 * @param {object} options options
	 * @param {string} options.tiappIcon tiapp icon filename
	 * @param {boolean} [options.useAppThinning=false] use app thinning?
	 */
	constructor(options) {
		this.useAppThinning = options.useAppThinning;

		const appIcon = options.tiappIcon.match(FILENAME_REGEXP);
		this.appIconRegExp = appIcon && new RegExp('^' + appIcon[1].replace(/\./g, '\\.') + '(.*)\\.png$'); // eslint-disable-line security/detect-non-literal-regexp
	}

	/**
	 * @param {Map<string, object>} map map from relative peth to file info
	 * @returns {Result}
	 */
	run(map) {
		const results = new Result();
		// loop through the map sorting them all into the various buckets!
		map.forEach((value, key) => {
			this._handleFile(results, key, value);
		});
		results.dontProcessJsFilesReferencedFromHTML();
		return results;
	}

	/**
	 * @param {Result} results collector
	 * @param {string} relPath relative path (should be unique)
	 * @param {FileInfo} info file info like extension, basename, src/dest filepaths
	 */
	_handleFile(results, relPath, info) {
		switch (info.ext) {
			case 'js':
			case 'cjs':
			// case 'mjs': // FIXME: Support mjs!
				results.jsFiles.set(relPath, info);
				break;

			case 'css':
				results.cssFiles.set(relPath, info);
				break;

			case 'png':
				// check if we have an app icon
				// FIXME: Only check for these in files in root of the src dir! How can we tell? check against relPath instead of name?
				// if (!origSrc) { // I think this is to try and only check in the first root src dir?
				if (this.appIconRegExp) {
					const m = info.name.match(this.appIconRegExp);
					if (m) {
						info.tag = m[1];
						results.appIcons.set(relPath, info);
						return;
					}
				}

				if (LAUNCH_IMAGE_REGEXP.test(info.name)) {
					results.launchImages.set(relPath, info);
					return;
				}
				// }
				// fall through to lump with JPG...

			case 'jpg':
				// if the image is the LaunchLogo.png, then let that pass so we can use it
				// in the LaunchScreen.storyboard
				const m = info.name.match(LAUNCH_LOGO_REGEXP);
				if (m) {
					info.scale = m[1];
					info.device = m[2];
					results.launchLogos.set(relPath, info);

				// if we are using app thinning, then don't copy the image, instead mark the
				// image to be injected into the asset catalog. Also, exclude images that are
				// managed by their bundles.
				} else if (this.useAppThinning && !relPath.match(BUNDLE_FILE_REGEXP)) {
					results.imageAssets.set(relPath, info);
				} else {
					results.resourcesToCopy.set(relPath, info);
				}
				break;

			case 'html':
				jsanalyze.analyzeHtmlFile(info.src, relPath.split('/').slice(0, -1).join('/')).forEach(file => {
					results.htmlJsFiles.add(file);
				});
				// fall through to default case

			default:
				results.resourcesToCopy.set(relPath, info);
		}
	}
}

module.exports = {
	Walker,
	Result,
	Categorizer,
	mergeMaps,
};

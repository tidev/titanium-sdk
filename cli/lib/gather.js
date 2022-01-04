'use strict';

const fs = require('fs-extra');
const path = require('path');
const jsanalyze = require('node-titanium-sdk/lib/jsanalyze');

// RegExps used to match against files
const FILENAME_REGEXP = /^(.*)\.(\w+)$/;
// iOS specific stuff
const LAUNCH_IMAGE_REGEXP = /^(Default(-(Landscape|Portrait))?(-[0-9]+h)?(@[2-9]x)?)\.png$/;
const LAUNCH_LOGO_REGEXP = /^LaunchLogo(@[23]x)?(~(iphone|ipad))?\.(png|jpg)$/;
const BUNDLE_FILE_REGEXP = /.+\.bundle[/|\\].+/;
// Android-specific stuff
const DRAWABLE_REGEXP = /^images[/|\\](high|medium|low|res-[^/]+)([/|\\](.*))$/;
const ANDROID_SPLASH_REGEXP = /^(images[/|\\](high|medium|low|res-[^/]+)[/|\\])?default\.(9\.png|png|jpg)$/;

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
		this.launchImages = new Map(); // Used to create an asset catalog for launch images on iOS, used for splash screen(s) on Android
		this.launchLogos = new Map(); // ios specific
		this.imageAssets = new Map(); // used for asset catalogs and app thinning on iOS, used for drawables on Android
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
	 */
	constructor(options) {
		this.ignoreDirs = options.ignoreDirs;
		this.ignoreFiles = options.ignoreFiles;
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
		const name = dirent.name;
		if (ignore && ignore.test(name)) { // if we should ignore this file/dir, skip it
			return;
		}

		const from = path.join(src, name);
		const to = path.join(dest, name);
		//  If it's a symlink we need to resolve if it's truly a directory or file...
		if (dirent.isSymbolicLink()) {
			dirent = await fs.stat(from); // thankfully both fs.Stats and fs.Dirent have isDirectoyr() methods on them
		}
		if (dirent.isDirectory()) {
			if (this.ignoreDirs && this.ignoreDirs.test(name)) { // if we should ignore this dir, skip it
				return;
			}
			// recurse
			return this._walkDir(results, from, to, null, origSrc || src, prefix);
		}

		return this._visitFile(results, from, to, name, src, origSrc, prefix);
	}

	/**
	 * @param {Map<string, FileInfo>} results collecting results
	 * @param {string} from full source filepath
	 * @param {string} to full destination filepath
	 * @param {string} name base filename
	 * @param {string} src source directory path
	 * @param {string} [origSrc] original source dir/path
	 * @param {string} [prefix] prefix to be used in relative path in place of origSrc || src
	 */
	_visitFile(results, from, to, name, src, origSrc, prefix) {
		// if we should ignore this file, skip it
		if (this.ignoreFiles && this.ignoreFiles.test(name)) {
			return;
		}
		const info = new FileInfo(name, from, to);
		const relPath = from.replace((origSrc || src) + path.sep, prefix ? prefix + path.sep : '').replace(/\\/g, path.sep);
		results.set(relPath, info);
	}
}

class Categorizer {
	/**
	 * @param {object} options options
	 * @param {string} options.tiappIcon tiapp icon filename
	 * @param {string[]} [options.jsFilesNotToProcess=[]] listing of JS files explicitly not to process
	 * @param {boolean} [options.useAppThinning=false] use app thinning?
	 * @param {string} [options.platform] 'ios', 'android'
	 */
	constructor(options) {
		this.useAppThinning = options.useAppThinning;
		this.platform = options.platform;
		this.jsFilesNotToProcess = options.jsFilesNotToProcess || [];

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
		this.jsFilesNotToProcess.forEach(file => results.htmlJsFiles.add(file));
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
				if (this.platform === 'ios') {
					// check if we have an app icon
					// Only check for these in files in root of the src dir by comparing relative path
					if (this.appIconRegExp) {
						const m = relPath.match(this.appIconRegExp);
						if (m) {
							info.tag = m[1];
							results.appIcons.set(relPath, info);
							return;
						}
					}

					if (relPath.match(LAUNCH_IMAGE_REGEXP)) {
						results.launchImages.set(relPath, info);
						return;
					}
				}
				// fall through to lump with JPG...

			case 'jpg':
				if (this.platform === 'android') {
					// Toss Android splash screens into launchImages
					if (relPath.match(ANDROID_SPLASH_REGEXP)) {
						results.launchImages.set(relPath, info);
						return;
					}
					// Toss Android drawables into imageAssets to be processed via ProcessDrawablesTask
					if (relPath.match(DRAWABLE_REGEXP)) {
						results.imageAssets.set(relPath, info);
						return;
					}
				} else if (this.platform === 'ios') {
					// if the image is the LaunchLogo.png, then let that pass so we can use it
					// in the LaunchScreen.storyboard
					const m = info.name.match(LAUNCH_LOGO_REGEXP);
					if (m) {
						info.scale = m[1];
						info.device = m[2];
						results.launchLogos.set(relPath, info);
						return;
					}

					// if we are using app thinning, then don't copy the image, instead mark the
					// image to be injected into the asset catalog. Also, exclude images that are
					// managed by their bundles.
					if (this.useAppThinning && !relPath.match(BUNDLE_FILE_REGEXP)) {
						results.imageAssets.set(relPath, info);
						return;
					}
				}

				// Normal PNG/JPG, so just copy it
				results.resourcesToCopy.set(relPath, info);
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

import fs from 'node:fs';
import { DOMParser } from '@xmldom/xmldom';
import babel from '@babel/core';
import babylon from '@babel/parser';
import minify from 'babel-preset-minify';
import env from '@babel/preset-env';
import apiTracker from './babel-plugins/ti-api.js';
import path from 'node:path';
import { createRequire } from 'node:module';
import { expand } from 'node-titanium-sdk/util';
import { fileURLToPath } from 'node:url';

const SOURCE_MAPPING_URL_REGEXP = /\/\/#[ \t]+sourceMappingURL=([^\s'"`]+?)[ \t]*$/mg;

export function sortObject(o) {
	const sorted = {};
	for (const key of Object.keys(o).sort()) {
		sorted[key] = o[key];
	}
	return sorted;
}

/**
 * Returns an object with the Titanium API usage statistics.
 *
 * @returns {Object} The API usage stats
 */
export function getAPIUsage() {
	return apiTracker.apiUsage;
}

/**
 * Analyzes a Titanium JavaScript file for all Titanium API symbols.
 *
 * @param {String} file - The full path to the JavaScript file
 * @param {Object} [opts] - Analyze options
 * @param {Boolean} [opts.minify=false] - If true, minifies the JavaScript and returns it
 * @param {String} [opts.dest] full filepath of the destination JavaScript file we'll write the contents to
 * @param {Boolean} [opts.minify=false] - If true, minifies the JavaScript and returns it
 * @param {Boolean} [opts.transpile=false] - If true, transpiles the JS code and retuns it
 * @param {Array} [opts.plugins=[]] - An array of resolved Babel plugins
 * @param {Function} [opts.logger] - Logger instance to use for logging warnings.
 * @param {object} [opts.transform={}] - object holding static values about the app/platform/build for the babel titanium transform plugin
 * @returns {Object} An object containing symbols and minified JavaScript
 * @throws {Error} An error if unable to parse the JavaScript
 */
export function analyzeJsFile(file, opts = {}) {
	opts.filename = file;
	return analyzeJs(fs.readFileSync(file, 'utf8'), opts);
}

/**
 * Analyzes a string containing JavaScript for all Titanium API symbols.
 *
 * @param {String} contents - A string of JavaScript
 * @param {Object} [opts] - Analyze options
 * @param {String} [opts.filename] - The filename of the original JavaScript source
 * @param {String} [opts.dest] full filepath of the destination JavaScript file we'll write the contents to
 * @param {Boolean} [opts.minify=false] - If true, minifies the JavaScript and returns it
 * @param {Boolean} [opts.transpile=false] - If true, transpiles the JS code and retuns it
 * @param {Array} [opts.plugins=[]] - An array of resolved Babel plugins
 * @param {Function} [opts.logger] - Logger instance to use for logging warnings.
 * @param {object} [opts.transform={}] - object holding static values about the app/platform/build for the babel titanium transform plugin
 * @returns {Object} An object containing symbols and minified JavaScript
 * @throws {Error} An error if unable to parse the JavaScript
 */
export function analyzeJs(contents, opts = {}) {
	if (!opts.plugins) {
		opts.plugins = [];
	}
	if (!opts.transform) {
		opts.transform = {};
	}

	// parse the js file
	let ast;
	const parserOpts = {
		sourceType: 'unambiguous',
		filename: opts.filename
	};
	try {
		try {
			ast = babylon.parse(contents, parserOpts);
		} catch {
			// fall back to much looser parsing
			parserOpts.allowReturnOutsideFunction = true;
			ast = babylon.parse(contents, parserOpts);
		}
	} catch (ex) {
		const errmsg = [ `Failed to parse ${opts.filename}` ];
		if (ex.line) {
			errmsg.push(`${ex.message} [line ${ex.line}, column ${ex.col}]`);
		} else {
			errmsg.push(ex.message);
		}
		try {
			contents = contents.split('\n');
			if (ex.line && ex.line <= contents.length) {
				errmsg.push('');
				errmsg.push(`    ${contents[ex.line - 1].replace(/\t/g, ' ')}`);
				if (ex.col) {
					errmsg.push(`    ${' '.repeat(ex.col)}^`);
				}
				errmsg.push('');
			}
		} catch {}
		throw new Error(errmsg.join('\n'));
	}

	const results = {
		original: contents,
		contents: contents,
		symbols: [] // apiTracker plugin will gather these!
	};

	const options = {
		filename: opts.filename,
		retainLines: true,
		presets: [],
		plugins: [
			[ apiTracker, { skipStats: opts.skipStats } ] // track our API usage no matter what
		],
		parserOpts
	};

	const req = createRequire(import.meta.url);

	// transpile
	if (opts.transpile) {
		const __dirname = path.dirname(fileURLToPath(import.meta.url));
		options.plugins.push(expand(__dirname, 'babel-plugins', 'global-this.js'));
		options.plugins.push([ req.resolve('babel-plugin-transform-titanium'), opts.transform ]);
		options.presets.push([ env, { targets: opts.targets } ]);
	}

	// minify
	if (opts.minify) {
		Object.assign(options, {
			minified: true,
			compact: true,
			comments: false
		});

		options.presets.push([ minify, {
			mangle: false,
			deadcode: false
		} ]);

		options.plugins.push(req.resolve('@babel/plugin-transform-property-literals'));
	}

	if (opts.plugins.length) {
		options.plugins.push.apply(options.plugins, opts.plugins);
	}

	let sourceFileName = opts.filename; // used to point to correct original source in sources/sourceRoot of final source map
	const sourceMap = (sourceFileName && sourceFileName.includes('/node_modules/')) ? false : opts.sourceMap;

	// generate a source map
	if (sourceMap) {
		// we manage the source maps ourselves rather than just choose 'inline'
		// because we need to do some massaging
		options.sourceMaps = true;

		// If the original file already has a source map, load it so we can pass it along to babel
		const mapResults = findSourceMap(contents, opts.filename);
		if (mapResults) {
			const existingMap = mapResults.map;
			// location we should try and resolve sources against (after sourceRoot)
			// this may be a pointer to the external .map file, or point to the source file where the map was inlined
			// Note that the spec is pretty ambiguous about this (relative to the SourceMap) and I think Safari may try relative to
			// the original sourceURL too?
			const mapFile = mapResults.filepath;

			// Choose last entry in 'sources' as the one we'll report as original sourceURL
			sourceFileName = existingMap.sources[existingMap.sources.length - 1];

			// If the existing source map has a source root, we need to combine it with source path to get full filepath
			if (existingMap.sourceRoot) {
				// source root may be a filepath, file URI or URL. We assume file URI/path here
				if (existingMap.sourceRoot.startsWith('file://')) {
					existingMap.sourceRoot = existingMap.sourceRoot.slice(7);
				}
				sourceFileName = expand(existingMap.sourceRoot, sourceFileName);
			}
			// if sourceFilename is still not absolute, resolve relative to map file
			sourceFileName = expand(path.dirname(mapFile), sourceFileName);

			// ok, we've mangled the source map enough for babel to consume it
			options.inputSourceMap = existingMap;
		}
	}
	const transformed = babel.transformFromAstSync(ast, contents, options);

	// if the file is ignored by babel config, transformed will be null
	if (transformed && transformed.code) {

		results.contents = transformed.code;

		if (sourceMap) {
			// Drop the original sourceMappingURL comment (for alloy files)
			results.contents = results.contents.replace(SOURCE_MAPPING_URL_REGEXP, '');

			// Point the sourceRoot at the original dir (so the full filepath of the original source can be gleaned from sources/sourceRoot combo)
			// we already have a sourceRoot in the case of an input source map - so don't override that
			if (!transformed.map.sourceRoot) {
				transformed.map.sourceRoot = path.dirname(sourceFileName);
			}
			// Android / Chrome DevTools is sane and can load the source from disk
			// so we can ditch inlining the original source there (I'm looking at you Safari/WebInspector!)
			if (opts.platform === 'android') {
				// NOTE that this will drop some of the alloy template code too. If we want users to see the original source from that, don't delete this!
				// Or alternatively, make alloy report the real template filename in it's source mapping
				delete transformed.map.sourcesContent;
			} else {
				// if they didn't specify the final filepath, assume the js file's base name won't change from the source one (it shouldn't)
				const generatedBasename = path.basename(opts.dest || opts.filename);
				transformed.map.sources = transformed.map.sources.map(s => {
					const sourceBasename = path.basename(s);
					return sourceBasename === generatedBasename ? sourceBasename : s;
				});
				// FIXME: on iOS/Safari - If there are multiple sources, any sources whose basename matches the generated file basename
				// will get their parent path listed as a folder, but WILL NOT SHOW THE FILE!
				// How in the world do we fix this?
				// Well, if there's only one source with the same basename and we rename it to just the basename, that "fixes" the Web Inspector display
				// IDEA: What if we fix iOS to report URIs like /app.js as Android does, will that make it behave more properly?
			}
			transformed.map = sortObject(transformed.map);
			// Do our own inlined source map so we can have control over the map object that is written!
			const base64Contents = Buffer.from(JSON.stringify(transformed.map)).toString('base64');
			// NOTE: We MUST append a \n or else iOS will break, because it injects a ';' after the
			// original file contents when doing it's require() impl
			// NOTE: Construction of the source-map url needs to be obfuscated to avoid unwanted
			// detection of this line as an actual source-map by `source-map-support` package.
			const sourceMapPrefix = 'sourceMappingURL=data:application/json;charset=utf-8;base64';
			results.contents += `\n//# ${sourceMapPrefix},${base64Contents}\n`;
		}
	}
	results.symbols = Array.from(apiTracker.symbols.values()); // convert Set values to Array

	return results;
}

/**
 * @param {string} contents source code to check
 * @param {string} filepath original absolute path to JS file the contents came from
 * @returns {object}
 */
function findSourceMap(contents, filepath) {
	const m = SOURCE_MAPPING_URL_REGEXP.exec(contents);
	if (!m) {
		return null;
	}

	let lastMatch = m.pop();
	// HANDLE inlined data: source maps!
	if (lastMatch.startsWith('data:')) {
		const parts = lastMatch.split(';');
		const contents = parts[2];
		if (contents.startsWith('base64,')) {
			const map = JSON.parse(Buffer.from(contents.slice(7), 'base64').toString('utf-8'));
			return {
				map,
				filepath
			};
		}
		// if starts with file://, drop that
	} else if (lastMatch.startsWith('file://')) {
		lastMatch = lastMatch.slice(7);
	}
	// resolve filepath relative to the original input JS file if we need to...
	const mapFile = expand(path.dirname(filepath), lastMatch);

	try {
		const map = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
		return {
			map,
			filepath: mapFile
		};
	} catch {
		return null;
	}
}

/**
 * Analyzes an HTML file for all app:// JavaScript files
 *
 * @param {String} file - The full path to the HTML file
 * @param {String} [relPath] - A relative path to the HTML file with respect to the Resources directory
 * @returns {Array} An array of app:// JavaScript files
 */
export function analyzeHtmlFile(file, relPath) {
	return analyzeHtml(fs.readFileSync(file, 'utf8'), relPath);
}

/**
 * Analyzes a string containing JavaScript for all Titanium API symbols.
 *
 * @param {String} contents - A string of JavaScript
 * @param {String} [relPath] - A relative path to the HTML file with respect to the Resources directory
 * @returns {Array} An array of app:// JavaScript files
 */
export function analyzeHtml(contents, relPath) {
	const files = [];

	function addFile(src) {
		const m = src && src.match(/^(?:(.*):\/\/)?(.+)/);
		let res = m && m[2];
		if (res) {
			if (!m[1]) {
				if (relPath && res.indexOf('/') !== 0) {
					res = relPath.replace(/\/$/, '') + '/' + res;
				}

				// compact the path
				const p = res.split(/\/|\\/);
				const r = [];
				let q;
				while ((q = p.shift())) {
					if (q === '..') {
						r.pop();
					} else {
						r.push(q);
					}
				}

				files.push(r.join('/'));
			} else if (m[1] === 'app') {
				files.push(res);
			}
		}
	}

	try {
		const dom = new DOMParser({ errorHandler: function () {} }).parseFromString('<temp>\n' + contents + '\n</temp>', 'text/html');
		const doc = dom && dom.documentElement;
		const scripts = doc && doc.getElementsByTagName('script');
		const len = scripts.length;

		if (scripts) {
			for (let i = 0; i < len; i++) {
				const src = scripts[i].getAttribute('src');
				if (src) {
					addFile(src);
				}
			}
		}
	} catch {
		// bad html file, try to manually parse out the script tags
		contents.split('<script').slice(1).forEach(function (chunk) {
			const p = chunk.indexOf('>');
			if (p !== -1) {
				let m = chunk.substring(0, p).match(/src\s*=\s*['"]([^'"]+)/);
				if (!m) {
					// try again without the quotes
					m = chunk.substring(0, p).match(/src\s*=\s*([^>\s]+)/);
				}
				if (m) {
					addFile(m[1]);
				}
			}
		});
	}

	return files;
}

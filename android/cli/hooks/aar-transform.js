/* jshint node: true, esversion: 6 */
'use strict';

/*
 * aar-transform.js: Titanium Android hook to transform Android Archives
 *
 * Copyright (c) 2017, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

const AarTransformer = require('appc-aar-tools').AarTransformer,
	async = require('async'),
	crypto = require('crypto'),
	fs = require('fs-extra'),
	path = require('path');

/**
 * Version number to idenfity the data structure of transform results that are
 * passed to the builder instances. This needs to be changed every time the data
 * structure changes to make sure the cache does not pass outdated data.
 *
 * @type {String}
 * @see doTransform method
 */
const HOOK_DATA_VERSION = '1';

/*
 * Constants do identify the type of a builder instance.
 */
const BUILD_VARIANT_MODULE = 'Module';
const BUILD_VARIANT_APP = 'App';

/*
 * Constants to identify where an .aar file comes from. Currently only Titanium
 * modules and projects are able to provide Android Libraries.
 */
const LIBRARY_ORIGIN_MODULE = 'Module';
const LIBRARY_ORIGIN_PORJECT = 'Project';

exports.cliVersion = '>=3.2';

exports.init = function (logger, config, cli, appc) {
	cli.on('build.pre.compile', {
		priority: 1100,
		post: function (builder, callback) {
			registerHyperloopCompatibilityFixes(cli, builder, appc, logger);
			scanProjectAndStartTransform(builder, logger, callback);
		}
	});

	cli.on('build.module.pre.compile', {
		post: function (builder, callback) {
			scanModuleAndStartTransform(builder, logger, callback);
		}
	});

	cli.on('build.android.dexer', {
		priority: 1100,
		/**
		 * Fixes an issue with Hyperloop 2.1.0 which causes a crash when trying to
		 * override the Android Support Libraries with local .aar files. Hyperloop
		 * 2.1.0 will always manually add our bundled Android Support Libraries
		 * to the dexer paths even if they were replaced by the builder. To fix this
		 * we check the altered dexer paths again and remove any replaced libraries.
		 *
		 * @param {Object} data Hook data
		 * @param {Function} callback Callback function
		 */
		pre: function (data, callback) {
			const builder = data.ctx;
			const dexerOptions = data.args[1].slice(0, 6);
			const dexerPaths = data.args[1].slice(6);
			let hyperloopModule = null;
			builder.nativeLibModules.forEach(function (module) {
				if (module.id === 'hyperloop' && module.version === '2.1.0') {
					hyperloopModule = module;
				}
			});
			if (hyperloopModule && builder.androidLibraries.length > 0) {
				let fixedDexerPaths = [];
				dexerPaths.forEach(function (entryPathAndFilename) {
					if (!this.isExternalAndroidLibraryAvailable(entryPathAndFilename)) {
						fixedDexerPaths.push(entryPathAndFilename);
					} else {
						logger.trace('Removed duplicate library ' + entryPathAndFilename + ' from dexer paths.');
					}
				}, builder);
				data.args[1] = dexerOptions.concat(fixedDexerPaths);
			}
			callback();
		}
	});
};

/**
 * Scans a project for all available Android Archives and transforms them so
 * they can be used in the build process.
 *
 * Iterates over every module in the project and looks for .aar files inside the
 * module's lib folder. Also checks the project's platform/android folder for
 * additional .aar files.
 *
 * @param {AndroidBuilder} builder Intance of the AndroidBuilder
 * @param {Object} logger Logger to use
 * @param {Function} callback Function to call once the transform is complete
 */
function scanProjectAndStartTransform(builder, logger, callback) {
	var projectAndroidLibraries = [];

	builder.nativeLibModules.forEach(function (moduleInfo) {
		var moduleLibrariesPath = path.join(moduleInfo.modulePath, 'lib');
		if (!fs.existsSync(moduleLibrariesPath)) {
			return;
		}

		fs.readdirSync(moduleLibrariesPath).forEach(function (file) {
			if (/\.aar$/.test(file)) {
				projectAndroidLibraries.push({
					aarPathAndFilename: path.join(moduleLibrariesPath, file),
					originType: LIBRARY_ORIGIN_MODULE,
					moduleInfo: moduleInfo
				});
			}
		});
	});

	const androidPlatformPath = path.join(builder.projectDir, 'platform', 'android');
	if (fs.existsSync(androidPlatformPath)) {
		fs.readdirSync(androidPlatformPath).forEach(function (file) {
			if (/\.aar$/.test(file)) {
				projectAndroidLibraries.push({
					aarPathAndFilename: path.join(androidPlatformPath, file),
					originType: LIBRARY_ORIGIN_PORJECT
				});
			}
		});
	}

	transformAndroidLibraries(projectAndroidLibraries, builder, BUILD_VARIANT_APP, logger, callback);
}

/**
 * Scans a module for all available Android Archives and transforms them so
 * they can be used in the build process.
 *
 * All .aar files inside a module's lib folder will be considered.
 *
 * @param {AndroidModuleBuilder} builder Intance of the AndroidModuleBuilder
 * @param {Object} logger Logger to use
 * @param {Function} callback Function to call once the transform is complete
 */
function scanModuleAndStartTransform(builder, logger, callback) {
	const moduleAndroidLibraries = builder.moduleAndroidLibraries || [];
	fs.existsSync(builder.projLibDir) && fs.readdirSync(builder.projLibDir).forEach(function (file) {
		if (/\.aar/.test(file)) {
			moduleAndroidLibraries.push({
				aarPathAndFilename: path.join(builder.projLibDir, file),
				originType: LIBRARY_ORIGIN_MODULE
			});
		}
	});
	transformAndroidLibraries(moduleAndroidLibraries, builder, BUILD_VARIANT_MODULE, logger, callback);
}

/**
 * Starts the actual transform process for all .aar files provided.
 *
 * @param {Array} transformTasks Array of task object, containing info about the file to transform
 * @param {AndroidBaseBuilder} builder The current builder instance
 * @param {String} buildVariant One of the BUILD_VARIANT_* constants
 * @param {Object} logger Logger to use
 * @param {Function} callback Function to call once all tasks are complete
 * @return {undefined}
 */
function transformAndroidLibraries(transformTasks, builder, buildVariant, logger, callback) {
	if (transformTasks.length === 0) {
		logger.trace('No .aar files to transform');
		return callback();
	}

	const aarOutputPath = path.join(builder.buildIntermediatesDir, 'exploded-aar');

	const cache = new SimpleFileCache(path.join(aarOutputPath, 'state.json'));
	if (cache.has('data-version')) {
		if (cache.get('data-version') !== HOOK_DATA_VERSION) {
			logger.trace('Cache data structure is out of date, flushing current cache data.');
			cache.flush();
		}
	}
	cache.set('data-version', HOOK_DATA_VERSION);

	const libraryHashMap = {};
	const packageNameMap = {};

	logger.trace('Pre-compile hook: Transforming bundled .aar libraries');
	async.eachSeries(transformTasks, function (transformTaskInfo, next) {
		const aarPathAndFilename = transformTaskInfo.aarPathAndFilename;
		async.waterfall([
			/**
			 * Create a hash from the AAR file we are about to transform.
			 *
			 * We use that hash to store the result of the transform in a cache so
			 * we can skip the whole transform process on subsequent builds.
			 *
			 * @param {Function} done Function to call once the hash has been computed
			 */
			function hashFile(done) {
				const hash = crypto.createHash('sha1');
				const fileReadStream = fs.createReadStream(aarPathAndFilename);
				fileReadStream.on('readable', function () {
					const data = fileReadStream.read();
					if (data) {
						hash.update(data);
					} else {
						const finalHash = hash.digest('hex');
						done(null, finalHash);
					}
				});
			},

			/**
			 * If there already is a library with the exact same SHA-256 hash we can safely
			 * skip all others with the same hash
			 *
			 * @param {String} hash SHA-256 hash of a .aar file
			 * @param {Function} done Function to call once the dupe check is complete
			 */
			function skipLibraryIfDuplicate(hash, done) {
				if (!libraryHashMap[hash]) {
					return done(null, hash);
				}

				logger.trace('Skipping ' + aarPathAndFilename.cyan + ' because it is a duplicate of ' + libraryHashMap[hash].packageName.cyan);
				done(new SkipLibraryError());
			},

			/**
			 * Starts the actual transform process.
			 *
			 * This first checks the cache if we have a transform result for the .aar
			 * hash stored from a previous built and if the exploded aar directory is
			 * still present. If that's the case we can skip the transform and use the
			 * existing data.
			 *
			 * Remember to update HOOK_DATA_VERSION constant if the data
			 * structure this method returns changes.
			 *
			 * @param {String} hash SHA-256 hash of the AAR file.
			 * @param {Function} done Function to call once the transform is complete
			 */
			function doTransform(hash, done) {
				if (cache.has(hash)) {
					const cacheData = cache.get(hash);
					if (cacheData.task.aarPathAndFilename === transformTaskInfo.aarPathAndFilename && fs.existsSync(cacheData.explodedPath)) {
						logger.trace(aarPathAndFilename.cyan + ' has not changed since last built, skipping transform task.');
						return done(null, cacheData);
					}
				}

				const transformer = new AarTransformer(logger);
				const transformOptions = {
					aarPathAndFilename: aarPathAndFilename,
					outputPath: aarOutputPath,
				};
				if (buildVariant === BUILD_VARIANT_APP) {
					transformOptions.assetsDestinationPath = builder.buildBinAssetsDir;
				} else if (buildVariant === BUILD_VARIANT_MODULE) {
					transformOptions.sharedLibraryDestinationPath = builder.localJniGenDir;
				}
				transformer.transform(transformOptions, function (err, result) {
					if (err) {
						return done(err);
					}

					const libraryInfo = {
						packageName: result.packageName,
						explodedPath: result.explodedPath,
						jars: result.jars,
						nativeLibraries: result.nativeLibraries,
						sha256: hash,
						task: transformTaskInfo
					};

					done(null, libraryInfo);
				});
			},

			/**
			 * Ensures all libraries use a unique package name.
			 *
			 * Errors out when two libraries have the same package name and prints
			 * a detailed error message with instructions how to resolve this issue.
			 * We have to do this due to the lack of Gradle and therefore no available
			 * dependency resolution.
			 *
			 * @param {Object} libraryInfo The result of the library transform task
			 * @param {Function} done Function to call once the unique pacakge name check is done
			 */
			function ensureUniquePackageName(libraryInfo, done) {
				function formatDupeInfo(dupeLibraryInfo) {
					var infoString = dupeLibraryInfo.task.aarPathAndFilename + ' (hash: ' + dupeLibraryInfo.sha256;
					if (dupeLibraryInfo.task.originType === LIBRARY_ORIGIN_MODULE) {
						infoString += ', origin: Module';
					} else if (dupeLibraryInfo.task.originType === LIBRARY_ORIGIN_PORJECT) {
						infoString += ', origin: Project';
					}
					infoString += ')';

					return infoString;
				}

				const existingLibrary = packageNameMap[libraryInfo.packageName];
				if (existingLibrary) {
					let errorMessage = 'Conflicting Android Libraries with package name "' + libraryInfo.packageName + '" detected:\n';
					errorMessage += '  ' + formatDupeInfo(existingLibrary) + '\n';
					errorMessage += '  ' + formatDupeInfo(libraryInfo) + '\n\n';
					if (existingLibrary.task.originType === LIBRARY_ORIGIN_MODULE && libraryInfo.task.originType === LIBRARY_ORIGIN_MODULE) {
						errorMessage += 'Please either select a version of these modules where the conflicting .aar file is the same or you can try removing the .aar file from one module\'s "lib" folder.';
					} else if (existingLibrary.task.originType === LIBRARY_ORIGIN_PORJECT && libraryInfo.task.originType === LIBRARY_ORIGIN_PORJECT) {
						errorMessage += 'Please either remove the duplicate .aar file or change the package name of one Android Library if possible.';
					} else if (existingLibrary.task.originType === LIBRARY_ORIGIN_PORJECT || libraryInfo.task.originType === LIBRARY_ORIGIN_PORJECT) {
						errorMessage += 'Please make sure the .aar files in your project and the module match or try removing either the one in your project or in the module.';
					}
					// @TODO: Add a link to docs where this issue is described more in detail.

					return done(new Error(errorMessage));
				}

				done(null, libraryInfo);
			},

			/**
			 * Updates the Builder instance with the result from our transform task.
			 *
			 * @param {Object} libraryInfo The result of the library transform task
			 * @param {Function} done Function to call once the builder was updated
			 */
			function updateBuilderWithTransformResult(libraryInfo, done) {
				if (buildVariant === BUILD_VARIANT_MODULE) {
					libraryInfo.jars.forEach(function (jarPathAndFilename) {
						builder.classPaths[jarPathAndFilename] = 1;
					});
				}

				libraryHashMap[libraryInfo.sha256] = libraryInfo;
				packageNameMap[libraryInfo.packageName] = libraryInfo;
				builder.androidLibraries.push(libraryInfo);

				cache.set(libraryInfo.sha256, libraryInfo);

				done();
			}
		], function (err) {
			if (!err || err instanceof SkipLibraryError) {
				return next();
			}

			next(err);
		});
	}, function (err) {
		if (err) {
			return callback(err);
		}

		// Clean up the cache if files were removed
		const hashes = Object.keys(libraryHashMap);
		const unusedKeys = cache.keys().filter((key) => {
			// exlcude our version meta data key from being removed
			if (key === 'data-version') {
				return false;
			}
			return hashes.indexOf(key) === -1;
		});
		unusedKeys.forEach((key) => {
			cache.remove(key);
		});

		cache.persist();

		callback();
	});
}

/**
 * Marker error class for skipping libraries
 */
class SkipLibraryError extends Error {

}

/**
 * A simple file cache that uses a JSON file as it's storage.
 *
 * This cache reads its data from the cache file once and then operates on a
 * in-memory basis. Changes can be persisted to disk by calling the persist()
 * method.
 */
class SimpleFileCache {
	/**
	 * Constructs a new cache and loads any date from the cache file.
	 *
	 * @param {String} cachePathAndFilename Absolute path and filename to the cache file
	 */
	constructor(cachePathAndFilename) {
		this.cachePathAndFilename = cachePathAndFilename;
		try {
			this.data = fs.existsSync(cachePathAndFilename) ? JSON.parse(fs.readFileSync(cachePathAndFilename)) : {};
		} catch (e) {
			fs.unlinkSync(cachePathAndFilename);
			this.data = {};
		}
	}

	/**
	 * Gets an entry from this cache identfied by key.
	 * @param {object} key cache key
	 * @return {object|null}
	 */
	get(key) {
		return this.has(key) ? this.data[key] : null;
	}

	/**
	 * Sets an entry in this cache, overwriting any existing data.
	 *
	 * This only happens in-memory, call the persist() method to make sure the
	 * changes will be persisted to disk.
	 *
	 * @param {String} key Key to idenfitify the data
	 * @param {Object} data The data to store
	 */
	set(key, data) {
		this.data[key] = data;
	}

	/**
	 * Checks if this cache contains an entry for the specified key.
	 *
	 * @param {String} key The key to check for
	 * @return {boolean}
	 */
	has(key) {
		return Object.prototype.hasOwnProperty.call(this.data, key);
	}

	/**
	 * Returns all keys that are currently in this cache.
	 * @return {object[]}
	 */
	keys() {
		return Object.keys(this.data);
	}

	/**
	 * Removes the cache entry identified by key from this cache.
	 *
	 * This only happens in-memory, call the persist() method to make sure the
	 * changes will be persisted to disk.
	 *
	 * @param {String} key The key to remove
	 */
	remove(key) {
		if (this.has(key)) {
			delete this.data[key];
		}
	}

	/**
	 * Removes all data from this cache
	 *
	 * This only happens in-memory, call the persist() method to make sure the
	 * changes will be persisted to disk.
	 */
	flush() {
		this.data = {};
	}

	/**
	 * Persists the current state of this cache to disk.
	 */
	persist() {
		var dataToWrite = JSON.stringify(this.data);
		const dir = path.dirname(this.cachePathAndFilename);
		fs.ensureDirSync(dir);
		fs.writeFileSync(this.cachePathAndFilename, dataToWrite);
	}
}

/**
 * Hyperloop versions below 2.2.0 have their own AAR handling which we need to
 * disable by hooking into the affected hooks and reverting the changes Hyperloop
 * made.
 *
 * @param {Object} cli CLI instance
 * @param {Object} builder Builder instance
 * @param {Object} appc Appc node utilities
 * @param {Object} logger Logger instance
 */
function registerHyperloopCompatibilityFixes(cli, builder, appc, logger) {
	let hyperloopModule = null;
	builder.nativeLibModules.some(function (module) {
		if (module.id === 'hyperloop' && appc.version.lt(module.version, '2.2.0')) {
			hyperloopModule = module;
			return true;
		}
		return false;
	});
	if (hyperloopModule === null) {
		return;
	}

	const hyperloopBuildPath = path.join(builder.projectDir, 'build/hyperloop/android');

	cli.on('build.android.aapt', {
		priority: 1100,
		/**
		 * Remove parameters passed to AAPT which are not required anymore since 6.1.0
		 *
		 * @param {Object} data Hook data
		 * @param {Function} callback Callback function
		 * @return {undefined}
		 */
		pre: function (data, callback) {
			logger.trace('Cleaning AAPT options from changes made by Hyperloop');
			const aaptOptions = data.args[1];
			const extraPackagesIndex = aaptOptions.indexOf('--extra-packages') + 1;
			if (extraPackagesIndex === -1) {
				return callback();
			}
			let extraPackages = aaptOptions[extraPackagesIndex];
			let parameterIndex = aaptOptions.indexOf('-S');
			const packageNameRegex = /package="(.*)"/;
			while (parameterIndex !== -1) {
				const resourcePath = aaptOptions[parameterIndex + 1];
				if (resourcePath.indexOf(hyperloopBuildPath) !== -1) {
					const manifestPathAndFilename = path.join(resourcePath, '../AndroidManifest.xml');
					if (fs.existsSync(manifestPathAndFilename)) {
						const manifestContent = fs.readFileSync(manifestPathAndFilename).toString();
						const packageNameMatch = manifestContent.match(packageNameRegex);
						if (packageNameMatch !== null) {
							const packageName = packageNameMatch[1];
							extraPackages = extraPackages.split(':').filter(n => n !== packageName).join(':');
							logger.trace('Removed package ' + packageName + ' from AAPT --extra-packages option');
						}
					}
					aaptOptions.splice(parameterIndex, 2);
					logger.trace('Removed AAPT -S resource path ' + resourcePath);
					parameterIndex = aaptOptions.indexOf('-S', parameterIndex);
				} else {
					parameterIndex = aaptOptions.indexOf('-S', parameterIndex + 1);
				}
			}
			aaptOptions[extraPackagesIndex] = extraPackages;
			callback();
		}
	});

	cli.on('build.android.dexer', {
		priority: 1100,
		/**
		 * Fixes repeated adding of the same JAR to the dexer to avoid crashing
		 * with a dreaded "already added" exception
		 *
		 * @param {Object} data Hook data
		 * @param {Function} callback Callback function
		 */
		pre: function (data, callback) {
			logger.trace('Cleaning dexer paths from changes made by Hyperloop');
			const builder = data.ctx;
			const dexerOptions = data.args[1].slice(0, 6);
			const dexerPaths = data.args[1].slice(6);
			if (builder.androidLibraries.length > 0) {
				const fixedDexerPaths = [];
				dexerPaths.forEach(function (entryPathAndFilename) {
					var isHyperloopExtractedAarPath = entryPathAndFilename.indexOf(hyperloopBuildPath) !== -1;
					if (builder.isExternalAndroidLibraryAvailable(entryPathAndFilename) || isHyperloopExtractedAarPath) {
						logger.trace('Removed ' + entryPathAndFilename + ' from dexer paths.');
					} else {
						fixedDexerPaths.push(entryPathAndFilename);
					}
				}, builder);
				data.args[1] = dexerOptions.concat(fixedDexerPaths);
			}
			callback();
		}
	});
}

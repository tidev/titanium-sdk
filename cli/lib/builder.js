import {
	existsSync,
	lstatSync,
	mkdirSync,
	readdirSync,
	symlinkSync,
	unlinkSync,
	writeFileSync,
	readFileSync,
	realpathSync
} from 'node:fs';
import { basename, dirname, extname, join, parse, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { find as findTiModules } from './timodule.js';
import { expand, pngInfo } from 'node-titanium-sdk/util';
import { rename } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * The base class for platform specific build commands. This ensures some
 * commonality between build commands so that hooks can consistently
 * access build properties.
 *
 * General usage is to extend the Builder class and override the config(),
 * validate(), and run() methods:
 *
 * @example
 * ```js
 * import { Builder } from '../../cli/lib/builder.js';
 *
 * class SomePlatformBuilder extends Builder {
 *     config(logger, config, cli) {
 *         super.config(logger, config, cli);
 *         // TODO: platform specific config code goes here
 *     }
 *
 *     validate(logger, config, cli) {
 *         super.validate(logger, config, cli);
 *         // TODO: platform specific validate code goes here
 *     }
 *
 *     run(logger, config, cli, finished) {
 *         super.run();
 *         // TODO: platform specific run code goes here
 *         finished();
 *     }
 * }
 * ```
 */
export class Builder {
	// conf = {};
	// buildDirFiles = {};
	// titaniumSdkName = undefined;
	// titaniumSdkVersion = undefined;

	/**
	 * Constructs the build state. This needs to be explicitly called from the
	 * derived builder's constructor.
	 *
	 * @param {Module} buildModule The "module" variable from the build command file
	 */
	constructor(buildModule) {
		this.conf = {};
		this.buildDirFiles = {};

		this.titaniumSdkPath = resolve(__dirname, '..', '..');
		this.titaniumSdkName = basename(this.titaniumSdkPath);

		const manifest = readFileSync(join(this.titaniumSdkPath, 'manifest.json'), 'utf8');
		const manifestJson = JSON.parse(manifest);

		this.titaniumSdkVersion = manifestJson.version;

		this.platformPath = this.locatePlatformPath(buildModule);
		this.platformName = basename(this.platformPath);
		this.globalModulesPath = join(this.titaniumSdkPath, '..', '..', '..', 'modules');
		this.packageJson = JSON.parse(readFileSync(join(this.platformPath, 'package.json'), 'utf8'));
	}

	locatePlatformPath(buildModule) {
		let dir = dirname(buildModule.filename);
		const { root } = parse(dir);
		while (dir !== root) {
			if (existsSync(join(dir, 'package.json'))) {
				return dir;
			}
			dir = dirname(dir);
		}
		return null;
	}

	/**
	 * Defines common variables prior to running the build's config(). This super
	 * function should be called prior to the platform-specific build command's config().
	 *
	 * @param {Object} logger - The logger instance
	 * @param {Object} config - The CLI config
	 * @param {Object} cli - The CLI instance
	 */
	config(logger, config, cli) {
		// note: this function must be sync!
		this.logger = logger;
		this.config = config;
		this.cli = cli;
		this.symlinkFilesOnCopy = false;
		this.ignoreDirs = new RegExp(config.get('cli.ignoreDirs'));
		this.ignoreFiles = new RegExp(config.get('cli.ignoreFiles'));
	}

	/**
	 * Validation stub function. Meant to be overwritten.
	 *
	 * @param {Object} logger - The logger instance
	 * @param {Object} config - The CLI config
	 * @param {Object} cli - The CLI instance
	 */
	validate(_logger, _config, cli) {
		// note: this function must be sync?

		this.tiapp = cli.tiapp;
		this.timodule = cli.timodule;
		this.projectDir = cli.argv['project-dir'];
		this.buildDir = join(this.projectDir, 'build', this.platformName);

		this.defaultIcons = [
			join(this.projectDir, `DefaultIcon-${this.platformName}.png`),
			join(this.projectDir, 'DefaultIcon.png')
		];
	}

	/**
	 * Defines common variables prior to running the build. This super function
	 * should be called prior to the platform-specific build command's run().
	 *
	 * @param {Object} _logger - The logger instance
	 * @param {Object} _config - The CLI config
	 * @param {Object} _cli - The CLI instance
	 * @param {Function} _finished - A function to call after the function finishes
	 */
	run(_logger, _config, _cli, _finished) {
		// note: this function must be sync!

		const buildDirFiles = {};
		this.buildDirFiles = buildDirFiles;

		// walk the entire build dir and build a map of all files
		if (existsSync(this.buildDir)) {
			this.logger.trace('Snapshotting build directory');

			// use iterative approach with a stack to avoid deep recursion
			const dirsToProcess = [ this.buildDir ];

			while (dirsToProcess.length > 0) {
				const currentDir = dirsToProcess.pop();
				for (const name of readdirSync(currentDir)) {
					const file = join(currentDir, name).normalize();
					try {
						const stat = lstatSync(file);
						if (stat.isDirectory()) {
							dirsToProcess.push(file);
						} else {
							buildDirFiles[file] = stat;
						}
					} catch {
						buildDirFiles[file] = true;
					}
				}
			}
		}
	}

	/**
	 * Removes a file from the buildDirFiles map.
	 *
	 * @param {String} file - The file to unmark.
	 */
	unmarkBuildDirFile(file) {
		delete this.buildDirFiles[file.normalize()];
	}

	/**
	 * Removes all paths from the buildDirFiles map that start with the specified path.
	 *
	 * @param {String} dir - The path prefix to unmark files.
	 */
	unmarkBuildDirFiles(dir) {
		if (dir.endsWith('*')) {
			dir = dir.substring(0, dir.length - 1);
		} else if (!dir.endsWith('/')) {
			dir += '/';
		}
		dir = dir.normalize();
		for (const file of Object.keys(this.buildDirFiles)) {
			if (file.startsWith(dir)) {
				delete this.buildDirFiles[file];
			}
		}
	}

	/**
	 * Copies or symlinks a file to the specified destination.
	 *
	 * @param {String} src - The file to copy.
	 * @param {String} dest - The destination of the file.
	 * @param {Object} [opts] - An object containing various options.
	 * @param {Boolean} [opts.forceCopy] - When true, forces the file to be copied and not symlinked.
	 * @param {Boolean} [opts.forceSymlink] - When true, ignores `opts.contents` and `opts.forceCopy` and symlinks the `src` to the `dest`.
	 * @param {Buffer|String} [opts.contents] - The contents to write to the file instead of reading the specified source file.
	 */
	copyFileSync(src, dest, opts = {}) {
		const parent = dirname(dest);
		const exists = existsSync(dest);

		mkdirSync(parent, { recursive: true });

		if (!opts.forceSymlink && (opts.forceCopy || !this.symlinkFilesOnCopy || opts.contents)) {
			if (exists) {
				this.logger.debug(`Overwriting ${src} => ${dest}`);
				unlinkSync(dest);
			} else {
				this.logger.debug(`Copying ${src} => ${dest}`);
			}
			writeFileSync(dest, opts.contents || readFileSync(src));
			return true;

		} else if (!exists || (lstatSync(dest).isSymbolicLink() && realpathSync(dest) !== src)) {
			if (exists) {
				unlinkSync(dest);
			}
			this.logger.debug(`Symlinking ${src} => ${dest}`);
			symlinkSync(src, dest);
			return true;
		}
	}

	/**
	* Copies or symlinks a file to the specified destination.
	*
	* @param {String} src - The directory to copy.
	* @param {String} dest - The destination of the files.
	* @param {Object} [opts] - An object containing various options.
	* @param {RegExp} [opts.rootIgnoreDirs] - A regular expression of directories to ignore only in the root directory.
	* @param {RegExp} [opts.ignoreDirs] - A regular expression of directories to ignore.
	* @param {RegExp} [opts.ignoreFiles] - A regular expression of files to ignore.
	* @param {Function} [opts.beforeCopy] - A function called before copying the file. This function can abort the copy or modify the contents being copied.
	* @param {Boolean} [opts.forceCopy] - When true, forces the file to be copied and not symlinked.
	* @param {Function} [opts.afterCopy] - A function called with the result of the file being copied.
	*/
	copyDirSync(src, dest, opts = {}) {
		if (!existsSync(src)) {
			return;
		}

		const copy = (src, dest, isRootDir) => {
			mkdirSync(dest, { recursive: true });

			for (const name of readdirSync(src)) {
				const srcFile = join(src, name);
				const destFile = join(dest, name);

				// skip broken symlinks
				if (!existsSync(srcFile)) {
					return;
				}

				const srcStat = statSync(srcFile);
				if (srcStat.isDirectory()) {
					// we are copying a subdirectory
					if ((isRootDir && opts.rootIgnoreDirs && opts.rootIgnoreDirs.test(name)) || (opts.ignoreDirs && opts.ignoreDirs.test(name))) {
						// ignoring directory
					} else {
						copy(srcFile, destFile);
					}
					return;
				}

				// we're copying a file, check if we should ignore it
				if (opts.ignoreFiles && opts.ignoreFiles.test(name)) {
					return;
				}

				if (typeof opts.beforeCopy === 'function') {
					const result = opts.beforeCopy(srcFile, destFile, srcStat);
					if (result === null) {
						return; // skip
					} else if (result !== undefined) {
						this.logger.debug(`Writing ${srcFile} => ${destFile}`);
						writeFileSync(destFile, result);
						return;
					}
					// fall through and copy the file normally
				}

				const result = this.copyFileSync(srcFile, destFile, opts);
				if (typeof opts.afterCopy === 'function') {
					opts.afterCopy(srcFile, destFile, srcStat, result);
				}
			}
		};
		copy(src, dest, true);
	}

	/**
	 * Validates that all required Titanium Modules defined in the tiapp.xml are
	 * installed.
	 *
	 *
	 * This function is intended to be called asynchronously from the validate()
	 * implementation. In other words, validate() should return a function that
	 * calls this function.
	 *
	 * Note: This function will forcefully exit the application on error!
	 *
	 * @param {String|Array} platformName - One or more platform names to use when finding Titanium modules
	 * @param {String} deployType - The deployment type (development, test, production)
	 */
	async validateTiModules(platformName, deployType) {
		const moduleSearchPaths = [ this.projectDir ];
		const customSDKPaths = this.config.get('paths.sdks');
		const customModulePaths = this.config.get('paths.modules');

		function addSearchPath(p) {
			p = expand(p);
			if (existsSync(p) && !moduleSearchPaths.includes(p)) {
				moduleSearchPaths.push(p);
			}
		}

		for (const p of this.cli.env.os.sdkPaths) {
			addSearchPath(p);
		}
		if (customSDKPaths) {
			for (const p of customSDKPaths) {
				addSearchPath(p);
			}
		}
		if (customModulePaths) {
			for (const p of customModulePaths) {
				addSearchPath(p);
			}
		}

		const modules = await findTiModules(this.cli.tiapp.modules, platformName, deployType, ti.manifest, moduleSearchPaths, this.logger);

		if (modules.missing.length) {
			this.logger.error('Could not find all required Titanium Modules:');
			for (const m of modules.missing) {
				this.logger.error(`   id: ${m.id}\t version: ${m.version || 'latest'}\t platform: ${m.platform}\t deploy-type: ${m.deployType}`);
			}
			this.logger.log();
			process.exit(1);
		}

		if (modules.incompatible.length) {
			this.logger.error('Found incompatible Titanium Modules:');
			for (const m of modules.incompatible) {
				this.logger.error(`   id: ${m.id}\t version: ${m.version || 'latest'}\t platform: ${m.platform}\t min sdk: ${m.manifest && m.manifest.minsdk || '?'}`);
			}
			this.logger.log();
			process.exit(1);
		}

		if (modules.conflict.length) {
			this.logger.error('Found conflicting Titanium modules:');
			for (const m of modules.conflict) {
				this.logger.error(`   Titanium module "${m.id}" requested for both Android and CommonJS platforms, but only one may be used at a time.`);
			}
			this.logger.log();
			process.exit(1);
		}

		return modules;
	}

	/**
	 * Returns the hexadecimal md5 hash of a string.
	 *
	 * @param {String} str - The string to hash
	 *
	 * @returns {String}
	 */
	hash(str) {
		return createHash('md5').update(str || '').digest('hex');
	}

	/**
	 * Generates missing app icons based on the DefaultIcon.png.
	 *
	 * @param {Array<Object>} icons - An array of objects describing the icon size to generate and the destination
	 */
	async generateAppIcons(icons) {
		const requiredMissing = icons.filter(icon => icon.required).length;
		let size = null;

		const fail = () => {
			this.logger.error('Unable to create missing icons:');
			printMissing(this.logger.error);
		};

		const printMissing = (logger, all) => {
			for (const icon of icons) {
				if (all || size === null || icon.width > size.width) {
					logger(`  ${icon.description} - size: ${icon.width}x${icon.height}`);
				}
			}
		};

		let iconLabels;
		if (this.defaultIcons.length > 2) {
			const labels = this.defaultIcons.map(icon => `"${basename(icon)}"`);
			const last = labels.pop();
			iconLabels = `${labels.join(', ')}, or ${last}`;
		} else {
			iconLabels = this.defaultIcons.map(icon => `"${basename(icon)}"`).join(' or ');
		}

		const defaultIcon = this.defaultIcons.find(icon => existsSync(icon));

		if (!defaultIcon) {
			if (requiredMissing === 0) {
				if (icons.length) {
					this.logger.warn('There are missing app icons, but they are not required');
				} else {
					this.logger.warn('There is a missing app icon, but it is not required');
				}
				this.logger.warn(`You can either create the missing icons below or create an image named ${iconLabels} in the root of your project`);
				this.logger.warn('If the DefaultIcon.png image is present, the build will use it to generate all missing icons');
				this.logger.warn('It is highly recommended that the DefaultIcon.png be 1024x1024');
				printMissing(this.logger.warn);
				return;
			}

			if (icons.length) {
				this.logger.error('There are missing required app icons');
			} else {
				this.logger.error('There is a missing required app icon');
			}
			this.logger.error(`You must either create the missing icons below or create an image named ${iconLabels} in the root of your project`);
			this.logger.error('If the DefaultIcon.png image is present, the build will use it to generate all missing icons');
			this.logger.error('It is highly recommended that the DefaultIcon.png be 1024x1024');
			return fail();
		}

		const contents = readFileSync(defaultIcon);
		size = pngInfo(contents);

		if (size.width !== size.height) {
			this.logger.error(`The ${defaultIcon} is ${size.width}x${size.height}, however the width and height must be equal`);
			this.logger.error(`It is highly recommended that the ${defaultIcon} be 1024x1024`);
			return fail();
		}

		this.logger.debug(`Found ${defaultIcon} (${size.width}x${size.height})`);
		if (icons.length) {
			this.logger.info(`Missing ${icons.length} app icons, generating missing icons`);
		} else {
			this.logger.info('Missing 1 app icon, generating missing icon');
		}
		printMissing(this.logger.info, true);

		const filesToRename = [];
		let minRequiredSize = null;
		let minSize = null;
		for (let i = 0; i < icons.length; i++) {
			const icon = icons[i];
			if (icon.required) {
				if (minRequiredSize === null || icon.width > minRequiredSize) {
					minRequiredSize = icon.width;
				}
			} else if (icon.width > size.width) {
				// default icon isn't big enough, so we just skip this image
				this.logger.warn(`${defaultIcon} (${size.width}x${size.height}) is not large enough to generate missing icon "${basename(icon.file)}" (${icon.width}x${icon.height}), skipping`);
				icons.splice(i--, 1);
				continue;
			}
			if (minSize === null || icon.width > minSize) {
				minSize = icon.width;
			}
			if (!extname(icon.file)) {
				// the file doesn't have an extension, so we need to temporarily set
				// one so that the image resizer doesn't blow up
				filesToRename.push({
					from: icon.file + '.png',
					to: icon.file
				});
				icon.file += '.png';
			}
		}

		if (minRequiredSize !== null && size.width < minRequiredSize) {
			this.logger.error(`The ${defaultIcon} must be at least ${minRequiredSize}x${minRequiredSize}`);
			this.logger.error(`It is highly recommended that the ${defaultIcon} be 1024x1024`);
			return fail();
		}

		try {
			await resizeImage(defaultIcon, icons, this.logger);
		} catch (error) {
			this.logger.error(error);
			this.logger.log();
			process.exit(1);
		}

		for (const file of filesToRename) {
			await rename(file.from, file.to);
		}
	}
}

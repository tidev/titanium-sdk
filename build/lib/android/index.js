'use strict';

const path = require('path');
const fs = require('fs-extra');
const git = require('../git');
const utils = require('../utils');
const exec = require('child_process').exec; // eslint-disable-line security/detect-child-process
const copyFile = utils.copyFile;
const copyFiles = utils.copyFiles;
const copyAndModifyFile = utils.copyAndModifyFile;
const globCopy = utils.globCopy;

// Determine if we're running on a Windows machine.
const isWindows = (process.platform === 'win32');

const ROOT_DIR = path.join(__dirname, '..', '..', '..');
const TITANIUM_ANDROID_PATH = path.join(__dirname, '..', '..', '..', 'android');
const DIST_ANDROID_PATH = path.join(__dirname, '..', '..', '..', 'dist', 'android');
const GRADLEW_FILE_PATH = path.join(TITANIUM_ANDROID_PATH, isWindows ? 'gradlew.bat' : 'gradlew');
const V8_STRING_VERSION_REGEXP = /(\d+)\.(\d+)\.\d+\.\d+/;

class Android {
	/**
	 * @param {Object} options options object
	 * @param {String} options.androidSdk path to the Android SDK to build with
	 * @param {String} options.androidNdk path to the Andorid NDK to build with
	 * @param {String} options.sdkVersion version of Titanium SDK
	 * @param {String} options.versionTag version of the Titanium SDK package folder/zip
	 * @param {String} options.gitHash SHA of Titanium SDK HEAD
	 * @constructor
	 */
	constructor (options) {
		this.androidSdk = options.androidSdk;
		this.androidNdk = options.androidNdk;
		this.sdkVersion = options.sdkVersion;
		this.versionTag = options.versionTag;
		this.gitHash = options.gitHash;
	}

	babelOptions() {
		const v8Version = require(path.join(ROOT_DIR, 'android', 'package.json')).v8.version; // eslint-disable-line security/detect-non-literal-require
		const v8VersionGroup = v8Version.match(V8_STRING_VERSION_REGEXP);
		const version = parseInt(v8VersionGroup[1] + v8VersionGroup[2]);

		return {
			targets: {
				chrome: version
			}
		};
	}

	async clean() {
		// Create "local.properties" file which tells gradle where to find the Android SDK/NDK directories.
		await createLocalPropertiesFile(this.androidSdk, this.androidNdk);

		// Clean all Titanium Android projects.
		return gradlew('clean');
	}

	async build() {
		// Create "local.properties" file which tells gradle where to find the Android SDK/NDK directories.
		await createLocalPropertiesFile(this.androidSdk, this.androidNdk);

		// Build the "titanium" library project only.
		process.env.TITANIUM_SDK_BUILD_VERSION = this.sdkVersion;
		process.env.TITANIUM_SDK_BUILD_GIT_HASH = this.gitHash;
		process.env.TITANIUM_SDK_VERSION_TAG = this.versionTag;
		return gradlew(':titanium:assembleRelease');
	}

	async package(packager) {
		console.log('Packaging Android platform...');

		// Create the Android destination directory to be zipped up.
		const ZIP_ANDROID_PATH = path.join(packager.zipSDKDir, 'android');
		await fs.mkdirs(ZIP_ANDROID_PATH);

		// Create "local.properties" file which tells gradle where to find the Android SDK/NDK directories.
		await createLocalPropertiesFile(this.androidSdk, this.androidNdk);

		// Generate a maven repo directory structure and dependencies POM file for last built Titanium AAR library.
		process.env.TITANIUM_SDK_BUILD_VERSION = this.sdkVersion;
		process.env.TITANIUM_SDK_BUILD_GIT_HASH = this.gitHash;
		process.env.TITANIUM_SDK_VERSION_TAG = this.versionTag;
		await gradlew(':titanium:publish');

		// Copy the above created maven directory tree to the destination.
		await copyFile(path.join(TITANIUM_ANDROID_PATH, 'titanium', 'build', 'outputs'), ZIP_ANDROID_PATH, 'm2repository');

		// Copy the Android "package.json" file. Replace its "__VERSION__" with given version.
		await copyAndModifyFile(TITANIUM_ANDROID_PATH, ZIP_ANDROID_PATH, 'package.json', { __VERSION__: this.sdkVersion });

		// Copy Titanium's API/proxy bindings JSON file to the destination.
		// This is needed to do native module builds. Provides core APIs to help generate module proxy bindings.
		await copyFile(DIST_ANDROID_PATH, ZIP_ANDROID_PATH, 'titanium.bindings.json');

		// Copy the Andoid "cli" and "templates" folders.
		await copyFiles(TITANIUM_ANDROID_PATH, ZIP_ANDROID_PATH, [ 'cli', 'templates' ]);

		// Create a "gradle" template directory at destination and copy same gradle files used to build Titanium.
		// Note: This way we build apps/modules with same gradle version we use to build our own library.
		const ZIP_TEMPLATE_GRADLE_PATH = path.join(ZIP_ANDROID_PATH, 'templates', 'gradle');
		await fs.mkdirs(ZIP_TEMPLATE_GRADLE_PATH);
		await copyFiles(TITANIUM_ANDROID_PATH, ZIP_TEMPLATE_GRADLE_PATH, [
			'gradle',       // Directory tree containing the gradle library and properties file.
			'gradlew',      // Shell script used to run gradle on Mac/Linux.
			'gradlew.bat'   // Batch file used to run gradle on Windows.
		]);

		// Copy Titanium's and V8's C/C++ header files to the destination.
		// This is needed to compile the C/C++ code generated for modules and hyperloop.
		const ZIP_HEADER_INCLUDE_PATH = path.join(ZIP_ANDROID_PATH, 'native', 'include');
		await fs.mkdirs(ZIP_HEADER_INCLUDE_PATH);
		await globCopy('**/*.h', path.join(TITANIUM_ANDROID_PATH, 'runtime', 'v8', 'src', 'native'), ZIP_HEADER_INCLUDE_PATH);
		await globCopy('**/*.h', path.join(TITANIUM_ANDROID_PATH, 'runtime', 'v8', 'generated'), ZIP_HEADER_INCLUDE_PATH);
		const v8Props = require(path.join(TITANIUM_ANDROID_PATH, 'package.json')).v8; // eslint-disable-line security/detect-non-literal-require
		const LIBV8_INCLUDE_PATH = path.join(DIST_ANDROID_PATH, 'libv8', v8Props.version, v8Props.mode, 'include');
		await globCopy('**/*.h', LIBV8_INCLUDE_PATH, ZIP_HEADER_INCLUDE_PATH);

		// Copy our C/C++ "*.so" libraries to the destination.
		const TITANIUM_NATIVE_LIBS_PATH = path.join(TITANIUM_ANDROID_PATH, 'titanium', 'build', 'outputs', 'jniLibs');
		const ZIP_NATIVE_LIBS_PATH = path.join(ZIP_ANDROID_PATH, 'native', 'libs');
		await fs.mkdirs(ZIP_NATIVE_LIBS_PATH);
		await fs.copy(TITANIUM_NATIVE_LIBS_PATH, ZIP_NATIVE_LIBS_PATH, {
			filter: async (filePath) => {
				if ((await fs.stat(filePath)).isDirectory()) {
					// Copy all subdirectories.
					return true;
				} else if (filePath.toLowerCase().endsWith('.so')) {
					// Copy all "*.so" files.
					return true;
				}
				return false;
			}
		});

		// Copy our Java annotation processor library to destination.
		// This generates C/C++ interop code between JavaScript and the Java APIs which have these annotations.
		await copyFile(path.join(TITANIUM_ANDROID_PATH, 'kroll-apt', 'build', 'libs'), ZIP_ANDROID_PATH, 'kroll-apt.jar');

		// Discard local changes on the generated "V8Snapshots.h" file.
		return git.discardLocalChange(TITANIUM_ANDROID_PATH, 'runtime/v8/src/native/V8Snapshots.h');
	}
}

async function gradlew(argsString) {
	return new Promise((resolve, reject) => {
		const commandLineString = `"${GRADLEW_FILE_PATH}" ${argsString} --console plain --warning-mode all`;
		const childProcess = exec(commandLineString, { cwd: TITANIUM_ANDROID_PATH });
		childProcess.stdout.pipe(process.stdout);
		childProcess.stderr.pipe(process.stderr);
		childProcess.on('error', reject);
		childProcess.on('exit', (exitCode) => {
			if (exitCode === 0) {
				resolve();
			} else {
				reject(`"gradlew" tool returned exit code: ${exitCode}`);
			}
		});
	});
}

async function createLocalPropertiesFile(sdkPath, ndkPath) {
	// The "local.properties" file must be in the root gradle project directory.
	const fileName = 'local.properties';
	const filePath = path.join(TITANIUM_ANDROID_PATH, fileName);

	// Set up an array of Android SDK directory paths to do an existence check on.
	let sdkTestPaths = [
		sdkPath,                        // Prefer given argument's path 1st if provided and it exists.
		process.env.ANDROID_SDK,        // Titanium's preferred environment variable for setting the path.
		process.env.ANDROID_HOME,       // Google's deprecated variable. Must take priority over ANDROID_SDK_ROOT.
		process.env.ANDROID_SDK_ROOT    // Google's officially supported environment variable.
	];
	if (isWindows) {
		// Add Windows specific paths.
		if (process.env.LOCALAPPDATA) {
			// Android Studio's default install location on Windows.
			sdkTestPaths.push(path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk'));
		}
		sdkTestPaths.push(
			'C:\\android-sdk',
			'C:\\android',
		);
		if (process.env.ProgramFiles) {
			sdkTestPaths.push(path.join(process.env.ProgramFiles, 'android-sdk'));
			sdkTestPaths.push(path.join(process.env.ProgramFiles, 'android'));
		}
		const programFiles32BitPath = process.env['ProgramFiles(x86)'];
		if (programFiles32BitPath) {
			sdkTestPaths.push(path.join(programFiles32BitPath, 'android-sdk'));
			sdkTestPaths.push(path.join(programFiles32BitPath, 'android'));
		}
	} else {
		// Add MacOS/Linux specific paths.
		if (process.env.HOME) {
			// Android Studio's default install location on MacOS.
			sdkTestPaths.push(path.join(process.env.HOME, 'Library', 'Android', 'sdk'));

			// Android Studio's default install location on Linux.
			sdkTestPaths.push(path.join(process.env.HOME, 'Android', 'sdk'));
		}
		sdkTestPaths.push(
			'/opt/android',
			'/opt/android-sdk',
			'/usr/android',
			'/usr/android-sdk'
		);
	}

	// Use the 1st existing SDK path configured in the array above.
	sdkPath = null;
	for (const nextPath of sdkTestPaths) {
		if (nextPath && (await fs.exists(nextPath))) {
			sdkPath = nextPath;
			break;
		}
	}
	if (!sdkPath) {
		const message = 'Failed to find Android SDK directory path.';
		if (await fs.exists(filePath)) {
			console.warn(`Warning: ${message} Will use last generated "${fileName}" file.`);
			return;
		} else {
			throw new Error(message);
		}
	}

	// Set up an array of Android NDK directory paths to do an existence check on.
	const ndkSideBySidePath = path.join(sdkPath, 'ndk');
	let ndkTestPaths = [
		ndkPath,                            // Prefer given argument's path 1st if provided and it exists.
		process.env.ANDROID_NDK,            // Titanium's preferred environment variable for setting the path.
		ndkSideBySidePath,                  // Google installs multiple NDK versions under Android SDK folder as of 2019.
		path.join(sdkPath, 'ndk-bundle')    // Google installed only one NDK version under Android SDK before 2019.
	];

	// Use the 1st existing NDK path configured in the array above.
	ndkPath = null;
	for (const nextPath of ndkTestPaths) {
		if (nextPath && (await fs.exists(nextPath))) {
			if (nextPath === ndkSideBySidePath) {
				// We've found an NDK side-by-side directory which contains folders with version names.
				// Fetch all folders, sort them by version string, and choose the newest versioned folder.
				const fileNames = await fs.readdir(nextPath);
				fileNames.sort(versionStringSortComparer);
				for (let index = fileNames.length - 1; index >= 0; index--) {
					const ndkVersionPath = path.join(nextPath, fileNames[index]);
					if ((await fs.stat(ndkVersionPath)).isDirectory()) {
						ndkPath = ndkVersionPath;
						break;
					}
				}
			} else {
				// NDK directory path exists. Select it.
				ndkPath = nextPath;
			}
			if (ndkPath) {
				break;
			}
		}
	}
	if (!ndkPath) {
		const message = 'Failed to find Android NDK directory path.';
		if (await fs.exists(filePath)) {
			console.warn(`Warning: ${message} Will use last generated "${fileName}" file.`);
			return;
		} else {
			throw new Error(message);
		}
	}

	// Create a "local.properties" file under Titanium's root "android" directory.
	// This is required by the Android gradle plugin or else it will fail to build.
	const fileContentString
		= '# This file was generated by Titanium\'s build tools.\n'
		+ 'sdk.dir=' + sdkPath.replace(/\\/g, '\\\\') + '\n'
		+ 'ndk.dir=' + ndkPath.replace(/\\/g, '\\\\') + '\n';
	fs.writeFile(filePath, fileContentString);
}

function versionStringSortComparer(element1, element2) {
	// Check if the references match. (This is an optimization.)
	// eslint-disable-next-line eqeqeq
	if (element1 == element2) {
		return 0;
	}

	// Compare element types. String types are always greater than non-string types.
	const isElement1String = (typeof element1 === 'string');
	const isElement2String = (typeof element2 === 'string');
	if (isElement1String && !isElement2String) {
		return 1;
	} else if (!isElement1String && isElement2String) {
		return -1;
	} else if (!isElement1String && !isElement2String) {
		return 0;
	}

	// Split version strings into components. Example: '1.2.3' -> ['1', '2', '3']
	// If there is version component lenght mismatch, then pad the rest with zeros.
	const version1Components = element1.split('.');
	const version2Components = element2.split('.');
	const componentLengthDelta = version1Components.length - version2Components.length;
	if (componentLengthDelta > 0) {
		version2Components.push(...Array(componentLengthDelta).fill('0'));
	} else if (componentLengthDelta < 0) {
		version1Components.push(...Array(-componentLengthDelta).fill('0'));
	}

	// Compare the 2 given version strings by their numeric components.
	for (let index = 0; index < version1Components.length; index++) {
		let value1 = Number.parseInt(version1Components[index], 10);
		if (Number.isNaN(value1)) {
			value1 = 0;
		}
		let value2 = Number.parseInt(version2Components[index], 10);
		if (Number.isNaN(value2)) {
			value2 = 0;
		}
		const valueDelta = value1 - value2;
		if (valueDelta !== 0) {
			return valueDelta;
		}
	}
	return 0;
}

module.exports = Android;

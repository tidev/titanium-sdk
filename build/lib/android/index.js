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
const libv8Services = require('../../../android/titanium/libv8-services');

// Determine if we're running on a Windows machine.
const isWindows = (process.platform === 'win32');

const TITANIUM_ANDROID_PATH = path.join(__dirname, '..', '..', '..', 'android');
const DIST_ANDROID_PATH = path.join(__dirname, '..', '..', '..', 'dist', 'android');
const GRADLEW_FILE_PATH = path.join(TITANIUM_ANDROID_PATH, isWindows ? 'gradlew.bat' : 'gradlew');

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
		this.androidSDK = options.androidSdk;
		this.androidNDK = options.androidNdk;
		this.sdkVersion = options.sdkVersion;
		this.versionTag = options.versionTag;
		this.gitHash = options.gitHash;
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

		// Generate a V8 snapshot of our "ti.main.js" script.
		// TODO: Move snapshot code to "titanium_mobile/android/prebuild.js" so "app" test project can use it.
		await libv8Services.updateLibrary();
		const snapshot = require('./snapshot');
		await snapshot.build().catch(error => console.warn('Failed to generate snapshots: ' + error));

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
		await globCopy('**/*.h', path.join(TITANIUM_ANDROID_PATH, 'runtime/v8/src/native'), ZIP_HEADER_INCLUDE_PATH);
		await globCopy('**/*.h', path.join(TITANIUM_ANDROID_PATH, 'runtime/v8/generated'), ZIP_HEADER_INCLUDE_PATH);
		const v8Props = require(path.join(TITANIUM_ANDROID_PATH, 'package.json')).v8; // eslint-disable-line security/detect-non-literal-require
		const LIBV8_INCLUDE_PATH = path.join(DIST_ANDROID_PATH, 'libv8', v8Props.version, v8Props.mode, 'include');
		await globCopy('**/*.h', LIBV8_INCLUDE_PATH, ZIP_HEADER_INCLUDE_PATH);

		// Copy our C/C++ "*.so" libraries to the destination.
		const TITANIUM_NATIVE_LIBS_PATH = path.join(TITANIUM_ANDROID_PATH, 'runtime', 'v8', 'libs');
		const ZIP_NATIVE_LIBS_PATH = path.join(ZIP_ANDROID_PATH, 'native', 'libs');
		await fs.mkdirs(ZIP_NATIVE_LIBS_PATH);
		await fs.copy(TITANIUM_NATIVE_LIBS_PATH, ZIP_NATIVE_LIBS_PATH, {
			filter: (filename) => {
				if (fs.statSync(filename).isDirectory()) {
					// Copy all subdirectories.
					return true;
				} else if (filename.toLowerCase().endsWith('.so')) {
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
				reject();
			}
		});
	});
}

async function createLocalPropertiesFile(sdkPath, ndkPath) {
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
		throw new Error('Failed to find Android SDK directory path.');
	}

	// Set up an array of Android NDK directory paths to do an existence check on.
	let ndkTestPaths = [
		ndkPath,                            // Prefer given argument's path 1st if provided and it exists.
		process.env.ANDROID_NDK,            // Titanium's preferred environment variable for setting the path.
		path.join(sdkPath, 'ndk-bundle')    // Google installs the NDK under the Android SDK directory by default.
	];

	// Use the 1st existing NDK path configured in the array above.
	ndkPath = null;
	for (const nextPath of ndkTestPaths) {
		if (nextPath && (await fs.exists(nextPath))) {
			ndkPath = nextPath;
			break;
		}
	}
	if (!ndkPath) {
		throw new Error('Failed to find Android NDK directory path.');
	}

	// Create a "local.properties" file under Titanium's root "android" directory.
	// This is required by the Android gradle plugin or else it will fail to build.
	const fileContentString
		= '# This file was generated by Titanium\'s build tools.\n'
		+ 'sdk.dir=' + sdkPath.replace(/\\/g, '\\\\') + '\n'
		+ 'ndk.dir=' + ndkPath.replace(/\\/g, '\\\\') + '\n';
	const filePath = path.join(TITANIUM_ANDROID_PATH, 'local.properties');
	return fs.writeFile(filePath, fileContentString);
}

module.exports = Android;

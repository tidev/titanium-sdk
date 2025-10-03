import path from 'node:path';
import fs from 'fs-extra';
import { copyFile, copyFiles, copyAndModifyFile, globCopy } from './utils.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'node:url';

// Determine if we're running on a Windows machine.
const isWindows = (process.platform === 'win32');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..', '..');
const TITANIUM_ANDROID_PATH = path.join(ROOT_DIR, 'android');
const DIST_ANDROID_PATH = path.join(ROOT_DIR, 'dist', 'android');
const GRADLEW_FILE_PATH = path.join(TITANIUM_ANDROID_PATH, isWindows ? 'gradlew.bat' : 'gradlew');
// On CI server, use plain output to avoid nasty progress bars filling up logs
// But on local dev, use the nice UI
const GRADLE_CONSOLE_MODE = (process.env.TRAVIS || process.env.JENKINS || process.env.CI) ? 'plain' : 'rich';
const V8_STRING_VERSION_REGEXP = /(\d+)\.(\d+)\.\d+\.\d+/;

export class AndroidBuilder {
	/**
	 * @param {Object} options options object
	 * @param {String} options.androidSdk path to the Android SDK to build with
	 * @param {String} options.sdkVersion version of Titanium SDK
	 * @param {String} options.versionTag version of the Titanium SDK package folder/zip
	 * @param {String} options.gitHash SHA of Titanium SDK HEAD
	 * @param {string} options.timestamp Value injected for Ti.buildDate
	 * @constructor
	 */
	constructor (options) {
		this.androidSdk = options.androidSdk;
		this.sdkVersion = options.sdkVersion;
		this.versionTag = options.versionTag;
		this.gitHash = options.gitHash;
		this.timestamp = options.timestamp;
	}

	babelOptions() {
		const v8Version = fs.readJsonSync(path.join(ROOT_DIR, 'android', 'package.json')).v8.version;
		const v8VersionGroup = v8Version.match(V8_STRING_VERSION_REGEXP);
		const version = parseInt(v8VersionGroup[1] + v8VersionGroup[2]);

		return {
			targets: {
				chrome: version
			},
			transform: {
				platform: 'android',
				Ti: {
					version: this.sdkVersion,
					buildHash: this.gitHash,
					buildDate: this.timestamp,
					Platform: {
						osname: 'android',
						name: 'android',
						runtime: 'v8',
					},
					Filesystem: {
						lineEnding: '\n',
						separator: '/',
					},
				},
			},
		};
	}

	async clean() {
		// Clean all Titanium Android projects.
		await this.runGradleTask('clean');
	}

	async build() {
		// Set up the build system to fail if unable to generate a V8 snapshot. Needed for fast app startup times.
		// Note: Allow system to override this behavior if environment variable is already defined.
		if (typeof process.env.TI_SDK_BUILD_REQUIRES_V8_SNAPSHOTS === 'undefined') {
			process.env.TI_SDK_BUILD_REQUIRES_V8_SNAPSHOTS = '1';
		}

		// Build the "titanium" library project only.
		process.env.TI_SDK_BUILD_VERSION = this.sdkVersion;
		process.env.TI_SDK_BUILD_GIT_HASH = this.gitHash;
		process.env.TI_SDK_BUILD_TIMESTAMP = this.timestamp;
		process.env.TI_SDK_VERSION_TAG = this.versionTag;
		await this.runGradleTask(':titanium:assembleRelease');
	}

	async package(packager) {
		console.log('Packaging Android platform...');

		// Create the Android destination directory to be zipped up.
		const ZIP_ANDROID_PATH = path.join(packager.zipSDKDir, 'android');
		await fs.mkdirs(ZIP_ANDROID_PATH);

		// Generate a maven repo directory structure and dependencies POM file for last built Titanium AAR library.
		process.env.TI_SDK_BUILD_VERSION = this.sdkVersion;
		process.env.TI_SDK_BUILD_GIT_HASH = this.gitHash;
		process.env.TI_SDK_VERSION_TAG = this.versionTag;
		await this.runGradleTask(':titanium:publish');

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
		const v8Props = fs.readJsonSync(path.join(TITANIUM_ANDROID_PATH, 'package.json')).v8; // eslint-disable-line security/detect-non-literal-require
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
	}

	async runGradleTask(task, args) {
		// Create "local.properties" file which tells gradle where to find the Android SDK directory.
		await createLocalPropertiesFile(this.androidSdk);

		// Run the given gradle task.
		const newArgs = [ task ];
		if (Array.isArray(args)) {
			newArgs.push(...args);
		} else {
			newArgs.push('--console', GRADLE_CONSOLE_MODE, '--warning-mode', 'all');
		}
		await gradlew(newArgs);
	}
}

async function gradlew(args) {
	await new Promise((resolve, reject) => {
		const childProcess = spawn(GRADLEW_FILE_PATH, args, {
			cwd: TITANIUM_ANDROID_PATH,
			shell: process.platform === 'win32',
			stdio: 'inherit'
		});
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

async function createLocalPropertiesFile(sdkPath) {
	// The "local.properties" file must be in the root gradle project directory.
	const fileName = 'local.properties';
	const filePath = path.join(TITANIUM_ANDROID_PATH, fileName);

	// Set up an array of Android SDK directory paths to do an existence check on.
	const sdkTestPaths = [
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

	// Create a "local.properties" file under Titanium's root "android" directory.
	// This is required by the Android gradle plugin or else it will fail to build.
	const fileLines = [
		'# This file was generated by Titanium\'s build tools.',
		'sdk.dir=' + sdkPath.replace(/\\/g, '\\\\')
	];
	await fs.writeFile(filePath, fileLines.join('\n') + '\n');
}

export default AndroidBuilder;

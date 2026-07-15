/**
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

import path from 'node:path';
import fs from 'fs-extra';
import 'colors';
import child_process, { spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { glob } from 'glob';
import { unzip } from '../utils.js';
import { fileURLToPath } from 'node:url';
import { handleBuild, dedupeResults, generateJUnitPrefix, outputJUnitXML, setShowFailedOnly } from './reporter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const titanium = path.resolve(__dirname, '..', '..', '..', 'node_modules', 'titanium', 'bin', 'ti.js');

const exec = promisify(child_process.exec);

export const ROOT_DIR = path.join(__dirname, '../../..');
export const SOURCE_DIR = path.join(ROOT_DIR, 'tests');
export const PROJECT_NAME = 'mocha';
// cert/profile used to build to iOS device. Read from env so non-TiDev
// contributors can run device tests with their own signing identity.
// Falls back to null when unset; the runner must fail fast if a device
// target is requested without these.
export function getSigningConfig() {
	return {
		developerName: process.env.TI_TEST_DEVELOPER_NAME || null,
		provisioningProfileUuid: process.env.TI_TEST_PROVISIONING_PROFILE_UUID || null
	};
}
// app id used
export const APP_ID = 'com.appcelerator.testApp.testing';
export const TMP_DIR = path.join(ROOT_DIR, 'tmp');
export const PROJECT_DIR = path.join(TMP_DIR, PROJECT_NAME);
export const REPORT_DIR = path.join(__dirname, '../../..');
export const JUNIT_TEMPLATE = path.join(__dirname, 'junit.xml.ejs');

// Sniff if we're on Travis/Jenkins
export const isCI = !!(process.env.BUILD_NUMBER || process.env.CI || false);

/**
 * Generates a test app, then runs the app for each platform with our
 * test suite. Outputs the results in a JUnit test report,
 * and holds onto the results in memory as a JSON object (returned to caller)
 *
 * @param {String|String[]}	platforms lits of platforms to build/run against
 * @param {String} [target] Titanium target value to run the tests on, i.e. 'device' || 'emulator' || 'simulator'
 * @param {String} [deviceId] Titanium device id target to run the tests on
 * @param {string} [deployType] 'development' || 'test'
 * @param {string} [deviceFamily] 'ipad' || 'iphone'
 * @param {string} [junitPrefix] A prefix for the junit filename
 * @param {string} [snapshotDir='../../../tests/Resources'] directory to place generated snapshot images
 * @param {string} [failedOnly] Show only failed tests
 * @param {string} [sdkVersion] The SDK version to use
 * @param {string} [logLevel] The log level
 * @returns {Promise<object>}
 */
export async function test(platforms, target, deviceId, deployType, deviceFamily, junitPrefix, snapshotDir = path.join(__dirname, '../../../tests/Resources'), failedOnly, sdkVersion, logLevel) {
	setShowFailedOnly(failedOnly);
	const snapshotPromises = []; // place to stick commands we've fired off to pull snapshot images

	// delete old test app (if does not exist, this will no-op)
	await fs.remove(PROJECT_DIR);

	console.log('Generating project');
	await generateProject(platforms, sdkVersion);

	await copyMochaAssets();
	await addTiAppProperties();

	// run build for each platform, and spit out JUnit report
	try {
		const results = {};
		for (const platform of platforms) {
			const result = await runBuild(platform, target, deviceId, deployType, deviceFamily, snapshotDir, snapshotPromises, sdkVersion, logLevel);
			result.results = dedupeResults(result.results);
			const prefix = generateJUnitPrefix(platform, target, junitPrefix || deviceFamily);
			results[prefix] = result;
			await outputJUnitXML(result, prefix);
		}

		// If we're gathering images, make sure we get them all before we move on
		if (snapshotPromises.length !== 0) {
			try {
				await Promise.all(snapshotPromises);
			} catch (err) {
				// If grabbing an image fails, can we report more details about why?
				// The rejected error should have stdout/stderr properties
				if (err.stderr) {
					console.error(err.stderr);
				}
				if (err.stdout) {
					console.log(err.stdout);
				}
				throw err;
			}
		}

		return results;
	} finally {
		if (target === 'macos') {
			exec(`osascript "${path.join(__dirname, 'close_modals.scpt')}"`);
		}
		if (platforms.includes('android') && (target === undefined || target === 'emulator')) {
			await restoreAndroidEmulator();
		}
	}
}

/**
 * Runs `titanium create` to generate a project for the specific platforms.
 * @param  {string[]} platforms array of platform ids to create a project targeted for
 * @param {string} sdkVersion The SDK version to use
 */
async function generateProject(platforms, sdkVersion) {
	return new Promise((resolve, reject) => {
		// NOTE: Cannot use fork, because the titanium CLI does not call process.exit()!
		const prc = spawn(process.execPath, [ titanium, 'create', '--force',
			'--type', 'app',
			'--platforms', platforms.join(','),
			'--name', PROJECT_NAME,
			'--id', APP_ID,
			'--url', 'https://titaniumsdk.com',
			'--workspace-dir', path.dirname(PROJECT_DIR),
			'--sdk', sdkVersion,
			'--no-banner',
			'--no-prompt' ], { stdio: 'inherit' });
		prc.on('error', reject);
		prc.on('exit', code => {
			if (code !== 0) {
				return reject(new Error('Failed to create project'));
			}
			resolve();
		});
	});
}

/**
 * @returns {Promise<void>}
 */
async function copyMochaAssets() {
	console.log('Copying resources to project...');
	return Promise.all([
		// root-level package.json stuff
		(async () => {
			await Promise.all([
				fs.copy(path.join(SOURCE_DIR, 'fake_node_modules'), path.join(PROJECT_DIR, 'fake_node_modules')),
				fs.copy(path.join(SOURCE_DIR, 'package.json'), path.join(PROJECT_DIR, 'package.json')),
				fs.copy(path.join(SOURCE_DIR, 'package-lock.json'), path.join(PROJECT_DIR, 'package-lock.json')),
			]);
			// then run npm install in root of project
			return npmInstall(PROJECT_DIR);
		})(),
		// babel.config.json
		fs.copy(path.join(SOURCE_DIR, 'babel.config.json'), path.join(PROJECT_DIR, 'babel.config.json')),
		// Resources
		fs.copy(path.join(SOURCE_DIR, 'Resources'), path.join(PROJECT_DIR, 'Resources')),
		// modules
		(async () => {
			await fs.copy(path.join(SOURCE_DIR, 'modules'), path.join(PROJECT_DIR, 'modules'));
			const modulesSourceDir = path.join(SOURCE_DIR, 'modules-source');
			const zipPaths = await glob('*/*/dist/*.zip', { cwd: modulesSourceDir });
			for (const nextZipPath of zipPaths) {
				await unzip(path.join(modulesSourceDir, nextZipPath), PROJECT_DIR);
			}
		})(),
		// platform
		fs.copy(path.join(SOURCE_DIR, 'platform'), path.join(PROJECT_DIR, 'platform')),
		// plugins
		fs.copy(path.join(SOURCE_DIR, 'plugins'), path.join(PROJECT_DIR, 'plugins')),
		// i18n
		fs.copy(path.join(SOURCE_DIR, 'i18n'), path.join(PROJECT_DIR, 'i18n')),
	]);
}

/**
 * @param {string} dir filepath to dir to run npm install within
 * @returns {Promise<{ stdout, stderr }>}
 */
async function npmInstall(dir) {
	// If package-lock.json exists, try to run npm ci --production!
	const args = [ 'ci', '--production' ];
	return new Promise((resolve, reject) => {
		let child;
		if (process.platform === 'win32') {
			child = spawn(
				process.env.comspec || 'cmd.exe',
				[ '/S', '/C', '"', 'npm', ...args, '"' ],
				{
					cwd: dir,
					stdio: 'inherit',
					windowsVerbatimArguments: true
				}
			);
		} else {
			child = spawn(
				'npm',
				args,
				{
					cwd: dir,
					stdio: 'inherit'
				}
			);
		}
		if (child) {
			child.on('exit', code => {
				if (code !== 0) {
					return reject(new Error(`Failed with exit code: ${code}`));
				}
				resolve();
			});
			child.on('error', reject);
		}
	});
}

/**
 * Add required properties for our unit tests!
 * @returns {Promise<void>}
 */
async function addTiAppProperties() {
	const tiapp_xml = path.join(PROJECT_DIR, 'tiapp.xml');
	const tiapp_xml_string = await fs.readFile(tiapp_xml, 'utf8');
	const content = [];
	const insertManifest = () => {
		content.push('\t\t\t<application android:theme="@style/Theme.Titanium.Dark"  android:icon="@mipmap/ic_launcher">');
		content.push('\t\t\t\t<meta-data android:name="com.google.android.geo.API_KEY" android:value="AIzaSyCN_aC6RMaynan8YzsO1HNHbhsr9ZADDlY"/>');
		content.push('\t\t\t\t<uses-library android:name="org.apache.http.legacy" android:required="false" />');
		content.push(`\t\t\t\t<activity android:name=".${PROJECT_NAME.charAt(0).toUpperCase() + PROJECT_NAME.slice(1).toLowerCase()}Activity" android:exported="true">`);
		content.push('\t\t\t\t\t<intent-filter>');
		content.push('\t\t\t\t\t\t<action android:name="android.intent.action.MAIN"/>');
		content.push('\t\t\t\t\t\t<category android:name="android.intent.category.LAUNCHER"/>');
		content.push('\t\t\t\t\t</intent-filter>');
		content.push('\t\t\t\t\t<intent-filter>');
		content.push(`\t\t\t\t\t\t<data android:scheme="${PROJECT_NAME}"/>`);
		content.push('\t\t\t\t\t\t<action android:name="android.intent.action.VIEW"/>');
		content.push('\t\t\t\t\t\t<category android:name="android.intent.category.DEFAULT"/>');
		content.push('\t\t\t\t\t\t<category android:name="android.intent.category.BROWSABLE"/>');
		content.push('\t\t\t\t\t</intent-filter>');
		content.push('\t\t\t\t\t<meta-data android:name="android.app.shortcuts" android:resource="@xml/shortcuts"/>');
		content.push('\t\t\t\t</activity>');
		content.push('\t\t\t</application>');
		content.push('\t\t\t<uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>');
		content.push('\t\t\t<uses-permission android:name="android.permission.RECORD_AUDIO"/>');
	};
	let insertPlistSettings = () => {
		// Enable i18n support for the following languages.
		content.push('\t\t\t\t<key>CFBundleLocalizations</key>');
		content.push('\t\t\t\t<array>');
		content.push('\t\t\t\t\t<string>en</string>');
		content.push('\t\t\t\t\t<string>ja</string>');
		content.push('\t\t\t\t</array>');
		content.push('\t\t\t\t<key>CFBundleAllowMixedLocalizations</key>');
		content.push('\t\t\t\t<true/>');

		// Add permission usage descriptions.
		content.push('\t\t\t\t<key>NSAppleMusicUsageDescription</key>');
		content.push('\t\t\t\t<string>Requesting music library permission</string>');
		content.push('\t\t\t\t<key>NSCameraUsageDescription</key>');
		content.push('\t\t\t\t<string>Requesting camera permission</string>');
		content.push('\t\t\t\t<key>NSContactsUsageDescription</key>');
		content.push('\t\t\t\t<string>Requesting contacts permission</string>');
		content.push('\t\t\t\t<key>NSMicrophoneUsageDescription</key>');
		content.push('\t\t\t\t<string>Requesting microphone permission</string>');
		content.push('\t\t\t\t<key>NSPhotoLibraryUsageDescription</key>');
		content.push('\t\t\t\t<string>Requesting photo library read permission</string>');
		content.push('\t\t\t\t<key>NSPhotoLibraryAddUsageDescription</key>');
		content.push('\t\t\t\t<string>Requesting photo library write permission</string>');
		content.push('\t\t\t\t<key>NSLocationWhenInUseUsageDescription</key>');
		content.push('\t\t\t\t<string>Requesting location permission</string>');
		content.push('\t\t\t\t<key>NSMicrophoneUsageDescription</key>');
		content.push('\t\t\t\t<string>Requesting microphone permission</string>');
		content.push('\t\t\t\t<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>');
		content.push('\t\t\t\t<string>Can we access your location?</string>');
		content.push('\t\t\t\t<key>NSLocationAlwaysUsageDescription</key>');
		content.push('\t\t\t\t<string>Can we always access your location?</string>');
		content.push('\t\t\t\t<key>NSLocationWhenInUseUsageDescription</key>');
		content.push('\t\t\t\t<string>Can we access your location when using the app?</string>');
		content.push('\t\t\t\t<key>NSLocationTemporaryUsageDescriptionDictionary</key>');
		content.push('\t\t\t\t<dict>');
		content.push('\t\t\t\t\t<key>Purpose1</key>');
		content.push('\t\t\t\t\t<string>Can we temporarily access your location?</string>');
		content.push('\t\t\t\t</dict>');

		// Add a static shortcut.
		content.push('\t\t\t\t<key>UIApplicationShortcutItems</key>');
		content.push('\t\t\t\t<array>');
		content.push('\t\t\t\t\t<dict>');
		content.push('\t\t\t\t\t\t<key>UIApplicationShortcutItemIconType</key>');
		content.push('\t\t\t\t\t\t<string>UIApplicationShortcutIconTypeSearch</string>');
		content.push('\t\t\t\t\t\t<key>UIApplicationShortcutItemTitle</key>');
		content.push('\t\t\t\t\t\t<string>static_shortcut1_title</string>');
		content.push('\t\t\t\t\t\t<key>UIApplicationShortcutItemSubtitle</key>');
		content.push('\t\t\t\t\t\t<string>static_shortcut1_subtitle</string>');
		content.push('\t\t\t\t\t\t<key>UIApplicationShortcutItemType</key>');
		content.push('\t\t\t\t\t\t<string>static_shortcut1</string>');
		content.push('\t\t\t\t\t</dict>');
		content.push('\t\t\t\t</array>');
	};

	// Not so smart but this should work...
	tiapp_xml_string.split(/\r?\n/).forEach(line => {
		if (line.indexOf('<application android:icon="@mipmap/ic_launcher"/>') > 0) {
			line = '';
		}

		content.push(line);
		if (line.indexOf('<ios>') >= 0) {
			// force minimum ios sdk version of 13.0
			content.push('\t\t<min-ios-ver>13.0</min-ios-ver>');
		} else if (line.indexOf('<dict>') >= 0) {
			// Insert iOS plist settings after the first <dict> element.
			if (insertPlistSettings) {
				insertPlistSettings();
				insertPlistSettings = null;
			}
		// app thinning breaks tests which expect image files to exist on filesystem normally!
		} else if (line.indexOf('<use-app-thinning>') >= 0) {
			content.pop();
			content.push('\t\t<use-app-thinning>false</use-app-thinning>');
		// Grab contents of modules/modules.xml to inject as module listing for tiapp.xml
		// This allows PR to override
		} else if (line.indexOf('<modules>') >= 0) {
			// remove open tag
			content.pop();
			// now inject the overridden modules listing from xml file
			content.push(fs.readFileSync(path.join(SOURCE_DIR, 'modules', 'modules.xml')).toString());
		// ignore end modules tag since injection above already wrote it!
		} else if (line.indexOf('</modules>') >= 0) {
			content.pop();

			// Include mocha.test.support plugin
			if (!tiapp_xml_string.includes('<plugins>')) {
				content.push('\t<plugins>');
				content.push('\t\t<plugin>mocha.test.support</plugin>');
				content.push('\t</plugins>');
			}

		// Inject some properties used by tests!
		// TODO Move this out to a separate file so PR could override
		} else if (line.indexOf('<property name="ti.ui.defaultunit"') >= 0) {
			content.push('\t<property name="presetBool" type="bool">true</property>');
			content.push('\t<property name="presetDouble" type="double">1.23456</property>');
			content.push('\t<property name="presetInt" type="int">1337</property>');
			content.push('\t<property name="presetString" type="string">Hello!</property>');
			content.push(`\t<property name="isCI" type="bool">${isCI}</property>`);
			content.push('\t<transpile>true</transpile>');
		} else if (line.indexOf('<android xmlns:android') >= 0) {
			// Insert manifest
			if (!tiapp_xml_string.includes('<manifest')) {
				content.push('\t\t<manifest>');
				insertManifest();
				content.push('\t\t</manifest>');
			}

			// Inject Android services
			content.push('\t\t<services>');
			content.push('\t\t\t<service url="ti.android.service.normal.js"/>');
			content.push('\t\t\t<service url="ti.android.service.interval.js" type="interval"/>');
			content.push('\t\t</services>');
		} else if (line.indexOf('<manifest') >= 0) {
			insertManifest();
		}
	});
	return fs.writeFile(tiapp_xml, content.join('\n'));
}

// Keep the test app networked on the Android emulator: whitelist it from the background-idle firewall, and disable Google Photos so it can't steal foreground (Android blocks a backgrounded app's UID from all networks, which surfaces as "Unable to resolve host" ~45s into a run).
async function prepareAndroidEmulator() {
	const commands = [
		`adb shell dumpsys deviceidle whitelist +${APP_ID}`,
		'adb shell pm disable-user --user 0 com.google.android.apps.photos'
	];
	for (const cmd of commands) {
		try {
			await exec(cmd);
		} catch (e) {
			console.warn(`[test] (non-fatal) emulator setup step failed: ${cmd}`);
		}
	}
}

// Restore the emulator after a run: re-enable Google Photos so the user gets it back in the launcher.
async function restoreAndroidEmulator() {
	try {
		await exec('adb shell pm enable com.google.android.apps.photos');
	} catch (e) {
		console.warn('[test] (non-fatal) emulator restore step failed: adb shell pm enable com.google.android.apps.photos');
	}
}

/**
 * @param {string} platform 'android' || 'ios' || 'windows'
 * @param {string} [target] 'emulator' || 'simulator' || 'device' || 'macos'
 * @param {string} [deviceId] uuid of device/simulator to launch
 * @param {string} [deployType=undefined] 'development' || 'test'
 * @param {string} [deviceFamily=undefined] 'ipad' || 'iphone' || undefined
 * @param {string} snapshotDir directory to place generated images
 * @param {Promise[]} snapshotPromises array to hold promises for grabbing generated images
 * @param {string} [sdkVersion] The SDK version to use
 * @param {string} [logLevel] The log level
 * @returns {Promise<object>}
 */
async function runBuild(platform, target, deviceId, deployType, deviceFamily, snapshotDir, snapshotPromises, sdkVersion, logLevel) {

	if (target === undefined) {
		switch (platform) {
			case 'android':
				target = 'emulator';
				break;
			case 'ios':
				target = 'simulator';
				break;
		}
	}

	if (platform === 'android' && target === 'emulator') {
		await prepareAndroidEmulator();
	}

	const args = [
		titanium, 'build',
		'--project-dir', PROJECT_DIR,
		'--platform', platform,
		'--target', target,
		'--sdk', sdkVersion,
		'--log-level', logLevel
	];

	if (deployType) {
		args.push('--deploy-type');
		args.push(deployType);
	}

	if (deviceId) {
		args.push('--C');
		args.push(deviceId);
	}

	if (platform === 'ios') {
		args.push('--hide-error-controller');
		killiOSSimulator();

		if (target === 'device') {
			const { developerName, provisioningProfileUuid } = getSigningConfig();
			if (!developerName || !provisioningProfileUuid) {
				throw new Error(
					'Device-target test run requested but TI_TEST_DEVELOPER_NAME and/or ' +
					'TI_TEST_PROVISIONING_PROFILE_UUID are not set. Set them to your iOS ' +
					'developer identity and provisioning profile UUID, or run against the simulator.'
				);
			}
			args.push('--developer-name');
			args.push(developerName);
			args.push('--pp-uuid');
			args.push(provisioningProfileUuid);
		}

		if (deviceFamily) {
			args.push('--device-family');
			args.push(deviceFamily);
		}
	}

	args.push('--no-prompt');
	args.push('--color');
	const prc = spawn('node', args, { cwd: PROJECT_DIR });
	return handleBuild(prc, target, snapshotDir, snapshotPromises, sdkVersion);
}

async function killiOSSimulator() {
	return new Promise((resolve, reject) => {
		spawn('killall', [ 'Simulator' ]).on('exit', resolve).on('error', reject);
	});
}

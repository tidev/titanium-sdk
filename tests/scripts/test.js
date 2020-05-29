/**
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */
'use strict';

const path = require('path');
const fs = require('fs-extra');
const colors = require('colors'); // eslint-disable-line no-unused-vars
const ejs = require('ejs');
const StreamSplitter = require('stream-splitter');
const spawn = require('child_process').spawn; // eslint-disable-line security/detect-child-process
const titanium = require.resolve('titanium');
const { callbackify, promisify } = require('util');
const exec = promisify(require('child_process').exec); // eslint-disable-line security/detect-child-process
const SOURCE_DIR = path.join(__dirname, '..');
const PROJECT_NAME = 'mocha';
const APP_ID = 'com.appcelerator.testApp.testing';
const PROJECT_DIR = path.join(__dirname, PROJECT_NAME);
const JUNIT_TEMPLATE = path.join(__dirname, 'junit.xml.ejs');

// The special magic strings we expect in the logs!
const GENERATED_IMAGE_PREFIX = '!IMAGE: ';
const DIFF_IMAGE_PREFIX = '!IMG_DIFF: ';
const TEST_END_PREFIX = '!TEST_END: ';
const TEST_START_PREFIX = '!TEST_START: ';
const TEST_SUITE_STOP = '!TEST_RESULTS_STOP!';
const OS_VERSION_PREFIX = 'OS_VERSION: ';

async function clearPreviousApp() {
	// If the project already exists, wipe it
	if (await fs.exists(PROJECT_DIR)) {
		return fs.remove(PROJECT_DIR);
	}
}

/**
 * @param {string} sdkDir filepath to sdk install directory
 * @param {string} sdkVersion version to install
 * @returns {Promise<void>}
 */
async function installSDK(sdkDir, sdkVersion) {
	const args = [ titanium, 'sdk', 'install', '--no-banner', '--no-prompt' ];
	if (sdkVersion.indexOf('.') === -1) { // no period, probably mean a branch
		args.push('-b');
	}
	args.push(sdkVersion);
	args.push('-d'); // make default
	// Add force flag if we find that the modules dir is blown away!
	// eslint-disable-next-line promise/always-return
	if (!(await fs.exists(path.join(sdkDir, 'modules')))) {
		args.push('--force'); // make default
	}
	if (process.env.JENKINS || process.env.JENKINS_URL) {
		args.push('--no-progress-bars');
	}

	console.log(`Installing SDK with args: ${args.join(' ')}`);
	return new Promise((resolve, reject) => {
		const prc = spawn('node', args, { stdio: 'inherit' });
		prc.on('exit', code => {
			if (code !== 0) {
				return reject(new Error('Failed to install SDK'));
			}
			resolve();
		});
	});
}

/**
 * Look up the full path to the SDK we just installed (the SDK we'll be hacking
 * to add our locally built Windows SDK into).
 *
 * @returns {string}
 **/
async function getSDKInstallDir() {
	// TODO: Use fork since we're spawning off another node process
	const { stdout, _stderr } = await exec(`node "${titanium}" info -o json -t titanium`);
	const out = JSON.parse(stdout);
	const selectedSDK = out.titaniumCLI.selectedSDK; // may be null!
	if (selectedSDK) {
		return out.titanium[selectedSDK].path;
	}
	// Hope first sdk listed is the one we want
	return out.titanium[Object.keys(out.titanium)[0]].path;
}

/**
 * Runs `titanium create` to generate a project for the specific platforms.
 * @param  {string[]} platforms array of platform ids to create a project targeted for
 */
async function generateProject(platforms) {
	return new Promise((resolve, reject) => {
		// NOTE: Cannot use fork, because the titanium CLI does not call process.exit()!
		const prc = spawn(process.execPath, [ titanium, 'create', '--force',
			'--type', 'app',
			'--platforms', platforms.join(','),
			'--name', PROJECT_NAME,
			'--id', APP_ID,
			'--url', 'http://www.appcelerator.com',
			'--workspace-dir', __dirname,
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
 * Add required properties for our unit tests!
 * @returns {Promise<void>}
 */
async function addTiAppProperties() {
	const tiapp_xml = path.join(PROJECT_DIR, 'tiapp.xml');
	const tiapp_xml_string = await fs.readFile(tiapp_xml, 'utf8');
	const content = [];
	const insertManifest = () => {
		content.push('\t\t\t<application>');
		content.push('\t\t\t\t<meta-data android:name="com.google.android.geo.API_KEY" android:value="AIzaSyCN_aC6RMaynan8YzsO1HNHbhsr9ZADDlY"/>');
		content.push('\t\t\t\t<uses-library android:name="org.apache.http.legacy" android:required="false" />');
		content.push('\t\t\t</application>');
		content.push('\t\t\t<uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>');
	};

	// Not so smart but this should work...
	tiapp_xml_string.split(/\r?\n/).forEach(line => {
		// replace generated guid with appc analytics app guid
		if (line.indexOf('\t<guid>') >= 0) {
			line = '\t<guid>1c4b748c-7c16-4df1-bd5c-4ffe6240286e</guid>';
		}

		content.push(line);
		if (line.indexOf('<ios>') >= 0) {
			// Force using the JScore on the emulator, not TiCore!
			content.push('\t\t<use-jscore-framework>true</use-jscore-framework>');
			// force minimum ios sdk version of 12.0
			content.push('\t\t<min-ios-ver>12.0</min-ios-ver>');
		// app thinning breaks tests which expect image files to exist on filesystem normally!
		} else if (line.indexOf('<use-app-thinning>') >= 0) {
			content.pop();
			content.push('\t\t<use-app-thinning>false</use-app-thinning>');
		// Grab contents of modules/modules.xml to inject as moduel listing for tiapp.xml
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

/**
 * @param {string} dir filepath to dir to run npm install within
 * @returns {Promise<{ stdout, stderr }>}
 */
async function npmInstall(dir) {
	// If package-lock.json exists, try to run npm ci --production!
	let args;
	if (await fs.exists(path.join(dir, 'package-lock.json'))) {
		args = [ 'ci', '--production' ];
	} else {
		args = [ 'install', '--production' ];
	}
	return new Promise((resolve, reject) => {
		spawn('npm', args, { cwd: dir, stdio: 'inherit' })
			.on('exit', code => {
				if (code !== 0) {
					return reject(new Error(`Failed with exit code: ${code}`));
				}
				resolve();
			}).on('error', reject);
	});
}

/**
 * @returns {Promise<void>}
 */
async function copyMochaAssets() {
	console.log('Copying resources to project...');
	// TODO: Support root-level package.json!
	const resourcesDir = path.join(PROJECT_DIR, 'Resources');
	return Promise.all([
		// Resources
		(async () => {
			await fs.copy(path.join(SOURCE_DIR, 'Resources'), resourcesDir);
			if (await fs.pathExists(path.join(resourcesDir, 'package.json'))) {
				return npmInstall(resourcesDir);
			}
		})(),
		// modules
		fs.copy(path.join(SOURCE_DIR, 'modules'), path.join(PROJECT_DIR, 'modules')),
		// plugins
		fs.copy(path.join(SOURCE_DIR, 'plugins'), path.join(PROJECT_DIR, 'plugins')),
		// i18n
		fs.copy(path.join(SOURCE_DIR, 'i18n'), path.join(PROJECT_DIR, 'i18n')),
	]);
}

async function killiOSSimulator() {
	return new Promise((resolve, reject) => {
		spawn('killall', [ 'Simulator' ]).on('exit', resolve).on('error', reject);
	});
}

/**
 * @param {string} platform 'android' || 'ios' || 'windows'
 * @param {string} [target] 'emulator' || 'simulator' || 'device' || 'wp-emulator'
 * @param {string} [deviceId] uuid of device/simulator to launch
 * @param {string} [architecture] only for 'windows' platform
 * @param {string} [deployType=undefined] 'development' || 'test'
 * @param {string} [deviceFamily=undefined] 'ipad' || 'iphone' || undefined
 * @param {string} snapshotDir directory to place generated images
 * @param {Promise[]} snapshotPromises array to hold promises for grabbign generated images
 */
async function runBuild(platform, target, deviceId, architecture, deployType, deviceFamily, snapshotDir, snapshotPromises) {

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

	const args = [
		titanium, 'build',
		'--project-dir', PROJECT_DIR,
		'--platform', platform,
		'--target', target,
		'--log-level', 'info'
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
			args.push('--developer-name');
			args.push('QE Department (C64864TF2L)');
			args.push('--pp-uuid');
			args.push('20109694-2d18-4c78-ab6a-2195e3719c6b');
		}

		if (deviceFamily) {
			args.push('--device-family');
			args.push(deviceFamily);
		}
	}

	if (platform === 'windows') {
		if (target !== 'wp-emulator') {
			args.push('--forceUnInstall');
		}

		if (architecture) {
			args.push('--architecture');
			args.push(architecture);
		}
	}

	args.push('--no-prompt');
	args.push('--color');
	// TODO Use fork since we're spawning off another node process
	const prc = spawn('node', args);
	return handleBuild(prc, target, snapshotDir, snapshotPromises);
}

/**
 * Once a build has been spawned off this handles grabbing the test results from the output.
 * @param {child_process} prc  Handle of the running process from spawn
 * @param {string} target 'emulator' || 'simulator' || 'device'
 * @param {string} snapshotDir directory to place generated images
 * @param {Promise[]} snapshotPromises array to hold promises for grabbign generated images
 * @returns {Promise<void>}
 */
async function handleBuild(prc, target, snapshotDir, snapshotPromises) {
	return new Promise((resolve, reject) => {
		const results = [];
		let output = '';
		let stderr = '';
		let sawTestEnd = false;
		let partialTestEnd = '';
		let devices = {};

		const splitter = prc.stdout.pipe(StreamSplitter('\n'));
		// Set encoding on the splitter Stream, so tokens come back as a String.
		splitter.encoding = 'utf8';

		function tryParsingTestResult(resultJSON, device, os_version) {
			//  grab out the JSON and add to our result set
			try {
				const result = JSON.parse(massageJSONString(resultJSON));
				result.stdout = output; // record what we saw in output during the test
				result.stderr = stderr; // record what we saw in output during the test
				result.device = device && device.length ? device : undefined; // specify device if available
				result.os_version = os_version; // specify os version if available
				results.push(result);
				output = ''; // reset output
				stderr = ''; // reset stderr
				partialTestEnd = ''; // reset partial test output
				sawTestEnd = false; // reset flag indicating we saw partial test output
				return true;
			} catch (err) {
				// if we fail to parse as JSON, assume we got truncated output!
				partialTestEnd = resultJSON;
				sawTestEnd = true;
				return false;
			}
		}

		function getDeviceName(token) {
			const matches = /^[\s\b]+\[([^\]]+)\]\s/g.exec(token.substring(token.indexOf(':') + 1));
			if (matches && matches.length === 2) {
				return matches[1];
			}
			return '';
		}
		// pipe along the output as we go, retaining ANSI colors
		splitter.on('data', data => process.stdout.write(data));
		// handle the newline split output
		splitter.on('token', function (token) {

			// Workaround to launch iOS application on device.
			if (token.includes('Please manually launch the application')) {
				console.log('Launching application using ios-deploy');
				const deploy = spawn('ios-deploy', [ '-L', '-b', path.join(__dirname, 'mocha/build/iphone/build/Products/Debug-iphoneos/mocha.app') ]);
				let result = '';
				deploy.stdout.on('data', data => result += data);
				deploy.on('close', _e => console.log(result));
			}

			// Fail immediately if android emulator is forcing restart
			if (token.includes('Module config changed, forcing restart due')) {
				prc.kill(); // quit this build...
				return reject(new Error(`Failed to finish test suite before Android emulator killed ap due to updated module: ${token}`));
			}

			// we saw test end before, but failed to parse as JSON because we got partial output, so continue
			// trying until it's happy (and resets sawTestEnd to false)
			if (sawTestEnd) {
				let modifiedToken = token;
				// strip off leading log level prefix!
				if (modifiedToken.startsWith('[INFO]')) {
					modifiedToken = modifiedToken.substring(8);
					// colored output?
				} else if (modifiedToken.startsWith('\u001b[32m[INFO] \u001b[39m')) {
					// technically we get these characters on a colored [INFO] log prefix:
					// <Buffer 1b 5b 33 32 6d 5b 49 4e 46 4f 5d 20 1b 5b 33 39 6d 3a 20 08 08 20 08 20>
					//     \u001b [  3  2  m  [  I  N  F  O  ]  <space>\u001b[39m :  <space><backspace><backspace><space><backspace><space>
					modifiedToken = modifiedToken.substring(24);
				}
				// FIXME: IF we see another !TEST_START or !TEST_RESULTS_STOP, can we fail this test and move on?
				tryParsingTestResult(partialTestEnd + modifiedToken);
				return;
			}

			// check for test start
			if (token.includes(TEST_START_PREFIX)) {
				// grab out the JSON and add to our result set
				output = '';
				stderr = '';
				return;
			}

			// check for generated images
			if (token.includes(GENERATED_IMAGE_PREFIX)) {
				snapshotPromises.push(grabGeneratedImage(token, target, snapshotDir));
				return;
			}

			// check for mismatched images
			if (token.includes(DIFF_IMAGE_PREFIX)) {
				snapshotPromises.push(handleMismatchedImage(token, target, snapshotDir));
				return;
			}

			// obtain os version
			if (token.includes(OS_VERSION_PREFIX)) {
				const device = getDeviceName(token);
				devices[device] = {
					version: token.slice(token.indexOf(OS_VERSION_PREFIX) + OS_VERSION_PREFIX.length).trim(),
					completed: false
				};
				return;
			}

			// check for test end
			const testEndIndex = token.indexOf(TEST_END_PREFIX);
			if (testEndIndex !== -1) {
				const device = getDeviceName(token);
				tryParsingTestResult(token.slice(testEndIndex + TEST_END_PREFIX.length).trim(), device, devices[device].version);
				return;
			}

			// check for suite end
			if (token.includes(TEST_SUITE_STOP)) {

				// device completed tests
				const device = getDeviceName(token);
				devices[device].completed = true;

				// check if all devices have completed tests
				for (const d in devices) {

					// not all devices have completed tests
					// continue without processing results
					if (!devices[d].completed) {
						return;
					}
				}

				prc.kill(); // ok, tests finished as expected, kill the process
				return resolve({ date: (new Date()).toISOString(), results: results });
			}

			// Handle when app crashes and we haven't finished tests yet!
			if (token.includes('-- End application log ----') || token.includes('-- End simulator log ---')) {
				prc.kill(); // quit this build...
				return reject(new Error('Failed to finish test suite before app crashed and logs ended!')); // failed too many times
			}

			// normal output (no test start/end, suite end/crash)
			// append output to our string for stdout
			output += token + '\n';
		});
		// Any errors that occur on a source stream will be emitted on the
		// splitter Stream, if the source stream is piped into the splitter
		// Stream, and if the source stream doesn't have any other error
		// handlers registered.
		splitter.on('error', reject);

		prc.stderr.on('data', data => {
			process.stderr.write(data); // pipe along the stderr as we go, retaining ANSI colors
			stderr += data.toString().trim() + '\n'; // store the color-stripped version?
		});

		prc.on('close', code => {
			if (code !== 0) {
				return reject(new Error(`Exited unexpectedly with exit code: ${code}`));
			}
		});
	});
}

function massageJSONString(testResults) {
	// preserve newlines, etc - use valid JSON
	return testResults.replace(/\\n/g, '\\n')
		.replace(/\\'/g, '\\\'')
		.replace(/\\"/g, '\\"')
		.replace(/\\&/g, '\\&')
		.replace(/\\r/g, '\\r')
		.replace(/\\t/g, '\\t')
		.replace(/\\b/g, '\\b')
		.replace(/\\f/g, '\\f')
		// remove non-printable and other non-valid JSON chars
		.replace(/[\u0000-\u0019]+/g, ''); // eslint-disable-line no-control-regex
}

/**
 * Attempts to "grab" generated images
 * @param {string} token line of output
 * @param {string} target 'emulator' || 'simulator' || 'device'
 * @param {string} snapshotDir directory to place generated images
 * @returns {Promise<string>}
 */
async function grabGeneratedImage(token, target, snapshotDir) {
	const imageIndex = token.indexOf(GENERATED_IMAGE_PREFIX);
	const trimmed = token.slice(imageIndex + GENERATED_IMAGE_PREFIX.length).trim();
	const details = JSON.parse(trimmed);
	if (target === 'device') {
		// TODO: Give details on the current test that generated it?
		console.error(`Cannot grab generated image ${details.relativePath} from a device. Please run locally on a simulator and add the image to the suite.`);
		return;
	}

	const dest = path.join(snapshotDir, details.platform, details.relativePath);
	return saveAppImage(details, dest);
}

/**
 * @param {object} details json from test output about image
 * @param {string} details.path path to generated image file
 * @param {string} details.platform name of the platform
 * @param {string} dest destination filepath
 */
async function saveAppImage(details, dest) {
	if (details.path.startsWith('file://')) {
		details.path = details.path.slice(7);
	}

	if (details.platform === 'android') {
		// Pull the file via adb shell
		// FIXME: what if android sdk platform-tools/bin isn't on PATH!?
		await exec(`adb shell "run-as ${APP_ID} cat '${details.path}'" > ${dest}`);
		// TODO: handle device(s) vs emulator(s)
		return dest;
	} else {
		// copy the expected image to some location
		// iOS - How do we grab the image?
		// For ios sim, we should just be able to do a file copy
		// FIXME: iOS device isn't (and may not be able to be) handled!
		await fs.copy(details.path, dest);
		return dest;
	}
}

/**
 * Attempts to "grab" the actual image and place it in known location side-by-side with expected image
 * @param {string} token line of output
 * @param {string} target 'emulator' || 'simulator' || 'device'
 * @param {string} snapshotDir directory to place generated images
 * @returns {Promise<string>}
 */
async function handleMismatchedImage(token, target, snapshotDir) {
	const imageIndex = token.indexOf(DIFF_IMAGE_PREFIX);
	const trimmed = token.slice(imageIndex + DIFF_IMAGE_PREFIX.length).trim();
	const details = JSON.parse(trimmed);

	const expected = path.join(snapshotDir, details.platform, details.relativePath);
	const diffDir = path.join(snapshotDir, '..', 'diffs', details.platform, details.relativePath.slice(0, -4)); // drop '.png'
	await fs.ensureDir(diffDir);
	await fs.copy(expected, path.join(diffDir, 'expected.png'));

	if (target === 'device') {
		// TODO: Give details on the current test that generated it?
		console.error(`Cannot grab generated image ${details.relativePath} from a device. Please run locally on a simulator and add the image to the suite.`);
		return;
	}

	const actual = path.join(diffDir, 'actual.png');
	return saveAppImage(details, actual);
}

function generateJUnitPrefix(platform, target, deviceFamily) {
	let prefix = platform;
	if (target) {
		prefix += '.' + target;
	}
	if (deviceFamily) {
		prefix += '.' + deviceFamily;
	}
	return prefix;
}

/**
 * Converts JSON results of unit tests into a JUnit test result XML formatted file.
 *
 * @param {Object} jsonResults JSON containing results of the unit test output
 * @param {String} prefix prefix for test names to identify them uniquely
 */
async function outputJUnitXML(jsonResults, prefix) {
	// We need to go through the results and separate them out into suites!
	const suites = {};
	jsonResults.results.forEach(item => {
		const s = suites[item.suite] || { tests: [], suite: item.suite, duration: 0, passes: 0, failures: 0, start: '' }; // suite name to group by
		s.tests.unshift(item);
		s.duration += item.duration;
		if (item.state === 'failed') {
			s.failures += 1;
		} else if (item.state === 'passed') {
			s.passes += 1;
		}
		suites[item.suite] = s;
	});
	const keys = Object.keys(suites);
	const values = keys.map(v => suites[v]);
	const template = await fs.readFile(JUNIT_TEMPLATE, 'utf8');
	const r = ejs.render(template,  { suites: values, prefix: prefix });

	// Write the JUnit XML to a file
	return fs.writeFile(path.join(__dirname, 'junit.' + prefix + '.xml'), r);
}

/**
 * Remove all CI SDKs installed. Skip GA releases, and skip the passed in SDK path we just installed.
 * @param  {String} sdkPath The SDK we just installed for testing. Keep this one in case next run can use it.
 * @returns {Promise<void>}
 */
async function cleanNonGaSDKs(sdkPath) {
	// FIXME Use fork since we're spawning off another node process!
	const { stdout } = await exec(`node "${titanium}" sdk list -o json`);
	const out = JSON.parse(stdout);
	const installedSDKs = out.installed;
	// Loop over the SDKs and remove any where the key doesn't end in GA, or the value isn't sdkPath
	return Promise.all(Object.keys(installedSDKs).map(async item => {
		const thisSDKPath = installedSDKs[item];
		if (item.slice(-2) === 'GA') { // skip GA releases
			return;
		}
		if (thisSDKPath === sdkPath) { // skip SDK we just installed
			return;
		}
		console.log(`Removing ${thisSDKPath}`);
		return fs.remove(thisSDKPath);
	}));
}

/**
 * @return {Promise<string>} path to Titanium SDK root dir
 */
async function sdkDir() {
	try {
		const { stdout, _stderr } = await exec(`node "${titanium}" config sdk.defaultInstallLocation -o json`);
		return JSON.parse(stdout.trim());
	} catch (error) {
		const osName = require('os').platform();
		if (osName === 'win32') {
			return path.join(process.env.ProgramData, 'Titanium');
		} else if (osName === 'darwin') {
			return path.join(process.env.HOME, 'Library', 'Application Support', 'Titanium');
		} else if (osName === 'linux') {
			return path.join(process.env.HOME, '.titanium');
		}
	}
}

/**
 * @param {string} sdkDir filepath to sdk install directory
 * @returns {Promise<void>}
 */
async function cleanupModules(sdkDir) {
	const moduleDir = path.join(sdkDir, 'modules');
	const pluginDir = path.join(sdkDir, 'plugins');

	return Promise.all([ moduleDir, pluginDir ].map(async dir => {
		if (await fs.exists(dir)) {
			console.log(`Removing ${dir}`);
			await fs.remove(dir);
		} else {
			console.log(`${dir} doesnt exist`);
		}
	}));
}

/**
 * Installs a Titanium SDK to test against, generates a test app, then runs the
 * app for each platform with our mocha test suite. Outputs the results in a JUnit
 * test report, and holds onto the results in memory as a JSON object.
 *
 * @param {String} branch branch/zip/url of SDK to install. If null/undefined, no SDK will be installed
 * @param {String|String[]}	platforms [description]
 * @param {String} target Titanium target value to run the tests on
 * @param {String} deviceId Titanium device id target to run the tests on
 * @param {Boolean} skipSdkInstall Don't try to install an SDK from `branch`
 * @param {Boolean} cleanup Delete all the non-GA SDKs when done? Defaults to true if we installed an SDK
 * @param {String} architecture	Target architecture to build. Only valid on Windows
 * @param {string} [deployType] deployType
 * @param {string} [deviceFamily] 'ipad' || 'iphone'
 * @param {string} [snapshotDir='../Resources'] directory to place generated snapshot images
 */
async function test(branch, platforms, target, deviceId, skipSdkInstall, cleanup, architecture, deployType, deviceFamily, snapshotDir = path.join(__dirname, '../Resources')) {
	// if we're not skipping sdk install and haven't specific whether to clean up or not, default to cleaning up non-GA SDKs
	if (!skipSdkInstall && cleanup === undefined) {
		cleanup = true;
	}

	const snapshotPromises = []; // place to stick commands we've fired off to pull snapshot images

	const dir = await sdkDir();

	// Only ever do this in CI so unless someone changes this code,
	// or for some reason these are set on your machine it will never
	// remove when running locally. That way no way can be angry at me
	if (process.env.JENKINS || process.env.JENKINS_URL) {
		await cleanupModules(dir);
	}

	// install new SDK and delete old test app in parallel
	await Promise.all([
		(async () => {
			if (!skipSdkInstall && branch) {
				return installSDK(dir, branch);
			}
		})(),
		clearPreviousApp(),
	]);

	// Record the SDK we just installed so we retain it when we clean up at end
	const sdkPath = await getSDKInstallDir();

	console.log('Generating project');
	await generateProject(platforms);

	await copyMochaAssets();
	await addTiAppProperties();

	// run build for each platform, and spit out JUnit report
	const results = {};
	for (const platform of platforms) {
		const result = await runBuild(platform, target, deviceId, architecture, deployType, deviceFamily, snapshotDir, snapshotPromises);
		const prefix = generateJUnitPrefix(platform, target, deviceFamily);
		results[prefix] = result;
		outputJUnitXML(result, prefix);
	}

	// If we're gathering images, make sure we get them all before we move on
	if (snapshotPromises.length !== 0) {
		await Promise.all(snapshotPromises);
	}

	if (cleanup) {
		await cleanNonGaSDKs(sdkPath);
	}

	// Only ever do this in CI so unless someone changes this code,
	// or for some reason these are set on your machine it will never
	// remove when running locally. That way no way can be angry at me
	if (process.env.JENKINS || process.env.JENKINS_URL) {
		await cleanupModules(dir);
	}

	return results;
}

/**
 * @param {object[]} results test results
 */
async function outputResults(results) {
	const suites = {};

	// start
	console.log();

	results.forEach(item => {
		const s = suites[item.suite] || { tests: [], suite: item.suite, duration: 0, passes: 0, failures: 0, start: '' }; // suite name to group by
		s.tests.unshift(item);
		s.duration += item.duration;
		if (item.state === 'failed') {
			s.failures += 1;
		} else if (item.state === 'passed') {
			s.passes += 1;
		}
		suites[item.suite] = s;
	});

	let indents = 0,
		n = 0,
		passes = 0,
		failures = 0,
		skipped = 0;
	function indent() {
		return Array(indents).join('  ');
	}
	const keys = Object.keys(suites);
	keys.forEach(v => {
		++indents;
		console.log('%s%s', indent(), v);
		// now loop through the tests
		suites[v].tests.forEach(test => {
			if (test.state === 'skipped') {
				skipped++;
				console.log(indent() + '  - %s'.cyan, test.title);
			} else if (test.state === 'failed') {
				failures++;
				console.log(indent() + '  %d) %s'.red, ++n, test.title);
				++indents;
				console.log(indent() + '  %s'.red, JSON.stringify(test));
				--indents;
			} else {
				passes++;
				console.log(indent() + '  ✓'.green + ' %s '.gray, test.title);
			}
		});
		--indents;
		if (indents === 1) {
			console.log();
		}
	});

	// Spit out overall stats: test count, failure count, pending count, pass count.
	const total = skipped + failures + passes;
	console.log('%d Total Tests: %d passed, %d failed, %d skipped.', total, passes, failures, skipped);
}

// public API
exports.test = callbackify(test);
exports.outputResults = callbackify(outputResults);

// When run as single script.
if (module.id === '.') {
	async function main(...args) {
		const program = require('commander');
		const packageJson = require('../package');

		program
			.version(packageJson.version)
			.option('-b, --branch [branchName]', 'Install a specific branch of the SDK to test with', 'master')
			.option('-p, --platforms <platform1,platform2>', 'Run unit tests on the given platforms', /^(android(,ios|,windows)?)|(ios(,android)?)|(windows(,android)?)$/, 'android,ios')
			.option('-T, --target [target]', 'Titanium platform target to run the unit tests on. Only valid when there is a single platform provided')
			.option('-C, --device-id [id]', 'Titanium device id to run the unit tests on. Only valid when there is a target provided')
			.option('-s, --skip-sdk-install', 'Skip the SDK installation step')
			.option('-c, --cleanup', 'Cleanup non-GA SDKs. Default is true if we install an SDK')
			.option('-a, --architecture [architecture]', 'Target architecture to build. Only valid on Windows')
			.option('-D, --deploy-type <type>', 'the type of deployment', /^(test|development)$/)
			.option('-F, --device-family <value>', 'the device family to build for ', /^(iphone|ipad)$/)
			.parse(args);

		const platforms = program.platforms.split(',');

		if (platforms.length > 1 && program.target !== undefined) {
			throw new Error('--target can only be used when there is a single platform provided');
		}

		if (program.deviceId && !program.target) {
			throw new Error('--device-id can only be used when there is a target provided');
		}

		const results = await test(
			program.branch, platforms, program.target, program.deviceId, program.skipSdkInstall,
			program.cleanup, program.architecture, program.deployType, program.deviceFamily);

		for (const platform of platforms) {
			const prefix = generateJUnitPrefix(platform, program.target, program.deviceFamily);
			console.log();
			console.log('=====================================');
			console.log(prefix.toUpperCase());
			console.log('-------------------------------------');
			outputResults(results[prefix].results);
		}
	}
	main(...process.argv)
		.then(() => process.exit(0))
		.catch(err => {
			console.error(err);
			process.exit(1);
		});
}

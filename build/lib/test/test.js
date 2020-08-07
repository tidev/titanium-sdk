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
const { promisify } = require('util');
const stripAnsi = require('strip-ansi');
const exec = promisify(require('child_process').exec); // eslint-disable-line security/detect-child-process

const ROOT_DIR = path.join(__dirname, '../../..');
const SOURCE_DIR = path.join(ROOT_DIR, 'tests');
const PROJECT_NAME = 'mocha';
const APP_ID = 'com.appcelerator.testApp.testing';
const PROJECT_DIR = path.join(ROOT_DIR, 'tmp', PROJECT_NAME);
const REPORT_DIR = ROOT_DIR; // Write junit xml files to root of repo
const JUNIT_TEMPLATE = path.join(__dirname, 'junit.xml.ejs');

// The special magic strings we expect in the logs!
const GENERATED_IMAGE_PREFIX = '!IMAGE: ';
const DIFF_IMAGE_PREFIX = '!IMG_DIFF: ';
const TEST_END_PREFIX = '!TEST_END: ';
const TEST_START_PREFIX = '!TEST_START: ';
const TEST_SUITE_STOP = '!TEST_RESULTS_STOP!';
const OS_VERSION_PREFIX = 'OS_VERSION: ';

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
 * @param {string} [snapshotDir='../../../tests/Resources'] directory to place generated snapshot images
 * @returns {Promise<object>}
 */
async function test(platforms, target, deviceId, deployType, deviceFamily, snapshotDir = path.join(__dirname, '../../../tests/Resources')) {
	const snapshotPromises = []; // place to stick commands we've fired off to pull snapshot images

	// delete old test app (if does not exist, this will no-op)
	await fs.remove(PROJECT_DIR);

	console.log('Generating project');
	await generateProject(platforms);

	await copyMochaAssets();
	await addTiAppProperties();

	// run build for each platform, and spit out JUnit report
	const results = {};
	for (const platform of platforms) {
		const result = await runBuild(platform, target, deviceId, deployType, deviceFamily, snapshotDir, snapshotPromises);
		const prefix = generateJUnitPrefix(platform, target, deviceFamily);
		results[prefix] = result;
		await outputJUnitXML(result, prefix);
	}

	// If we're gathering images, make sure we get them all before we move on
	if (snapshotPromises.length !== 0) {
		await Promise.all(snapshotPromises);
	}

	return results;
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
			'--workspace-dir', path.dirname(PROJECT_DIR),
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
		content.push(`\t\t\t\t<activity android:name=".${PROJECT_NAME.charAt(0).toUpperCase() + PROJECT_NAME.slice(1).toLowerCase()}Activity">`);
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
		content.push('\t\t\t\t</array');
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
 * @param {string} platform 'android' || 'ios' || 'windows'
 * @param {string} [target] 'emulator' || 'simulator' || 'device'
 * @param {string} [deviceId] uuid of device/simulator to launch
 * @param {string} [deployType=undefined] 'development' || 'test'
 * @param {string} [deviceFamily=undefined] 'ipad' || 'iphone' || undefined
 * @param {string} snapshotDir directory to place generated images
 * @param {Promise[]} snapshotPromises array to hold promises for grabbign generated images
 * @returns {Promise<object>}
 */
async function runBuild(platform, target, deviceId, deployType, deviceFamily, snapshotDir, snapshotPromises) {

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

	args.push('--no-prompt');
	args.push('--color');
	const prc = spawn('node', args);
	return handleBuild(prc, target, snapshotDir, snapshotPromises);
}

async function killiOSSimulator() {
	return new Promise((resolve, reject) => {
		spawn('killall', [ 'Simulator' ]).on('exit', resolve).on('error', reject);
	});
}

class DeviceTestDetails {
	/**
	 *
	 * @param {string} name device/emulator name (as reported via log output. Defaults to empty string)
	 * @param {'emulator'|'device'|'simulator'} target
	 * @param {string} snapshotDir
	 * @param {Promise[]} snapshotPromises
	 */
	constructor(name, target, snapshotDir, snapshotPromises) {
		this.name = name;
		this.results = [];
		// FIXME: These things don't feel right to pass in here.
		this.target = target;
		this.snapshotDir = snapshotDir;
		this.snapshotPromises = snapshotPromises;
		// set to completed as true by default because for multi-device build we'll end up with default entry that just corresponds to
		// log output from CLI or not from a specific device. If the device specific test suites finish we want to ignore this one
		// We'll set to false as soon as we see a version or test start
		this.completed = true;
		this.resetTestState();
	}

	appendStderr(line) {
		this.stderr += line.trim() + '\n';
	}

	/**
	 * 	We saw test end before, but failed to parse as JSON because we got partial output, so continue
	 * trying until it's happy (and resets sawTestEnd to false)
	 * @param {string} token
	 */
	handleTestContinuation(token) {
		let modifiedToken = token;
		let hasAnsi = true;

		// strip off leading log level prefix!
		if (modifiedToken.startsWith('[INFO]')) {
			modifiedToken = modifiedToken.substring(8);
			hasAnsi = false;
			// colored output?
		} else if (modifiedToken.startsWith('\u001b[32m[INFO] \u001b[39m')) {
			// technically we get these characters on a colored [INFO] log prefix:
			// <Buffer 1b 5b 33 32 6d 5b 49 4e 46 4f 5d 20 1b 5b 33 39 6d 3a 20 08 08 20 08 20>
			//     \u001b [  3  2  m  [  I  N  F  O  ]  <space>\u001b[39m :  <space><backspace><backspace><space><backspace><space>
			modifiedToken = modifiedToken.substring(24);
		}

		if (hasAnsi && this.name) {
			modifiedToken = modifiedToken.substring(this.name.length + 13); // strip ansi color code, '[, device name, '] ', ansi color code
		} else {
			modifiedToken = modifiedToken.substring(this.name.length + 3);
		}

		// FIXME: IF we see another !TEST_START or !TEST_RESULTS_STOP, can we fail this test and move on?
		return this.tryParsingTestResult(this.partialTestEnd + modifiedToken);
	}

	/**
	 * Handle a new line of output for a given device/emulator
	 * @param {string} token line of output (raw)
	 * @param {string} stripped output stripped of ansi colors
	 * @returns {boolean} true if successfully finished the test suite (completed, may have test failures/errors)
	 */
	handleLine(token, stripped) {
		if (this.testEndIncomplete) {
			this.handleTestContinuation(token);
			// TODO: If we fail here it may go for 3+ lines, but more than likely we're in a bad state if this keeps happening...
			// Should we try the other checks below if we failed?
			return false;
		}

		// check for test start
		if (token.includes(TEST_START_PREFIX)) {
			// new test, wipe the state
			this.resetTestState();
			return false;
		}

		// check for generated images
		if (token.includes(GENERATED_IMAGE_PREFIX)) {
			this.snapshotPromises.push(grabGeneratedImage(token, this.target, this.snapshotDir));
			return false;
		}

		// check for mismatched images
		if (token.includes(DIFF_IMAGE_PREFIX)) {
			this.snapshotPromises.push(handleMismatchedImage(token, this.target, this.snapshotDir));
			return false;
		}

		// obtain os version
		if (token.includes(OS_VERSION_PREFIX)) {
			this.version = token.slice(token.indexOf(OS_VERSION_PREFIX) + OS_VERSION_PREFIX.length).trim();
			this.completed = false; // it's a real device/emulator and not the entry for generic CLI output!
			return false;
		}

		// check for test end
		const testEndIndex = token.indexOf(TEST_END_PREFIX);
		if (testEndIndex !== -1) {
			if (!this.tryParsingTestResult(token.slice(testEndIndex + TEST_END_PREFIX.length).trim())) {
				console.log('test end not DONE!');
			}
			// if this fails, we retry at top of next call to handleLine()
			// success or failure, we're done with this line
			return false;
		}

		// check for suite end
		if (token.includes(TEST_SUITE_STOP)) {
			// device completed tests
			this.completed = true;
			return true;
		}

		// normal output (no test start/end, suite end/crash)
		// append output to our string for stdout
		this.output += token + '\n';
		return false;
	}

	tryParsingTestResult(resultJSON) {
		//  grab out the JSON and add to our result set
		try {
			const result = JSON.parse(massageJSONString(resultJSON));
			result.stdout = this.output; // record what we saw in output during the test
			result.stderr = this.stderr; // record what we saw in output during the test
			result.device = this.name.length ? this.name : undefined; // specify device if available
			result.os_version = this.version; // specify os version if available
			this.results.push(result);
			this.testEndIncomplete = false;
			return true;
		} catch (err) {
			// if we fail to parse as JSON, assume we got truncated output!
			this.partialTestEnd = resultJSON;
			this.testEndIncomplete = true;
			return false;
		}
	}

	resetTestState() {
		this.output = ''; // reset output
		this.stderr = ''; // reset stderr
		this.partialTestEnd = ''; // reset partial test output
		this.testEndIncomplete = false; // reset flag indicating we saw partial test output
	}
}

/**
 * Once a build has been spawned off this handles grabbing the test results from the output.
 * @param {child_process} prc  Handle of the running process from spawn
 * @param {string} target 'emulator' || 'simulator' || 'device'
 * @param {string} snapshotDir directory to place generated images
 * @param {Promise[]} snapshotPromises array to hold promises for grabbign generated images
 * @returns {Promise<object>}
 */
async function handleBuild(prc, target, snapshotDir, snapshotPromises) {
	return new Promise((resolve, reject) => {
		const deviceMap = new Map();
		let started = false;

		const splitter = prc.stdout.pipe(StreamSplitter('\n'));
		// Set encoding on the splitter Stream, so tokens come back as a String.
		splitter.encoding = 'utf8';

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
				const deploy = spawn('ios-deploy', [ '-L', '-b', path.join(PROJECT_DIR, `build/iphone/build/Products/Debug-iphoneos/${PROJECT_NAME}.app`) ]);
				deploy.stdout.on('data', data => process.stdout.write(data));
				deploy.stderr.on('data', data => process.stderr.write(data));
			}

			// Fail immediately if android emulator is forcing restart
			// TODO: Can we restart/retry test suite in this case?
			if (token.includes('Module config changed, forcing restart due')) {
				prc.kill(); // quit this build...
				return reject(new Error(`Failed to finish test suite before Android emulator killed app due to updated module: ${token}`));
			}

			// Handle when app crashes and we haven't finished tests yet!
			if (token.includes('-- End application log ----') || token.includes('-- End simulator log ---')) {
				prc.kill(); // quit this build...
				return reject(new Error('Failed to finish test suite before app crashed and logs ended!')); // failed too many times
			}

			// ignore the build output until the app actually starts
			if (!started) {
				if (token.includes('-- Start application log ---') || token.includes('-- Start simulator log ---')) {
					started = true;
				}
				return;
			}

			// We should not be checking the line for a device name until after the app starts!
			// Otherwise we create an entry for '' (default) device which will never be completed
			const stripped = stripAnsi(token);
			const device = getDeviceName(stripped);
			if (!deviceMap.has(device)) {
				deviceMap.set(device, new DeviceTestDetails(device, target, snapshotDir, snapshotPromises));
			}
			const curTest = deviceMap.get(device);
			const done = curTest.handleLine(token, stripped);
			if (done) {
				let results = [];
				// check if all devices have completed tests
				for (const d of deviceMap.values()) {
					// not all devices have completed tests
					// continue without processing results
					if (!d.completed) {
						return;
					}
					results = results.concat(d.results);
				}

				prc.kill(); // ok, tests finished as expected, kill the process
				return resolve({ date: (new Date()).toISOString(), results });
			}
		});
		// Any errors that occur on a source stream will be emitted on the
		// splitter Stream, if the source stream is piped into the splitter
		// Stream, and if the source stream doesn't have any other error
		// handlers registered.
		splitter.on('error', reject);

		prc.stderr.on('data', data => {
			process.stderr.write(data); // pipe along the stderr as we go, retaining ANSI colors
			if (!started) {
				return;
			}
			const line = data.toString();
			const stripped = stripAnsi(line);
			const device = getDeviceName(stripped);
			if (!deviceMap.has(device)) {
				deviceMap.set(device, new DeviceTestDetails(device, target, snapshotDir, snapshotPromises));
			}
			deviceMap.get(device).appendStderr(line);
		});

		prc.on('close', code => {
			if (code !== 0) {
				return reject(new Error(`Exited unexpectedly with exit code: ${code}`));
			}
		});
	});
}

/**
 *
 * @param {string} testResults
 * @returns {string}
 */
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
	// copied from sim/emu to file system...
	const grabbed = await saveAppImage(details, dest);
	// Now also place in diffs dir too with no expected.png
	const diffDir = path.join(snapshotDir, '..', 'diffs', details.platform, details.relativePath.slice(0, -4)); // drop '.png'
	await fs.ensureDir(diffDir);
	const actual = path.join(diffDir, 'actual.png');
	await fs.copy(grabbed, actual);
	return grabbed;
}

/**
 * @param {object} details json from test output about image
 * @param {string} details.path path to generated image file
 * @param {string} details.platform name of the platform
 * @param {string} dest destination filepath
 */
async function saveAppImage(details, dest) {
	return grabAppImage(details.platform, details.path, dest);
}

async function grabAppImage(platform, filepath, dest) {
	if (filepath.startsWith('file://')) {
		filepath = filepath.slice(7);
	}
	console.log(`Copying generated image ${filepath} to ${dest}`);
	if (platform === 'android') {
		// Pull the file via adb shell
		// FIXME: what if android sdk platform-tools/bin isn't on PATH!?
		await exec(`adb shell "run-as ${APP_ID} cat '${filepath}'" > ${dest}`);
		// TODO: handle device(s) vs emulator(s)
		return dest;
	} else {
		// copy the expected image to some location
		// iOS - How do we grab the image?
		// For ios sim, we should just be able to do a file copy
		// FIXME: iOS device isn't (and may not be able to be) handled!
		await fs.copy(filepath, dest);
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
	await saveAppImage(details, actual);
	try {
		const diff = path.join(diffDir, 'diff.png');
		await grabAppImage(details.platform, details.path.slice(0, -4) + '_diff.png', diff);
	} catch (err) {
		// ignore, diff image may not exist
	}
	return actual;
}

/**
 * @param {string} platform 'ios' || 'android'
 * @param {string} [target] 'emulator' || 'simulator' || 'device'
 * @param {string} [deviceFamily] 'iphone' || 'ipad'
 * @returns {string}
 */
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
 * @returns {Promise<void>}
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
	const outFile = path.join(REPORT_DIR, `junit.${prefix}.xml`);
	console.log(`JUnit test report written to ${outFile}`);
	return fs.writeFile(outFile, r);
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
exports.test = test;
exports.outputResults = outputResults;
exports.handleBuild = handleBuild;

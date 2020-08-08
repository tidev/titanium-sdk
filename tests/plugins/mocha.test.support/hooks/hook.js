/**
 * Copyright (c) 2019 by Axway, Inc.
 * All Rights Reserved. This library contains intellectual
 * property protected by patents and/or patents pending.
 */

'use strict';

const path = require('path');
const spawn = require('child_process').spawn; // eslint-disable-line security/detect-child-process

exports.cliVersion = '>=3.2';

let ANDROID_SDK = process.env.ANDROID_SDK; // eslint-disable-line no-undef
let ADB_PATH;

exports.init = (logger, config, cli) => {

	// Obtain Android SDK used by CLI
	if (cli.argv['android-sdk']) {
		ANDROID_SDK = cli.argv['android-sdk'];
	}

	// Set ADB path
	ADB_PATH = path.join(ANDROID_SDK, 'platform-tools', 'adb');

	cli.on('build.pre.compile', async (builder, done) => {
		builder.tiapp.properties['Ti.version'] = { type: 'string', value: builder.titaniumSdkVersion };
		builder.tiapp.properties['js.encrypted'] = { type: 'bool', value: builder.encryptJS };
		done();
	});

	cli.on('build.post.compile', async (builder, done) => {
		if (builder.platformName === 'android') {
			await wakeDevices(logger, builder)
				.catch(e => logger.warn(`Could not wake ${builder.deviceId}: ${e}`));
			await enableAutoRotation(logger, builder)
				.catch(e => logger.warn(`Could not enable auto-rotation ${builder.deviceId}: ${e}`));
		}
		done();
	});
};

async function adb(args) {
	return new Promise((resolve, reject) => {
		let child;
		let stdout = '';
		let stderr = '';

		if (process.platform === 'win32') {
			child = spawn(
				process.env.comspec || 'cmd.exe',
				[ '/S', '/C', '"', ADB_PATH, ...args, '"' ],
				{
					windowsVerbatimArguments: true
				}
			);
		} else {
			child = spawn(
				ADB_PATH,
				args,
				{
					shell: false,
					windowsHide: true
				}
			);
		}
		if (child) {
			child.stdout.on('data', data => {
				stdout += data.toString();
			});
			child.stderr.on('data', data => {
				stderr += data.toString();
			});
			child.on('close', code => {
				if (code !== 0) {
					return reject(`${stdout}\n${stderr}`);
				}
				resolve(stdout);
			});
			return;
		}
		reject();
	});
}

async function wakeDevices(logger, builder) {

	async function wake(device) {
		logger.info(`Waking up ${device}`);

		const deviceId = builder.target !== 'emulator' ? [ '-s', device ] : [];

		// Power on the screen if currently off.
		const powerStatus = await adb([ ...deviceId, 'shell', 'dumpsys', 'power' ]);
		if (powerStatus && powerStatus.includes('mHoldingDisplaySuspendBlocker=false')) {
			await adb([ ...deviceId, 'shell', 'input', 'keyevent', 'KEYCODE_POWER' ]);
		}

		// Remove the screen-lock and show the home screen.
		await adb([ ...deviceId, 'shell', 'input', 'keyevent', 'KEYCODE_MENU' ]);

		// If the screen-lock was never shown to begin with, then the above might show
		// the home screen's page selection interface. Clear out of it with the home key.
		await adb([ ...deviceId, 'shell', 'input', 'keyevent', 'KEYCODE_HOME' ]);

		// Set the device's screen idle timer to 30 minutes. (The default is 30 seconds.)
		await adb([ ...deviceId, 'shell', 'settings', 'put', 'system', 'screen_off_timeout', '1800000' ]);
	}

	if (builder.deviceId === 'all') {
		for (const device of builder.devices) {
			if (device.id !== 'all') {
				await wake(device.id);
			}
		}
	} else {
		await wake(builder.deviceId);
	}
}

async function enableAutoRotation(logger, builder) {

	async function autoRotate(device) {
		const deviceId = builder.target !== 'emulator' ? [ '-s', device ] : [];

		// Enable auto-rotation if currently disabled.
		const rotationStatus = await adb([ ...deviceId, 'shell', 'settings', 'get', 'system', 'accelerometer_rotation' ]);
		if (rotationStatus !== '1') {
			logger.info(`Enabling auto-rotation for ${device}`);

			await adb([ ...deviceId, 'shell', 'settings', 'put', 'system', 'accelerometer_rotation', '1' ]);
		}
	}

	if (builder.deviceId === 'all') {
		for (const device of builder.devices) {
			if (device.id !== 'all') {
				await autoRotate(device.id);
			}
		}
	} else {
		await autoRotate(builder.deviceId);
	}
}

/**
 * Copyright (c) 2019 by Axway, Inc.
 * All Rights Reserved. This library contains intellectual
 * property protected by patents and/or patents pending.
 */

'use strict';

const appc = require('node-appc');
const path = require('path');

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
			await wakeDevices(logger, builder).catch(e => logger.warn(`could not wake ${builder.deviceId}: ${e}`));
		}
		done();
	});
};

async function adb(argumentArray) {
	return new Promise(resolve => appc.subprocess.run(ADB_PATH, argumentArray, { shell: false, windowsHide: true }, (error, stdout, _stderr) => {
		resolve(stdout);
	}));
}

async function wakeDevices(logger, builder) {

	async function wake(device) {
		logger.info(`Waking up ${device}`);

		const deviceId = device !== 'emulator' ? [ '-s', device ] : [];

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

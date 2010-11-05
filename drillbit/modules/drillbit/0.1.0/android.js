/**
 * Appcelerator Drillbit
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var ti = Ti = Titanium;
function AndroidEmulator(drillbit, androidSdk, apiLevel, platform, googleApis) {
	this.drillbit = drillbit;
	this.androidSdk = androidSdk;
	this.apiLevel = apiLevel;
	this.platform = platform
	this.googleApis = googleApis;
	
	this.adb = ti.path.join(androidSdk, 'tools', 'adb');
	if (ti.Platform.isWin32()) {
		this.adb += ".exe";
	}
	
	this.device = 'emulator';
	if ('androidDevice' in drillbit.argv) {
		this.device = drillbit.argv.androidDevice;
	}
	
	this.androidBuilder = ti.path.join(drillbit.mobileSdk, 'android', 'builder.py');
	this.waitForDevice = ti.path.join(drillbit.mobileSdk, 'android', 'wait_for_device.py');
	this.testHarnessRunning = false;
	
	// Set to true when changing test harness app so changes always get built in
	this.needsBuild = false;
};

AndroidEmulator.prototype.createADBProcess = function(args) {
	var adbArgs = [this.adb];
	if (this.device == 'emulator') {
		adbArgs.push('-e');
	} else if (this.device == 'usb') {
		adbArgs.push('-d');
	} else {
		adbArgs = adbArgs.concat(['-s', this.device]);
	}
	
	adbArgs = adbArgs.concat(args);
	return ti.proc.createProcess(adbArgs);
};

AndroidEmulator.prototype.runADB = function(args) {
	var adbProcess = this.createADBProcess(args);
	var result = adbProcess().toString();
	return result;
};

AndroidEmulator.prototype.createTestHarnessBuilderProcess = function(command, args) {
	var builderArgs = [this.androidBuilder,
		command, 'test_harness', this.androidSdk, this.drillbit.testHarnessDir, this.drillbit.testHarnessId];
	
	if (args) {
		builderArgs = builderArgs.concat(args);
	}
	
	return this.drillbit.createPythonProcess(builderArgs);
};

AndroidEmulator.prototype.getTestHarnessPID = function() {
	var processes = this.runADB(['shell', 'ps']).split(/\r?\n/);

	for (var i = 0; i < processes.length; i++) {
		var columns = processes[i].split(/\s+/);
		var pid = columns[1];
		var id = columns[columns.length-1];
		if (id == this.drillbit.testHarnessId) {
			return pid;
		}
	}
	return null;
};

AndroidEmulator.prototype.isTestHarnessRunning = function() {
	return this.getTestHarnessPID() != null;
};

AndroidEmulator.prototype.isEmulatorRunning = function() {
	var devices = this.runADB(['devices'])
	if (devices.indexOf('emulator') >= 0) {
		return true;
	}
	return false;
};

AndroidEmulator.prototype.getTestJSInclude = function() {
	return "Ti.include(\"appdata://test.js\")";
};

AndroidEmulator.prototype.run = function(readLineCb) {
	var androidEmulatorProcess = null;

	var emulatorRunning = this.isEmulatorRunning();
	if (emulatorRunning) {
		// just launch logcat on the existing emulator, we need to clear it first though or we get tons of backscroll
		this.runADB(['logcat', '-c']);
		
		androidEmulatorProcess = this.createADBProcess(['logcat'])
		this.testHarnessRunning = this.isTestHarnessRunning();
	} else {
		// launch the (si|e)mulator async
		this.drillbit.frontendDo('status', 'launching android emulator', true);
		androidEmulatorProcess = this.createTestHarnessBuilderProcess('emulator', ['4', 'HVGA']);
	}

	androidEmulatorProcess.setOnReadLine(readLineCb);
	androidEmulatorProcess.launch();

	var self = this;
	// after we launch, double-check that ADB can see the emulator. if it can't we probably need to restart the ADB server
	// ADB will actually see the emulator within a second or two of launching, i pause 5 seconds just in case
	if (this.drillbit.window) {
		this.drillbit.window.setTimeout(function() {
			if (!self.isEmulatorRunning()) {
				ti.api.debug("emulator not found by ADB, force-killing the ADB server");
				// emulator not found yet, restart ADB
				self.runADB(['kill-server']);
			}
		}, 5000);
	}

	if (!emulatorRunning) {
		this.drillbit.frontendDo('status', 'pre-building initial APK', true);
		var prebuildLaunchProcess = this.createTestHarnessBuilderProcess('simulator', ['4', 'HVGA']);
		var self = this;
		prebuildLaunchProcess.setOnExit(function(e) {
			ti.api.info("==> Finished waiting for android emualtor to boot");
			
			// wipe appdata://test.js if it already exists
			self.removeTestJS();
			
			self.drillbit.frontendDo('status', 'unlocking android screen...', true);
			var unlockScreenAPK = ti.path.join(self.drillbit.resourcesDir, 'android', 'UnlockScreen', 'dist', 'UnlockScreen.apk');
			self.runADB(['install', '-r', unlockScreenAPK]);
			self.runADB(['shell', 'am', 'start', '-n', 'org.appcelerator.titanium/.UnlockScreenActivity']);
		
			self.testHarnessRunning = true;
			self.drillbit.frontendDo('status', 'screen unlocked, ready to run tests');
			self.drillbit.frontendDo('setup_finished');
		});
		prebuildLaunchProcess.launch();
	} else {
		this.drillbit.frontendDo('status', 'ready to run tests');
		this.drillbit.frontendDo('setup_finished');
	}
};

AndroidEmulator.prototype.removeTestJS = function(testScript) {
	var testJS = '/sdcard/'+this.drillbit.testHarnessId+'/test.js';
	var results = this.runADB(['shell', 'ls', testJS]);
	if (results.indexOf("No such file") > -1) {
		return;
	}
	this.runADB(['shell', 'rm', testJS]);
};

AndroidEmulator.prototype.pushTestJS = function(testScript) {
	var testJS = ti.fs.createTempFile();
	testJS.write(testScript);
	this.runADB(['push', testJS.nativePath(), '/sdcard/' + this.drillbit.testHarnessId + '/test.js']);
};

var buildTriggers = [
	// File triggers
	'tiapp.xml', 'AndroidManifest.xml',
	ti.path.join('build', 'android', 'AndroidManifest.xml'),
	ti.path.join('build', 'android', 'AndroidManifest.custom.xml'),
	
	// Directory triggers (any file under these dirs)
	'modules',
	ti.path.join('build', 'android', 'src'),
	ti.path.join('build', 'android', 'res')
];

AndroidEmulator.prototype.testHarnessNeedsBuild = function(stagedFiles) {
	for (var i = 0; i < stagedFiles.length; i++) {
		var stagedFile = stagedFiles[i];
		var relativePath = ti.path.relpath(stagedFile.nativePath(), this.drillbit.testHarnessDir);
		
		// file triggers
		if (buildTriggers.indexOf(relativePath) != -1) {
			return true;
		}
		
		// directory triggers
		for (var j = 0; j < buildTriggers.length; j++) {
			var buildTrigger = buildTriggers[j];
			if (relativePath.indexOf(buildTrigger) != -1) {
				return true;
			}
		}
	}
	return false;
};

AndroidEmulator.prototype.runTestHarness = function(suite, stagedFiles) {
	if (!this.testHarnessRunning || this.testHarnessNeedsBuild(stagedFiles)) {
		var process = this.createTestHarnessBuilderProcess("simulator", ['4', 'HVGA']);	
		this.drillbit.frontendDo('building_test_harness', suite, 'android');
		
		var self = this;
		process.setOnReadLine(function(data) {
			self.drillbit.frontendDo('process_data', data);
		});
		process.setOnExit(function(e) {
			self.testHarnessRunning = true;
			self.needsBuild = false;
		});
		process.launch();
	} else {
		// restart the app
		this.drillbit.frontendDo('running_test_harness', suite, 'android');
		var pid = this.getTestHarnessPID();
		if (pid != null && pid.length > 0) {
			this.runADB(['shell', 'kill', pid]);
		}
		
		// wait a few seconds after kill, every now and then the proc will still
		// be hanging up when we try to start it after kill returns
		var self = this;
		this.drillbit.window.setTimeout(function() {
			self.runADB(['shell', 'am', 'start',
				'-a', 'android.intent.action.MAIN',
				'-c', 'android.intent.category.LAUNCHER',
				'-n', self.drillbit.testHarnessId + '/.Test_harnessActivity']);
		}, 2000);
	}
};

Titanium.AndroidEmulator = AndroidEmulator;
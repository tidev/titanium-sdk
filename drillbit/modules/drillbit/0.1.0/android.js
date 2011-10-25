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
	this.avdId = '4';

	this.adb = ti.path.join(androidSdk, 'tools', 'adb');
	if (ti.Platform.isWin32()) {
		this.adb += ".exe";
	}

	if (!ti.path.exists(this.adb)) {
		this.adb = ti.path.join(androidSdk, 'platform-tools', 'adb');
		if (ti.Platform.isWin32()) {
			this.adb += ".exe";
		}
	}

	ti.api.debug('adb -> ' + this.adb);

	this.device = 'emulator';
	if ('androidDevice' in drillbit.argv) {
		this.device = drillbit.argv.androidDevice;
	}
	if ('avdId' in drillbit.argv) {
		this.avdId = drillbit.argv.avdId;
	}

	this.runtime = 'v8';
	if ('androidRuntime' in drillbit.argv) {
		this.runtime = drillbit.argv.androidRuntime;
	}

	ti.api.debug('Using javascript runtime: ' + this.runtime);

	this.androidBuilder = ti.path.join(drillbit.mobileSdk, 'android', 'builder.py');
	this.waitForDevice = ti.path.join(drillbit.mobileSdk, 'android', 'wait_for_device.py');
	this.testHarnessRunning = false;

	this.needsBuild = 'androidForceBuild' in drillbit.argv;

	var androidGenDir = ti.path.join(this.drillbit.resourcesDir, 'android', 'gen');
	var androidSrcDir = ti.path.join(this.drillbit.resourcesDir, 'android', 'src');
	var self = this;
	ti.path.recurse(androidGenDir, function(file) {
		var relativePath = ti.path.relpath(file.nativePath(), androidGenDir);
		var destFile = ti.fs.getFile(self.drillbit.testHarnessDir, 'platform', 'android', 'gen', relativePath);
		if (!destFile.parent().exists()) {
			destFile.parent().createDirectory(true);
		}
		file.copy(destFile);
	});
	ti.path.recurse(androidSrcDir, function(file) {
		var relativePath = ti.path.relpath(file.nativePath(), androidSrcDir);
		var destFile = ti.fs.getFile(self.drillbit.testHarnessDir, 'platform', 'android', 'src', relativePath);
		if (!destFile.parent().exists()) {
			destFile.parent().createDirectory(true);
		}
		file.copy(destFile);
	});
};

AndroidEmulator.prototype.createADBProcess = function(args) {
	var adbArgs = [this.adb];
	if (this.device == 'emulator') {
		adbArgs.push('-e');
	} else if (this.device == 'device') {
		adbArgs.push('-d');
	} else {
		adbArgs = adbArgs.concat(['-s', this.device]);
	}

	adbArgs = adbArgs.concat(args);
	return ti.proc.createProcess(adbArgs);
};

AndroidEmulator.prototype.runADB = function(args) {
	var adbProcess = this.createADBProcess(args);
	ti.api.debug("[adb] " + adbProcess);
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
	var processes = this.runADB(['shell', 'ps']).split(/[\r\n]+/);

	for (var i = 0; i < processes.length; i++) {
		if (processes[i] == "") continue;

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
	var devices = this.runADB(['devices']);
	if (devices.indexOf('emulator') >= 0) {
		return true;
	}
	return false;
};

AndroidEmulator.prototype.getTestJSInclude = function() {
	if (this.runtime == "rhino") {
		return "Ti.include(\"appdata://test.jar:" + this.drillbit.testHarnessId + ".js.test\")";
	} else {
		return "Ti.include(\"appdata://test.js\")";
	}
};

AndroidEmulator.prototype.fillTiAppData = function(data) {
	data.androidRuntime = this.runtime;
};

AndroidEmulator.prototype.run = function(readLineCb) {
	var androidEmulatorProcess = null;

	var emulatorRunning = this.isEmulatorRunning();
	if (emulatorRunning || this.device.indexOf('emulator') != 0) {
		// just launch logcat on the existing emulator, we need to clear it first though or we get tons of backscroll
		this.runADB(['logcat', '-c']);
		
		androidEmulatorProcess = this.createADBProcess(['logcat'])
		this.testHarnessRunning = this.isTestHarnessRunning();
	} else {
		// launch the (si|e)mulator async
		this.drillbit.frontendDo('status', 'launching android emulator', true);
		androidEmulatorProcess = this.createTestHarnessBuilderProcess('emulator', [this.avdId, 'HVGA']);
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

	if (this.device == 'emulator' && !emulatorRunning) {
		this.drillbit.frontendDo('status', 'pre-building initial APK', true);
		var waitProcess = this.drillbit.createPythonProcess([this.waitForDevice, this.androidSdk, 'emulator']);
		var self = this;
		waitProcess.setOnExit(function(e) {
			ti.api.info("==> Finished waiting for android emualtor to boot");

			// wipe appdata://test.js if it already exists
			self.removeTestJS();

			self.drillbit.frontendDo('status', 'unlocking android screen...', true);
			var unlockScreenAPK = ti.path.join(self.drillbit.resourcesDir, 'android', 'UnlockScreen', 'dist', 'UnlockScreen.apk');
			self.runADB(['install', '-r', unlockScreenAPK]);
			self.runADB(['shell', 'am', 'start', '-n', 'org.appcelerator.titanium/.UnlockScreenActivity']);

			self.drillbit.frontendDo('status', 'screen unlocked, ready to run tests');
			self.drillbit.frontendDo('setup_finished');
		});
		waitProcess.launch();
	} else {
		if (this.testHarnessRunning) {
			// Kill the test harness on bootup if it's still running
			this.killTestHarness()
		}
		this.drillbit.frontendDo('status', 'ready to run tests');
		this.drillbit.frontendDo('setup_finished');
	}
};

AndroidEmulator.prototype.handleCompleteAndroidEvent = function(event)
{
	var suite = event.suite;
	var resultsData = this.runADB(['shell', 'cat', '/sdcard/' + this.drillbit.testHarnessId + '/results.json']);
	var results = JSON.parse(resultsData);

	/* TODO coverage disabled for now in V8
	var coverageData = this.runADB(['shell', 'cat', '/sdcard/' + this.drillbit.testHarnessId + '/coverage.json']);
	var coverage = JSON.parse(coverageData);*/

	var resultsInfo = {
		results: results,
		//coverage: coverage,
		suite: suite
	}
	this.drillbit.handleCompleteEvent(resultsInfo, 'android');
};

AndroidEmulator.prototype.removeTestJS = function(testScript) {
	var testJS = '/sdcard/'+this.drillbit.testHarnessId+'/test.js';
	var results = this.runADB(['shell', 'ls', testJS]);
	if (results.indexOf("No such file") > -1) {
		return;
	}
	this.runADB(['shell', 'rm', testJS]);
};

AndroidEmulator.prototype.fillTestTemplateData = function(data) {
	if (this.runtime == "rhino") {
		data.withWrap = true;
	}
}

AndroidEmulator.prototype.pushTestJS = function(testScript) {
	var tempDir = ti.fs.createTempDirectory();
	var testJS = ti.fs.getFile(tempDir.nativePath(), "test.js");
	var stream = testJS.open(ti.fs.MODE_WRITE);
	stream.write(testScript);
	stream.close();

	if (this.runtime == "v8") {
		this.runADB(['push', testJS, '/sdcard/' + this.drillbit.testHarnessId + '/test.js']);

	} else if (this.runtime == "rhino") {
		/* Since rhino is particular about code size, we pre-compile */
		var rhinoJar = ti.path.join(this.drillbit.mobileSdk, 'android', 'js.jar');
		var dx = ti.path.join(this.androidSdk, "platform-tools", "dx");
		if (Ti.Platform.isWin32()) {
			dx += ".bat";
		}

		var java = "java";
		var compileArgs = [java, "-classpath", rhinoJar,
			"org.mozilla.javascript.tools.jsc.Main", "-opt", "9", "-g",
			"-main-method-class", "org.appcelerator.kroll.runtime.rhino.KrollScriptRunner",
			"-package", "org.appcelerator.titanium.testharness.js",
			"-o", "test", "-encoding", "utf8", "-d", tempDir,
			testJS.nativePath()
		];

		var compileProcess = Ti.Process.createProcess(compileArgs);
		Ti.API.debug(compileArgs.join(" "));
		var out = compileProcess()
		Ti.API.debug(out.toString());

		var testOutJar = ti.path.join(tempDir.nativePath(), "test.jar");
		var dxArgs = [dx, "--dex", "--output=" + testOutJar, tempDir.nativePath()];
		var dxProcess = Ti.Process.createProcess(dxArgs);
		Ti.API.debug(dxArgs.join(" "));
		out = dxProcess();
		Ti.API.debug(out.toString());

		this.runADB(['push', testOutJar, '/sdcard/' + this.drillbit.testHarnessId + '/test.jar']);
	}
};

AndroidEmulator.prototype.stageSDK = function(sdkTimestamp) {
	var distAndroidDir = ti.fs.getFile(this.drillbit.mobileRepository, 'dist', 'android');
	var stagedFiles = [];
	var rootJars = ['titanium.jar', 'ant-tasks.jar', 'kroll-apt.jar'];

	distAndroidDir.getDirectoryListing().forEach(function(file) {
		if (file.extension() != 'jar') return;
		if (file.modificationTimestamp() <= sdkTimestamp) return;

		var destFile = null;
		if (rootJars.indexOf(file.name()) != -1) {
			destFile = ti.fs.getFile(this.drillbit.mobileSdk, 'android', file.name());
		} else {
			destFile = ti.fs.getFile(this.drillbit.mobileSdk, 'android', 'modules', file.name());
		}

		file.copy(destFile);
		stagedFiles.push(file);
	}, this);
	return stagedFiles;
};

var harnessBuildTriggers = [
	// File triggers
	'tiapp.xml', 'AndroidManifest.xml',
	ti.path.join('build', 'android', 'AndroidManifest.xml'),
	ti.path.join('build', 'android', 'AndroidManifest.custom.xml'),

	// Directory triggers (any file under these dirs)
	'modules', 'Resources',
	ti.path.join('build', 'android', 'src'),
	ti.path.join('build', 'android', 'res')
];

var sdkBuildTriggers = [
	'titanium.py', 'tiapp.py', 'manifest.py', 'project.py',
	ti.path.join('android', 'builder.py'),
	ti.path.join('android', 'compiler.py')
	// skip android/android.py? it always shows as changed for some reason
]

AndroidEmulator.prototype.isBuildTrigger = function(triggers, path) {
	// file triggers
	if (triggers.indexOf(path) != -1) {
		ti.api.debug("file build trigger found: " + path);
		return true;
	}

	// directory triggers
	for (var i = 0; i < triggers.length; i++) {
		var trigger = triggers[i];
		// starts with the directory
		if (path.indexOf(trigger) == 0) {
			ti.api.debug("dir build trigger found, dir:" + trigger + ", trigger: " + path);
			return true;
		}
	}
	return false;
};

AndroidEmulator.prototype.isHarnessBuildTrigger = function(file) {
	var path = file.nativePath();
	if (path.indexOf(this.drillbit.testHarnessDir) == -1) {
		return false;
	}

	var relativePath = ti.path.relpath(file.nativePath(), this.drillbit.testHarnessDir);
	return this.isBuildTrigger(harnessBuildTriggers, relativePath);
};

AndroidEmulator.prototype.isSDKBuildTrigger = function(file) {
	var path = file.nativePath();
	if (path.indexOf(this.drillbit.mobileSdk) == -1) {
		return false;
	}

	var relativePath = ti.path.relpath(path, this.drillbit.mobileSdk);
	return this.isBuildTrigger(sdkBuildTriggers, relativePath);
};

AndroidEmulator.prototype.testHarnessNeedsBuild = function(stagedFiles) {
	for (var i = 0; i < stagedFiles.length; i++) {
		var stagedFile = stagedFiles[i];
		if (this.isHarnessBuildTrigger(stagedFile) || this.isSDKBuildTrigger(stagedFile)) {
			return true;
		}
	}
	return false;
};

AndroidEmulator.prototype.installTestHarness = function(launch) {
	this.runADB(['install', '-r', ti.path.join(this.drillbit.testHarnessDir, 'build', 'android', 'bin', 'app.apk')]);
	if (launch)
	{
		this.launchTestHarness();
	}
};

AndroidEmulator.prototype.launchTestHarness = function() {
	this.runADB(['shell', 'am', 'instrument',
		'-e', 'class', this.drillbit.testHarnessId + '.Test_harnessActivity',
		this.drillbit.testHarnessId + '/org.appcelerator.titanium.drillbit.TestHarnessRunner']);
};

AndroidEmulator.prototype.killTestHarness = function() {
	if (this.device.indexOf('emulator') == 0) {
		var pid = this.getTestHarnessPID();
		if (pid != null && pid.length > 0) {
			this.runADB(['shell', 'kill', pid]);
		}
	} else {
		var jdwpKill = ti.path.join(this.drillbit.mobileSdk, 'android', 'jdwp_kill.py');
		var jdwpKillProcess = this.drillbit.createPythonProcess([jdwpKill, this.androidSdk, this.device, this.drillbit.testHarnessId]);
		jdwpKillProcess();
	}
	this.testHarnessRunning = false;
};

AndroidEmulator.prototype.runTestHarness = function(suite, stagedFiles) {
	var forceBuild = 'forceBuild' in suite.options && suite.options.forceBuild;
	if (!this.testHarnessRunning || this.needsBuild || this.testHarnessNeedsBuild(stagedFiles) || forceBuild) {
		var command = 'build';
		var commandArgs = [];
		var needsInstall = true;
		var needsLaunch = false;

		if (this.device.indexOf('emulator') != 0) {
			command = 'install';
			commandArgs = [this.avdId, this.device];
			needsLaunch = true;
			needsInstall = false;
		}
		var process = this.createTestHarnessBuilderProcess(command, commandArgs);
		this.drillbit.frontendDo('building_test_harness', suite.name, 'android');

		var self = this;
		process.setOnReadLine(function(data) {
			var lines = data.split("\n");
			lines.forEach(function(line) {
				self.drillbit.frontendDo('process_data', line);
			});
		});
		process.setOnExit(function(e) {
			if (process.getExitCode() != 0) {
				self.drillbit.handleTestError(suite);
				return;
			}
			if (needsInstall) {
				self.installTestHarness(true);
			} else if (needsLaunch) {
				self.launchTestHarness();
			}
			self.testHarnessRunning = true;
			self.needsBuild = false;
		});
		process.launch();
	} else {
		// restart the app
		this.drillbit.frontendDo('running_test_harness', suite.name, 'android');

		// wait a few seconds after kill, every now and then the proc will still
		// be hanging up when we try to start it after kill returns
		var self = this;
		this.drillbit.window.setTimeout(function() {
			self.launchTestHarness();
		}, 2000);
	}
};

Titanium.createAndroidEmulator = function(drillbit, androidSdk, apiLevel, platform, googleApis) {
	return new AndroidEmulator(drillbit, androidSdk, apiLevel, platform, googleApis);
}

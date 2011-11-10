/**
 * Appcelerator Drillbit
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var ti = Ti = Titanium;

function iPhoneSimulator(drillbit, sdkVersion) {
	this.drillbit = drillbit;

	this.version = sdkVersion;
	this.iphoneBuilder = ti.path.join(drillbit.mobileSdk, 'iphone', 'builder.py');
	this.testJSFile = ti.fs.createTempFile();
	this.simulatorProcess = null;
};

iPhoneSimulator.prototype.createTestHarnessBuilderProcess = function(command, args) {
	var builderArgs = [this.iphoneBuilder,
		command, this.version, this.drillbit.testHarnessDir, this.drillbit.testHarnessId, 'test_harness'];

	if (args) {
		builderArgs = builderArgs.concat(args);
	}

	return this.drillbit.createPythonProcess(builderArgs);
};

iPhoneSimulator.prototype.getTestJSInclude = function() {
	Titanium.API.debug("drillbit test.js -> " + this.testJSFile.nativePath());
	return "Ti.includeAbsolute(\"" + this.testJSFile.nativePath() + "\")";
};

iPhoneSimulator.prototype.run = function(readLineCb) {
	// for iphone we just wait to run the simulator for each test harness
	this.readLineCb = readLineCb;
};

iPhoneSimulator.prototype.fillTestTemplateData = function(data) {
}

iPhoneSimulator.prototype.fillTiAppData = function(data) {
}

iPhoneSimulator.prototype.pushTestJS = function(testScript) {
	this.testJSFile.write(testScript);
};

iPhoneSimulator.prototype.stageSDK = function(sdkTimestamp) {
};

iPhoneSimulator.prototype.runTestHarness = function(suite, stagedFiles) {
	if (this.simulatorProcess != null) {
		this.simulatorProcess.terminate();
	}
	
	var buildDir = ti.fs.getFile(this.drillbit.testHarnessDir, 'build', 'iphone', 'build');
	if (!buildDir.exists()) {
		this.drillbit.frontendDo('building_test_harness', suite.name, 'iphone');
	} else {
		this.drillbit.frontendDo('running_test_harness', suite.name, 'iphone');
	}

	this.simulatorProcess = this.createTestHarnessBuilderProcess('simulator');
	this.simulatorProcess.setOnReadLine(this.readLineCb);
	this.simulatorProcess.launch();
};

Titanium.iPhoneSimulator = iPhoneSimulator;

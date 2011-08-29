/**
 * Appcelerator Drillbit
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 * 
 * The main drillbit module -- responsible for the setup, teardown, and running of test suites.
 * Delegates to a "frontend" object to show status
 */
var ti = Ti = Titanium;
// This should always list all available test platforms
var ALL_PLATFORMS = ['android', 'iphone'];

Drillbit = function() {
	this.module = ti.api.findModule('drillbit', '0.1.0');
	this.frontend = null;
	this.platforms = [];
	this.emulators = {};
	this.autoClose = false;
	this.debugTests = false;
	this.runTestsAsync = false;
	this.window = null;
	
	this.tests = {};
	this.testNames = [];
	this.totalAssertions = 0;
	this.totalTests = 0;
	this.totalFiles = 0;
	this.currentTest = null;
	this.testsStarted = 0;
	this.testDuration = 0;
	this.loadingTest = null;
	
	this.platformStatus = {};
	this.excludes = ['before', 'before_all', 'after', 'after_all', 'timeout', 'options'];
	this.runningTests = 0;
	this.runningCompleted = 0;
	this.runningPassed = 0;
	this.runningFailed = 0;
	this.testFailures = false;
	this.executingTests = [];
	this.currentPassed = 0;
	this.currentFailed = 0;
	this.currentTimer = 0;
	this.sdkTimestamp = null;
	
	this.resultsDir = ti.fs.getFile(ti.path.fromurl('app://test_results'));
	this.initPython();

	var app = Ti.API.getApplication();
	this.resourcesDir = app.getResourcesPath();
	this.contentsDir = ti.path.dirname(this.resourcesDir);
	this.testHarnessDir = ti.path.join(this.resourcesDir, 'test_harness');
	this.testHarnessResourcesDir = ti.path.join(this.testHarnessDir, 'Resources');
	this.testHarnessId = 'org.appcelerator.titanium.testharness';

	ti.include(ti.path.join(this.module.getPath(), 'lib', 'optimist.js'));
	ti.include(ti.path.join(this.module.getPath(), 'lib', 'ejs.js'));
	this.processArgv();

	this.drillbitTestJs = ti.fs.getFile(this.module.getPath(), 'drillbitTest.js').read().toString();
	this.templatesDir = ti.path.join(this.module.getPath(), 'templates');

	this.loadAllTests();

	var manifestPath = app.getManifestPath();
	var manifestHarness = ti.fs.getFile(ti.path.dirname(manifestPath), 'manifest_harness');
	this.setupTestHarness(manifestHarness);
	
	this.logPath = ti.fs.getFile(this.resultsDir, 'drillbitConsole.log');
	this.logPath.deleteFile();
	this.logStream = null;
	this.jsonBuffer = null;
};

Drillbit.prototype.processArgv = function() {
	this.mobileSdk = null;
	this.argv = Ti.Optimist.argv;
	var env = ti.api.getEnvironment();
	
	if ('mobileSdk' in this.argv) {
		this.mobileSdk = this.argv.mobileSdk;
	} else { // pull the latest version from the API
		var mobileSdks = ti.api.getInstalledMobileSDKs();
		if (mobileSdks.length > 0) {
			this.mobileSdk = mobileSdks[mobileSdks.length-1].getPath();
			ti.api.debug("No MobileSDK specified, using detected path: " + this.mobileSdk);
		}
	}
	
	if (this.mobileSdk == null) {
		ti.api.error("No MobileSDK found, please specify with --mobile-sdk, or install MobileSDK 1.5.0 or greater");
		ti.app.exit(1);
	}
	
	if ('mobileRepository' in this.argv) {
		this.mobileRepository = this.argv.mobileRepository;
	}
	
	this.extraTests = [];
	if ('testsDir' in this.argv) {
		if (Array.isArray(this.argv.testsDir)) {
			this.extraTests = this.argv.testsDir;
		} else {
			this.extraTests = [this.argv.testsDir];
		}
	}
	if ('DRILLBIT_TESTS_DIR' in env) {
		this.extraTests = this.extraTests.concat(env['DRILLBIT_TESTS_DIR'].split(ti.path.pathsep));
	}
	
	if ('resultsDir' in this.argv) {
		this.resultsDir = ti.fs.getFile(this.argv.resultsDir);
	} else if ('DRILLBIT_RESULTS_DIR' in env) {
		this.resultsDir = ti.fs.getFile(env['DRILLBIT_RESULTS_DIR']);
	}
	
	this.initPlatforms();
};

Drillbit.prototype.initPlatforms = function() {
	if (Titanium.App.Properties.hasProperty('testsPlatforms') && !('resetConfig' in this.argv) && !('platforms' in this.argv)) {
		this.argv['platforms'] = Titanium.App.Properties.getString('testsPlatforms');		
	}
	var platformsArg = 'platforms' in this.argv ? this.argv.platforms.split(',') : null;
	
	if (ti.Platform.isOSX()) {
		if (platformsArg == null || platformsArg.indexOf('iphone') != -1) {
			// Default to 4.0 iPhone SDK
			var iphoneVersion = 'iphoneVersion' in this.argv ? this.argv.iphoneVersion : "4.0";
			ti.api.info('Adding iPhone SDK to list of drillbit target platforms: ' + iphoneVersion);
			
			ti.include(ti.path.join(this.module.getPath(), 'iphone.js'));
			this.platforms.push('iphone');
			this.emulators.iphone = new Titanium.iPhoneSimulator(this, iphoneVersion);
		}
	}
	
	if (platformsArg == null || platformsArg.indexOf('android') != -1) {
		// Try to detect the Android SDK
		var androidSdkScript = ti.path.join(this.mobileSdk, 'android', 'androidsdk.py');
		var androidSdk = 'androidSdk' in this.argv ? this.argv.androidSdk : '-';
		var args = [androidSdkScript, androidSdk];
		
		if ('androidVersion' in this.argv) {
			args.push(this.argv.androidVersion);
		}
		
		var process = this.createPythonProcess(args);
		var result = process();
		ti.api.debug("result="+result);
		
		if (process.getExitCode() != 0) {
			ti.api.warn("No Android SDK found, disabling Android tests, exit code: " + process.getExitCode());
			return;
		}
		
		var androidSdkResult = {};
		result.toString().split(/\r?\n/).forEach(function(line) {
			var tokens = line.trim().split('=');
			if (tokens.length != 2) return;
			
			var key = tokens[0].trim();
			var value = tokens[1].trim();
			androidSdkResult[key] = value;
		});
		
		androidSdk = androidSdkResult['ANDROID_SDK'];
		platform = androidSdkResult['ANDROID_PLATFORM'];
		googleApis = androidSdkResult['GOOGLE_APIS'];
		apiLevel = androidSdkResult['ANDROID_API_LEVEL'];
		
		ti.api.info('Adding Android SDK to list of Drillbit target platforms. API Level: ' + apiLevel + ', SDK: ' + androidSdk + ', Platform: ' + platform + ' Google APIs: ' + googleApis);
		
		ti.include(ti.path.join(this.module.getPath(), 'android.js'));
		this.platforms.push('android');
		//this.emulators.android = new Titanium.AndroidEmulator(this, androidSdk, apiLevel, platform, googleApis);
		this.emulators.android = ti.createAndroidEmulator(this, androidSdk, apiLevel, platform, googleApis);
	}
	if (this.argv.platforms != null) {
		Titanium.App.Properties.setString("testsPlatforms", this.argv.platforms);
	}
};

Drillbit.prototype.initPython = function() {
	var python = "python";
	if (ti.Platform.isWin32()) {
		// Use bundled python module in win32
		var pythonModule = ti.api.findModule("python");
		if (pythonModule != null) {
			python = ti.path.join(pythonModule.getPath(), 'python.exe');
		} else {
			python += ".exe";
		}
	}
	this.python = python;
};

Drillbit.prototype.initHTTP = function() {
	var httpServer = Titanium.Network.createHTTPServer();
	var self = this;
	httpServer.bind(9999, function(request, response) {
		var len = request.getContentLength();
		var data = request.read(len);
		try {
			if (data != null) {
				var event = JSON.parse(data.toString());
				self.handleEvent(event);

				response.setContentType("text/plain");
				response.setContentLength(1);
				response.setStatusAndReason("200", "OK");
				response.write("#");
				if (event.name == "complete") {
					httpServer.close();
				}
			}
		} catch (e) {
			Ti.API.error(e);
		}
	});
};

Drillbit.prototype.eachEmulator = function(fn) {
	var self = this;
	Object.keys(this.emulators).forEach(function(platform) {
		fn(self.emulators[platform], platform);
	});
};

Drillbit.prototype.renderTemplate = function(path, data, toPath) {
	var file = ti.fs.getFile(path);
	try {
		var output = ti.createEJS({text: file.read().toString(), name: path}).render(data);
		if (typeof(toPath) != 'undefined') {
			var file = ti.fs.getFile(toPath);
			var stream = file.open(ti.fs.MODE_WRITE);
			stream.write(output);
			stream.close();
		}
		return output;
	} catch (e) {
		var msg = "Error rendering template: " + e + ",line:" + e.line;
		ti.api.error(msg);
		this.frontendDo('error', msg);
	}
	return null;
};

Drillbit.prototype.createPythonProcess = function(args) {
	var pyArgs = [this.python].concat(args);
	Ti.API.info("running: " + pyArgs.join(" "));
	return Ti.Process.createProcess(pyArgs);
};

Drillbit.prototype.frontendDo = function()
{
	try {
		var args = Array.prototype.slice.call(arguments);
	
		var fnName = args[0];
		args.shift();
	
		if (this.frontend &&
			fnName in this.frontend && typeof this.frontend[fnName] == 'function')
		{
			this.frontend[fnName].apply(this.frontend, args);
		}
	}
	catch (e)
	{
		Ti.App.stderr("Error: " +e);
	}
};

Drillbit.prototype.findLine = function(needle, haystack, fromIndex)
{
	fromIndex = fromIndex || 0;
	
	var lines = haystack.split('\n');
	for (var i = fromIndex; i < lines.length; i++)
	{
		if (needle.test(lines[i]))
		{
			if (/^[\t ]*{[\t ]*$/.test(lines[i+1]))
			{
				//offset by 1 when the bracket is on a seperate line
				// Function.toString show an inline bracket, so we need to compensate
				return i+1;
			}
			return i;
		}
	}
	return -1;
}

Drillbit.prototype.describe = function(description, test)
{
	ti.api.debug('describing test: ' + description + ', test = ' + test);
	this.loadingTest.description = description;
	this.loadingTest.test = test;
	this.loadingTest.lineOffsets = {};
	this.loadingTest.timeout = test.timeout || 5000;
	this.loadingTest.assertions = {};
	this.loadingTest.assertionCount = 0;
	this.loadingTest.options = 'options' in test ? test.options : {};
	
	var testSource = this.loadingTest.sourceFile.read().toString();
	
	for (var p in test) {
		if (this.excludes.indexOf(p) != -1) continue;
		var fn = test[p];
		if (typeof fn == 'function') {
			this.totalTests++;
			this.loadingTest.assertionCount++;
			this.loadingTest.assertions[p] = false;
			
			var r = new RegExp(p+" *: *function *\\(");
			this.loadingTest.lineOffsets[p] = this.findLine(r, testSource);
		} else if (fn instanceof AsyncTest) {
			this.totalTests++;
			this.loadingTest.assertionCount++;
			this.loadingTest.assertions[p] = false;
			
			if (typeof(fn.args) == 'function') {
				var r = new RegExp(p+" *: *asyncTest *\\( *function *\\(");
				this.loadingTest.lineOffsets[p] = this.findLine(r, testSource);
			} else if (typeof(fn.args.start) == 'function') {
				var objectRegex = new RegExp(p+" *: *asyncTest *\\( *\\{");
				var startRegex = new RegExp("start *: *function *\\(");
				var objectStart = this.findLine(objectRegex, testSource);
				this.loadingTest.lineOffsets[p] = this.findLine(startRegex, testSource, objectStart);
			}
		}
	}

	this.totalFiles++;
	this.loadingTest = null;
};

// This API is just a wrapper, the real asyncTest lives in drillbitTest.js
function AsyncTest(args) {
	this.args = args;
	this.async = true;
	if (typeof(args) == 'function') {
		this.source = String(args);
	} else {
		this.source = "{\n";
		var keys = Object.keys(args);
		keys.forEach(function(key, index) {
			var obj = args[key];
			var src = typeof(obj) == 'function' ? String(obj) : JSON.stringify(obj);
			this.source += key + ": " + src;
			if (index < keys.length - 1) {
				this.source += ",\n";
			} else {
				this.source += "\n";
			}
		}, this);
		this.source += "}";
	}
}

AsyncTest.prototype.toString = function() {
	return "asyncTest(" + this.source + ")";
}

Drillbit.prototype.asyncTest = function(args) {
	return new AsyncTest(args);
};

Drillbit.prototype.loadTestFile = function(testFile, platform, hasDir)
{
	var name = testFile.name();
	var ext = testFile.extension();
	if (ext != 'js') {
		return;
	}
	
	var platformSpecific = typeof(platform) != 'undefined';
	var testName = name.substring(0, name.indexOf('.'+ext));
	var dir = testFile.parent().nativePath();
	if (typeof(hasDir) == 'undefined') {
		if (testFile.parent().name() == testName) {
			hasDir = true;
		} else {
			hasDir = false;
		}
	}
	
	var entry = this.tests[name];
	if (!entry)
	{
		var platforms = platformSpecific ? [platform] : this.platforms;
		Ti.API.info("found test: " + testName + ', platforms: ' + platforms + ", dir: " + dir);
		entry = {name: testName, dir: dir, sourceFile: testFile, hasDir: hasDir, platforms: platforms, platformSpecific: platformSpecific};
		this.tests[testName] = entry;
		this.testNames.push(testName);
	}
	entry[ext] = testFile;
	this.loadingTest = entry;
	
	try
	{
		with (this) {
			eval(String(testFile.read()));
		}
	}
	catch(EX)
	{
		this.frontendDo('error', "error loading: "+testFile+". Exception: "+EX+" (line: "+EX.line+")");
	}
};

Drillbit.prototype.loadPlatformTestDir = function(testDir)
{
	var list = testDir.getDirectoryListing();
	var platform = testDir.name();
	for (var c = 0; c < list.length; c++)
	{
		var file = ti.fs.getFile(list[c]);
		if (file.isDirectory()) {
			this.loadTestDir(file, platform);
		} else {
			this.loadTestFile(file, platform, false);
		}
	}
};

Drillbit.prototype.loadTestDir = function(testDir, platform)
{
	var dirname = testDir.name();
	var testFile = ti.fs.getFile(testDir, dirname+".js");
	if (testFile.exists()) {
		this.loadTestFile(testFile, platform);
	}
};

Drillbit.prototype.loadTests = function(testDir)
{
	this.resultsDir.createDirectory();
	
	ti.api.debug("Load tests from: " + testDir);
	var testFiles = ti.fs.getFile(testDir).getDirectoryListing();
	for (var c = 0; c < testFiles.length; c++) {
		var file = ti.fs.getFile(testFiles[c]);
		var name = file.name();
		ti.api.debug("Trying to load tests from: " + file.nativePath());
		if (file.isDirectory()) {
			if (this.platforms.indexOf(name) != -1) {
				// platform specific tests
				this.loadPlatformTestDir(file);
			} else {
				if (ALL_PLATFORMS.indexOf(name) == -1) {
					this.loadTestDir(file);
				} else {
					ti.api.debug("Excluding " + name + " specific test: " + file.nativePath());
				}
			}
		} else {
			this.loadTestFile(file);
		}
	}

	this.testNames.sort();
};

Drillbit.prototype.loadAllTests = function()
{
	if (typeof(this.mobileRepository) != 'undefined') {
		this.loadTests(ti.path.join(this.mobileRepository, 'drillbit', 'tests'));
	} else {
		this.loadTests(ti.path.fromurl('app://tests'));
	}
	
	if (this.extraTests != null) {
		this.extraTests.forEach(function(extraTestDir) {
			if (ti.path.exists(extraTestDir)) {
				this.loadTests(extraTestDir);
			}
		}, this);
	}
};

Drillbit.prototype.handleTestEvent = function(event, platform) {
	this.frontendDo('show_current_test', event.suite, event.test);
};

Drillbit.prototype.handleCompleteEvent = function(event, platform) {
	var suite = event.suite;
	var results = event.results;
	var coverage = event.coverage;

	this.frontendDo('process_data', '==========End Test Suite : ' + suite + ", platform: " + platform);
	this.platformStatus[platform][suite].completed = true;
	try {
		if (this.window) this.window.clearInterval(this.currentTimer);
		if (!this.currentTest.failed) {
			var status = results.failed > 0 ? 'Failed' : 'Passed';
			this.platformStatus[platform][suite].passed = results.failed == 0;
			
			if (!('results' in this.currentTest)) {
				this.currentTest.results = {};
			}
			if (!('coverage' in this.currentTest)) {
				this.currentTest.coverage = {};
			}
			this.currentTest.results[platform] = results;
			if (coverage) {
				var coverage_platform = platform;
				// Hack to avoid renaming a bunch of stuff
				if (coverage_platform == 'iphone') {
					coverage_platform = 'ios';
				}
				this.currentTest.coverage[coverage_platform] = coverage;
			}
			this.frontendDo('test_platform_status', suite, status, platform);
			this.frontendDo('update_status', suite + ' complete ... ' + results.passed + ' passed, ' + results.failed + ' failed');
			if (!this.testFailures && results.failed > 0) {
				this.testFailures = true;
			}
		} else {
			this.testFailures = true;
		}
	} catch (E) {
		this.frontendDo('error', "onexit failure = "+E+" at "+E.line);
	}
	
	var allCompleted = true;
	var allPassed = true;
	var self = this;
	this.tests[suite].platforms.forEach(function(platform) {
		if (platform in this.platformStatus) {
			if (suite in this.platformStatus[platform]) {
				allCompleted = this.platformStatus[platform][suite].completed && allCompleted;
				allPassed = this.platformStatus[platform][suite].passed && allPassed;
				return;
			}
		}
		allCompleted = false;
	}, this);
	
	if (allCompleted) {
		this.frontendDo('suite_finished', suite);
		this.frontendDo('test_status', suite, allPassed ? 'Passed' : 'Failed', platform);
		this.generateResults(this.tests[suite]);
		this.runNextTest();
	}
};

Drillbit.prototype.handleTestStatusEvent = function(event, platform) {
	var platformStatus = this.platformStatus[platform];
	if (!platformStatus) {
		platformStatus = this.platformStatus[platform] = {};
	}
	
	var suite = event.suite;
	var test = event.test;
	
	var suiteStatus = platformStatus[suite];
	if (!suiteStatus) {
		suiteStatus = platformStatus[suite] = {completed: false, testStatus: {}};
	}
	
	var testStatus = suiteStatus.testStatus[test];
	if (!testStatus) {
		testStatus = suiteStatus.testStatus[test] = {passed: event.passed, completed: true};
	}
	testStatus.passed = event.passed;

	this.totalAssertions += event.assertions;
	this.frontendDo("update_assertions");

	var completed = true;
	var passedAll = true;
	var self = this;
	this.tests[suite].platforms.forEach(function(platform) {
		if (platform in this.platformStatus) {
			if (suite in this.platformStatus[platform]) {
				if (test in this.platformStatus[platform][suite].testStatus) {
					var t = this.platformStatus[platform][suite].testStatus[test];
				
					completed = t.completed && completed;
					passedAll = t.passed && passedAll;
					return;
				}
			}
		}
		completed = false;
	}, this);
	
	if (completed) {
		this.runningCompleted++;
		if (passedAll) {
			this.currentPassed++;
			this.runningPassed++;
			this.frontendDo('test_passed', suite, test, platform);
		} else {
			this.currentFailed++;
			this.runningFailed++;
			this.frontendDo('test_failed', suite, test, event.lineNumber, event.error, platform);
		}
		
		this.frontendDo('total_progress', this.runningPassed, this.runningFailed, this.totalTests);

		var msg = "Completed: " + suite + " ... " + this.runningCompleted + "/" + this.runningTests;
		this.frontendDo('update_status', msg);
	}
};

Drillbit.prototype.readLine = function(data, platform)
{
	var jsonData = null;
	if (this.jsonBuffer == null) {
		var eventPrefix = 'DRILLBIT_EVENT: ';
		var eventIndex = data.indexOf(eventPrefix);
		if (eventIndex == -1) {
			this.frontendDo('process_data', data);
			return;
		}
		jsonData = data.substring(eventIndex + eventPrefix.length);
	} else {
		jsonData = this.jsonBuffer + data;
		this.jsonBuffer = null;
	}

	try {
		var event = JSON.parse(jsonData);
		this.handleEvent(event, platform);
	} catch (e) {
		// JSON parse failed, buffer the data and try again with the new data next time
		this.jsonBuffer = jsonData;
	}
};

Drillbit.prototype.handleEvent = function(event) {
	Ti.API.debug("handling event: " + JSON.stringify(event));

	var platform = event.platform;
	var upperEventName = event.name.substring(0, 1).toUpperCase() + event.name.substring(1);
	var eventHandler = 'handle' + upperEventName + 'Event';
	if (eventHandler in this) {
		this[eventHandler](event, platform);
	} else if (eventHandler in this.emulators[platform]){
		this.emulators[platform][eventHandler](event, platform);
	}
};

Drillbit.prototype.setupTestHarness = function(harnessManifest)
{	
	var self = this;
	var testHarnessTiapp = ti.fs.getFile(this.testHarnessDir, 'tiapp.xml');
	if (!testHarnessTiapp.exists()) {
		var titaniumScript = ti.path.join(this.mobileSdk, 'titanium.py');
		var titaniumArgs = [titaniumScript, 'create', '--platform=' + this.platforms.join(','),
		'--dir='+this.resourcesDir, '--name=test_harness', '--id='+this.testHarnessId];
		
		if ('android' in this.emulators) {
			titaniumArgs.push('--android=' + this.emulators.android.androidSdk);
		}
		if ('iphone' in this.emulators) {
			titaniumArgs.push('--ver=' + this.emulators.iphone.version);
		}
		var createProjectProcess = this.createPythonProcess(titaniumArgs);
		createProjectProcess();
	}
	
	var data = {testJSIncludes: {}};
	this.eachEmulator(function(emulator, platform) {
		data.testJSIncludes[platform] = emulator.getTestJSInclude();
	});
	
	this.renderTemplate(ti.path.join(this.templatesDir, 'app.js'), data, ti.path.join(this.testHarnessResourcesDir, 'app.js'));
	ti.fs.getFile(this.resourcesDir, 'test_harness_console.html').copy(this.testHarnessResourcesDir);
	ti.fs.getFile(this.contentsDir, 'tiapp_harness.xml').copy(testHarnessTiapp);
	
	this.eachEmulator(function(emulator, platform) {
		emulator.run(function(data) {
			self.readLine(data, platform);
		});
	});
};

Drillbit.prototype.runTests = function(testsToRun)
{
	if (!testsToRun)
	{
		testsToRun = [];
		for (var i = 0; i < this.testNames.length; i++)
		{
			var suite = this.testNames[i];
			testsToRun.push({suite: suite, tests:'all', platforms: this.tests[suite].platforms});
		}
	}
	
	for (var i = 0; i < testsToRun.length; i++)
	{
		var name = testsToRun[i].suite;
		var entry = this.tests[name];
		entry.testsToRun = testsToRun[i].tests;
		entry.platforms = testsToRun[i].platforms;
		
		this.executingTests.push(entry);
		var self = this;
		entry.platforms.forEach(function(platform) {
			self.runningTests += entry.assertionCount;
		});
	}

	this.testsStarted = new Date().getTime();
	if (this.runTestsAsync)
	{
		var self = this;
		this.window.setTimeout(function() {
			self.runNextTest();
		}, 1);
	}
	else
	{
		this.runNextTest();
	}
};

Drillbit.prototype.stageSDK = function() {
	if (this.sdkTimestamp == null) {
		var versionTxt = ti.fs.getFile(this.mobileSdk, 'version.txt').read().toString();
		var version = {};
		versionTxt.split(/\n/).forEach(function(line) {
			var tokens = line.split('=');
			version[tokens[0]] = tokens[1];
		});
	
		this.sdkTimestamp = new Date(version.timestamp);
	}

	var mobileSupport = ti.path.join(this.mobileRepository, 'support');
	
	var stagedFiles = [];
	var self = this;
	// Stage support
	ti.path.recurse(mobileSupport, function(file) {
		var timestamp = new Date(file.modificationTimestamp());
		if (timestamp <= this.sdkTimestamp) return;
		
		var relativePath = ti.path.relpath(file.nativePath(), mobileSupport);
		var destFile = ti.fs.getFile(self.mobileSdk, relativePath);
		
		file.copy(destFile);
		stagedFiles.push(destFile);
	});
	
	// Ask each emulator to stage it's binaries
	this.eachEmulator(function(emulator, platform) {
		stagedFiles = stagedFiles.concat(emulator.stageSDK(this.sdkTimestamp));
	});
	
	if (stagedFiles.length > 0) {
		this.sdkTimestamp = new Date();
	}
	return stagedFiles;
};

Drillbit.prototype.stageTest = function(entry) {
	var stagedFiles = [];
	if (!entry.hasDir) return stagedFiles;
	
	var self = this;
	this.frontendDo('status', 'staging test ' + entry.name);
	ti.path.recurse(entry.dir, function(file) {
		if (file.name() == entry.name + '.js') return;
		
		var relativePath = ti.path.relpath(file.nativePath(), entry.dir);
		var destFile = ti.fs.getFile(self.testHarnessDir, relativePath);
		var parent = destFile.parent();
		
		ti.api.debug("copying " + file.nativePath() + " to " + destFile.nativePath());
		if (!parent.exists()) {
			parent.createDirectory(true);
		}
		
		file.copy(destFile);
		stagedFiles.push(destFile);
	});
	return stagedFiles;
};

Drillbit.prototype.runTest = function(entry)
{
	this.initHTTP();
	this.frontendDo("process_data", "==========Start Test Suite : " + entry.name);
	var data = {entry: entry, Titanium: Titanium, excludes: this.excludes, Drillbit: this, AsyncTest: AsyncTest};
	var testScript = this.renderTemplate(ti.path.join(this.templatesDir, 'test.js'), data);

	var self = this;
	entry.platforms.forEach(function(platform) {
		var emulator = self.emulators[platform];
		if (!emulator) return;
		emulator.pushTestJS(testScript);
	});

	var stagedFiles = this.stageTest(entry);
	/*if (typeof(this.mobileRepository) != 'undefined') {
		stagedFiles = stagedFiles.concat(this.stageSDK());
	}*/
	
	var profilePath = ti.fs.getFile(this.resultsDir, entry.name+'.prof');
	var logPath = ti.fs.getFile(this.resultsDir, entry.name+'.log');

	profilePath.deleteFile();
	this.currentPassed = 0;
	this.currentFailed = 0;
	this.currentTimer = null;

	entry.platforms.forEach(function(platform) {
		var emulator = self.emulators[platform];
		if (!emulator) return;
		
		emulator.runTestHarness(entry, stagedFiles);
	});

	this.checkForTimeout();
};

Drillbit.prototype.checkForTimeout = function()
{
	// TODO add test suite timeout checking code
};

Drillbit.prototype.runNextTest = function()
{
	if (this.executingTests == null || this.executingTests.length == 0)
	{
		this.testDuration = (new Date().getTime() - this.testsStarted)/1000;
		this.frontendDo('all_finished');
		this.executingTests = null;
		this.currentTest = null;
		this.frontendDo('update_status', 'Testing complete ... took ' + this.testDuration + ' seconds',true);
		this.generateFinalResults();
		if (this.autoClose)
		{
			Ti.App.exit(this.testFailures ? 1 : 0);
		}
		return;
	}
	var entry = this.executingTests.shift();
	this.currentTest = entry;
	this.currentTest.failed = false;
	this.frontendDo('update_status', 'Executing: '+entry.name+' ... '+this.runningCompleted + "/" + this.runningTests);
	this.frontendDo('suite_started', entry.name, entry.platforms);
	var self = this;
	this.runTestsAsync ? this.window.setTimeout(function(){self.runTest(entry)},1) : this.runTest(entry);
};

Drillbit.prototype.generateResults = function(test) {
	var resultsJson = ti.fs.getFile(this.resultsDir, test.name + '.json');
	var resultsJsonStream = resultsJson.open(ti.fs.MODE_WRITE);
	resultsJsonStream.write(JSON.stringify(test.results));
	resultsJsonStream.close();

	if ('coverage' in test) {
		var coverageJson = ti.fs.getFile(this.resultsDir, test.name + 'Coverage.json');
		var coverageJsonStream = coverageJson.open(ti.fs.MODE_WRITE);
		coverageJsonStream.write(JSON.stringify(test.coverage));
		coverageJsonStream.close();
	}

	var data = {test: test, ti: ti};
	var resultsHtml = ti.fs.getFile(this.resultsDir, test.name + '.html').nativePath();
	this.renderTemplate(ti.path.join(this.templatesDir, 'results.html'), data, resultsHtml);
};

Drillbit.prototype.generateFinalResults = function()
{
	var drillbitJson = ti.fs.getFile(this.resultsDir, 'drillbit.json');
	var drillbitJsonStream = drillbitJson.open(ti.fs.MODE_WRITE);
	
	var finalResults = {};
	Object.keys(this.tests).forEach(function(suite) {
		finalResults[suite] = this.tests[suite].results;
	}, this);
	
	drillbitJsonStream.write(JSON.stringify(finalResults));
	drillbitJsonStream.close();
	this.logStream.close();
	this.logStream = null;
};

Drillbit.prototype.handleTestError = function(suite)
{
	this.frontendDo('test_platform_status', suite.name, 'Error', 'android');
	this.frontendDo('test_status', suite.name, 'Error')
	this.testDuration = (new Date().getTime() - this.testsStarted)/1000;
	this.frontendDo('all_finished');
}

Drillbit.prototype.reset = function()
{
	this.executingTests = [];
	this.runningTests = 0;
	this.runningCompleted = 0;
	this.runningPassed = this.runningFailed = this.totalAssertions = 0;
};

Drillbit.prototype.rescan = function()
{
	this.reset();
	this.tests = {};
	this.testNames = [];
	this.totalTests = 0;
	this.totalFiles = 0;
	this.testsStarted = 0;
	
	this.loadAllTests();
};

Titanium.Drillbit = new Drillbit();

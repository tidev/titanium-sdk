module.exports = new function() {
	var MEMO_APP_ID = 'org.tizen.memo',
		NOT_EXIST_APP_ID = 'Not_exist_app_id.asdfs',
		finish,
		valueOf,
		reportError,
		Tizen,
		isRunningMemo;

	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
		reportError = testUtils.reportError;
		Tizen = require('tizen');
	}

	this.name = 'application';
	this.tests = [
		{name: 'apps_info'},
		{name: 'app_info'},
		{name: 'app_info_not_exist'},
		{name: 'apps_contexts'},
		{name: 'apps_contexts_harness'},
		{name: 'apps_contexts_no_params'},
		{name: 'launch_not_exist'},
		{name: 'launchAppControl'},
		{name: 'findAppControl'},
		{name: 'calc_launch'}
	];

	function _runingAppWithId(runingAppArray, appId) {
		for (var i = 0, len = runingAppArray.length; i < len; i++) {
			if (runingAppArray[i].appId == appId) {
				return true;
			}
		};

		return false;
	}

	// Test - List of Installed Applications
	this.apps_info = function(testRun) {
		var isMemoAppOnEmulator,
			appInstalledCount = 0;

		valueOf(testRun, function() {
			Tizen.Apps.getAppsInfo(function(applications) {
				appInstalledCount = applications.length;
				Ti.API.info("appInstalledCount: " + appInstalledCount);

				valueOf(testRun, appInstalledCount).shouldBeGreaterThan(0);

				for (var i = 0, len = appInstalledCount; i < len; i++) {
					valueOf(testRun, applications[i]).shouldNotBeUndefined();
					valueOf(testRun, applications[i]).shouldBeObject();
					valueOf(testRun, applications[i].toString()).shouldBe('[object TizenAppsApplicationInformation]');

					if (applications[i].id && applications[i].id === MEMO_APP_ID) {
						isMemoAppOnEmulator = true;
					}
				}

				valueOf(testRun, isMemoAppOnEmulator).shouldBeTrue();

				finish(testRun);
			});
		}).shouldNotThrowException();
	}

	// Test - get Application info with correct info
	this.app_info = function(testRun) {
		var calcAppInfo,
			harnessAppInfo;

		calcAppInfo = Tizen.Apps.getAppInfo(MEMO_APP_ID),
		harnessAppInfo = Tizen.Apps.getAppInfo();

		valueOf(testRun, calcAppInfo).shouldBe('[object TizenAppsApplicationInformation]');
		valueOf(testRun, calcAppInfo).shouldNotBeUndefined();
		valueOf(testRun, calcAppInfo.id).shouldBeEqual(MEMO_APP_ID);
		valueOf(testRun, calcAppInfo.name).shouldBeEqual('Memo');
		valueOf(testRun, calcAppInfo.installDate instanceof Date).shouldBeTrue();
		valueOf(testRun, calcAppInfo.size).shouldBeNumber();
		valueOf(testRun, calcAppInfo.version).shouldBeString();
		valueOf(testRun, calcAppInfo.iconPath).shouldBeString();
		valueOf(testRun, calcAppInfo.show).shouldBeBoolean();

		valueOf(testRun, harnessAppInfo).shouldBe('[object TizenAppsApplicationInformation]');
		valueOf(testRun, harnessAppInfo).shouldNotBeUndefined();
		valueOf(testRun, harnessAppInfo.id).shouldBeString();
		valueOf(testRun, harnessAppInfo.name).shouldBeEqual('test_harness');
		valueOf(testRun, harnessAppInfo.installDate instanceof Date).shouldBeTrue();
		valueOf(testRun, harnessAppInfo.installDate).shouldNotBeNull();
		valueOf(testRun, harnessAppInfo.size).shouldBeNumber();
		valueOf(testRun, calcAppInfo.version).shouldBeString();
		valueOf(testRun, calcAppInfo.iconPath).shouldBeString();
		valueOf(testRun, calcAppInfo.show).shouldBeBoolean();

		finish(testRun);
	}

	// Test - Negative scenario - get Application info with NOT correct parameters
	this.app_info_not_exist = function(testRun) {
		valueOf(testRun, function() {
			Tizen.Apps.getAppInfo(NOT_EXIST_APP_ID);
		}).shouldThrowException();

		finish(testRun);
	}

	this.apps_contexts = function(testRun) {
		var isSuccess,
			runingAppArray;

		valueOf(testRun, function() {
			Tizen.Apps.getAppsContext(function(contexts) {
				var i = 0,
					contextsCount = contexts.length;

				Ti.API.info("contextsCount: " + contextsCount);

				for (; i < contextsCount; i++) {
					valueOf(testRun, contexts[i].toString()).shouldBe('[object TizenAppsApplicationContext]');
				}

				isSuccess = true; 
				runingAppArray = contexts;
			});
		}).shouldNotThrowException();

		setTimeout(function() {
			valueOf(testRun, isSuccess).shouldBeTrue();
			valueOf(testRun, runingAppArray.length).shouldBeGreaterThan(0);

			for (var i = 0, len = runingAppArray.length; i < len; i++) {
				valueOf(testRun, runingAppArray[i].id).shouldNotBeUndefined();
				valueOf(testRun, runingAppArray[i].id).shouldBeString();
				valueOf(testRun, runingAppArray[i].appId).shouldBeString();	
			}

			finish(testRun);
		}, 2000);
	}

	// Test - check does getAppsContext return harness id
	this.apps_contexts_harness = function(testRun) {
		Ti.API.info('Start apps_contexts_harness');

		var runingAppArray = [],
			isHarness,
			harness = Tizen.Apps.getAppInfo();

		valueOf(testRun, harness).shouldBe('[object TizenAppsApplicationInformation]');
		valueOf(testRun, harness.id).shouldNotBeUndefined();
		valueOf(testRun, function() {
			Tizen.Apps.getAppsContext(function(contexts) {
				runingAppArray = contexts;
			});
		}).shouldNotThrowException();

		finish(testRun);

		setTimeout(function() {
			isHarness = _runingAppWithId(runingAppArray, harness.id);

			valueOf(testRun, runingAppArray.length).shouldBeGreaterThan(0);
			valueOf(testRun, isHarness).shouldBeTrue();
			
			finish(testRun);
		}, 1000);
	}

	// Test - Negative scenario - Does getAppsContext catch exception with no parameters
	this.apps_contexts_no_params = function(testRun) {
		valueOf(testRun, function() {
			Tizen.Apps.getAppsContext();
		}).shouldThrowException();

		finish(testRun);
	}

	// Test - laucn calc application and kill calc application
	this.calc_launch = function(testRun) {
		// Launch Calculator
		valueOf(testRun, function() {
			Tizen.Apps.launch(MEMO_APP_ID); 
		}).shouldNotThrowException();

		// Call getAppsContext for recieving all running application
		valueOf(testRun, function() {
			Tizen.Apps.getAppsContext(function(contexts) {
				isRunningMemo = _runingAppWithId(contexts, MEMO_APP_ID);

				valueOf(testRun, contexts.length).shouldBeGreaterThan(0);
				valueOf(testRun, isRunningMemo).shouldBeTrue();

				finish(testRun);
			});
		}).shouldNotThrowException();
	}

	// Test - Negative scenario - try to launch NOT existing app
	this.launch_not_exist = function(testRun) {
		var isError;

		valueOf(testRun, function() {
			Tizen.Apps.launch(
				NOT_EXIST_APP_ID,
				function() {
					Ti.APi.info('Launched success.');
				}, 
				function(error) {
					Ti.API.error("Error: " + error.message);

					isError = true;
				}
			);
		}).shouldNotThrowException();

		setTimeout(function() {
			valueOf(testRun, isError).shouldBeTrue();

			finish(testRun);
		}, 2000);
	}

	// Test - launch image from another appControl
	this.launchAppControl = function(testRun) {
		var serviceLaunched,
			isError = false,
			appControl,
			appControlReplyCallback = { 
				// Callee sent a reply
				onsuccess: function(data) {
					Ti.API.info('Success reply.');

					for (var i = 0; i < data.length; i++) {
						valueOf(testRun, data[i]).shouldBeObject();
					}
				},
				// Something went wrong
				onfailure: function() {
				   Ti.API.info('The launch application control failed.');

				   reportError(testRun, 'The following error occurred: ' + e.message);
				}
			};

		valueOf(testRun, function() {
			appControl = Tizen.Apps.createApplicationControl({
				operation: "http://tizen.org/appcontrol/operation/create_content",
				uri: null,
				mime: "image/jpeg",
				category: null
			});
		}).shouldNotThrowException();
		valueOf(testRun, appControl).shouldBeObject();
		valueOf(testRun, function() {
			Tizen.Apps.launchAppControl(appControl, null,
				function() {
					serviceLaunched = true;

					Ti.API.info("launch application control succeed"); 
				},
				function(e) {
					isError = true;

					Ti.API.info("launch application control failed. reason: " + e.message); 
					
					reportError(testRun, 'The following error occurred: ' + e.message);
				},
				appControlReplyCallback
			);
		}).shouldNotThrowException();

		setTimeout(function() {
			valueOf(testRun, serviceLaunched).shouldBeTrue();
			valueOf(testRun, isError).shouldBeFalse();

			finish(testRun);
		}, 5000);
	}

	this.findAppControl = function(testRun) {
		var appControl,
			operation = "http://tizen.org/appcontrol/operation/create_content",
			mime = "image/jpeg";

		valueOf(testRun, function() {
			appControl = Tizen.Apps.createApplicationControl({
				operation: operation,
				uri: null,
				mime: mime,
				category: null
			});
		}).shouldNotThrowException();

		function errorCB(error) {
			reportError(testRun, 'The following error occurred: ' + error.message);
			finish(testRun);
		}

		function successCB(appInfos, appControl) {
			Ti.API.info('successCB for findAppControl');

			valueOf(testRun, appInfos).shouldBeArray();
			valueOf(testRun, appControl).shouldBeObject();
			valueOf(testRun, appControl.operation).shouldBeEqual(operation);
			valueOf(testRun, appControl.mime).shouldBeEqual(mime);
 
			for (var i = 0, len = appInfos.length; i < len; i++) {
				valueOf(testRun, appInfos[i]).shouldBe('[object TizenAppsApplicationInformation]');
				valueOf(testRun, appInfos[i].id).shouldBeString();
				valueOf(testRun, appInfos[i].name).shouldBeString();
			}

			finish(testRun);
		}

		Tizen.Apps.findAppControl(appControl, successCB, errorCB);
	}

}

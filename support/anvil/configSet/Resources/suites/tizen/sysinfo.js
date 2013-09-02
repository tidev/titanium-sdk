/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

module.exports = new function() {
	var finish,
		valueOf,
		checkCallbackMethod,
		reportError,
		Tizen;

	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
		reportError = testUtils.reportError;
		checkCallbackMethod = checkCallbackMethodFunction;
		Tizen = require('tizen');
	}

	//Tests for Tizen Device API: SystemInfo Device API
	this.name = 'sysinfo';
	this.tests = [
		{name: 'checkSystemInfo'},
		{name: 'getCpuProperty'},
		{name: 'getStorageProperty'},
		{name: 'getCellularNetworkProperty'},
		{name: 'getSimProperty'},
		{name: 'testListenersCpu'},
		{name: 'testListenersStorage'},
		{name: 'testListenersSIM'},
		{name: 'testListenersCellularNetwork'},
		{name: 'testListenersWifiNetwork'},
		{name: 'testGetCapabilities'}
	];

	this.checkSystemInfo  = function(testRun) {

		Ti.API.debug('Checking SystemInfo object availability.');
		valueOf(testRun, Tizen).shouldBeObject();
		valueOf(testRun, Tizen.SystemInfo).shouldBeObject();
		finish(testRun);
	}

	this.getCpuProperty = function(testRun) {
		// Test for Tizen Device API: SystemInfoCpu.
		function callback(response) {
			if (response.success) {
				var cpuData = response.data;
				console.debug('The power CPU load level is ' + cpuData.load);
				valueOf(testRun, cpuData.toString()).shouldBe('[object TizenSystemInfoSystemInfoCpu]');
				valueOf(testRun, cpuData.load).shouldBeNumber(); // double!
				finish(testRun);
			} else {
				console.error('An error occurred on Cpu property:' + response.error);
				finish(testRun);
			}
		}

		valueOf(testRun, Tizen.SystemInfo.getPropertyValue).shouldBeFunction();
		Tizen.SystemInfo.getPropertyValue(Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_CPU, callback);
	}

	this.getStorageProperty = function(testRun) {
		// Test for Tizen Device API: SystemInfoStorage and SystemInfoStorageUnit.
		function callback(response) {
			if (response.success) {
				var systemInfoStorage = response.data;
				console.debug('Storage info: ' + JSON.stringify(systemInfoStorage));

				valueOf(testRun, systemInfoStorage.toString()).shouldBe('[object TizenSystemInfoSystemInfoStorage]');

				if (systemInfoStorage.units) {
					var i = 0, 
						len = systemInfoStorage.units.length,
						current;

					for (; i < len; i++) {
						current  = systemInfoStorage.units[i];

						console.debug('Storage info: ' + JSON.stringify(current));

						valueOf(testRun, current.toString()).shouldBe('[object TizenSystemInfoSystemInfoStorageUnit]');
					}
				}

				finish(testRun);
			} else {
				console.error('An error occurred on Storage property:' + response.error);
				finish(testRun);
			}
		}

		valueOf(testRun, Tizen.SystemInfo.getPropertyValue).shouldBeFunction();
		Tizen.SystemInfo.getPropertyValue(Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_STORAGE, callback);
	}

	this.getCellularNetworkProperty = function(testRun) {
		// Test for Tizen Device API: SystemInfoCellularNetwork.
		function callback(response) {
			if (response.success) {
				var systemInfoCellularNetwork = response.data;
				console.debug('Cellular network info: ' + JSON.stringify(systemInfoCellularNetwork));

				valueOf(testRun, systemInfoCellularNetwork).shouldBe('[object TizenSystemInfoSystemInfoCellularNetwork]');

				if (systemInfoCellularNetwork){
					valueOf(testRun, systemInfoCellularNetwork.status).shouldBeString();
					valueOf(testRun, systemInfoCellularNetwork.apn).shouldBeString();
					valueOf(testRun, systemInfoCellularNetwork.ipAddress).shouldBeString();
					valueOf(testRun, systemInfoCellularNetwork.ipv6Address).shouldBeString();
					valueOf(testRun, systemInfoCellularNetwork.mcc).shouldBeNumber();
					valueOf(testRun, systemInfoCellularNetwork.mnc).shouldBeNumber();
					valueOf(testRun, systemInfoCellularNetwork.cellId).shouldBeNumber();
					valueOf(testRun, systemInfoCellularNetwork.lac).shouldBeNumber();
					valueOf(testRun, systemInfoCellularNetwork.isRoaming).shouldBeBoolean();
				}
				finish(testRun);
			} else {
				console.error('An error occurred on "CellularNetwork" property:' + response.error);
				finish(testRun);
			}
		}

		valueOf(testRun, Tizen.SystemInfo.getPropertyValue).shouldBeFunction();
		Tizen.SystemInfo.getPropertyValue(Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_CELLULAR_NETWORK, callback);
	}

	this.getSimProperty = function(testRun) {
		// Test for Tizen Device API: SystemInfoSIM.
		function callback(response) {
			if (response.success) {
				var systemInfoSIM = response.data;
				console.debug('SIM info: ' + JSON.stringify(systemInfoSIM));

				valueOf(testRun, systemInfoSIM).shouldBe('[object TizenSystemInfoSystemInfoSIM]');

				if (systemInfoSIM) {
					valueOf(testRun, systemInfoSIM.operatorName).shouldBeString();
					valueOf(testRun, systemInfoSIM.msisdn).shouldBeString();
					valueOf(testRun, systemInfoSIM.iccid).shouldBeString();
					valueOf(testRun, systemInfoSIM.msin).shouldBeString();
					valueOf(testRun, systemInfoSIM.spn).shouldBeString();
					valueOf(testRun, systemInfoSIM.mcc).shouldBeNumber();
					valueOf(testRun, systemInfoSIM.mnc).shouldBeNumber();
				}

				finish(testRun);
			} else {
				console.error('An error occurred on SIM property:' + response.error);
				finish(testRun)
			}
		}

		valueOf(testRun, Tizen.SystemInfo.getPropertyValue).shouldBeFunction();
		Tizen.SystemInfo.getPropertyValue(Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_SIM, callback);
	}

	this.testListenersCpu = function(testRun) {
		checkCallbackMethod( {propertyName: Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_CPU, testRun: testRun, optionsParameter: {}} );
	}

	this.testListenersStorage = function(testRun) {
		checkCallbackMethod( {propertyName: Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_STORAGE, testRun: testRun, optionsParameter: {}} );
	}

	this.testListenersWifiNetwork = function(testRun) {
		checkCallbackMethod( {propertyName: Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_WIFI_NETWORK, testRun: testRun, optionsParameter: {} });
	}

	this.testListenersCellularNetwork = function(testRun) {
		checkCallbackMethod( {propertyName: Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_CELLULAR_NETWORK, testRun: testRun, optionsParameter: {} });
	}

	this.testListenersSIM = function(testRun) {
		checkCallbackMethod( {propertyName: Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_SIM, testRun: testRun, optionsParameter: {} });
	}

	this.testGetCapabilities = function(testRun) {
		var capabilities;

		valueOf(testRun, function() {
			capabilities = Tizen.SystemInfo.getCapabilities();
		}).shouldNotThrowException();

		valueOf(testRun, capabilities.toString()).shouldBe('[object TizenSystemInfoSystemInfoDeviceCapability]');
		valueOf(testRun, capabilities.profile).shouldBeString();

		finish(testRun);
	}

	// Helper that allows to test addPropertyValueChangeListener, removePropertyValueChangeListener, SystemInfoOptions
	// will be completed in 2 sec in any case.
	function checkCallbackMethodFunction (data) {
		Ti.API.debug('Running listener check for: ' + (data ? data.propertyName : '[Wrong parameter!]'));
		var id,
			testRun = data.testRun,
			waitTimeout;

		// Removes current listener. Must be completed to accept valid test.
		function removeListener() {
			valueOf(testRun, id).shouldNotBeNull();
			Ti.API.debug('removing listener with ID: ' + id);
			try {
				valueOf(testRun, Tizen.SystemInfo.removePropertyValueChangeListener).shouldBeFunction();
				Tizen.SystemInfo.removePropertyValueChangeListener(id);
			} catch(e) {
				reportError(testRun, JSON.stringify(e));
			}
		}

		// If can accept test as on success callback as without it.
		function onSuccessCallback(dataObject) {
			Ti.API.debug('Test completed by success callback with parameter: ' + JSON.stringify(dataObject|''));
			valueOf(testRun, dataObject).shouldBe('[object TizenSystemInfoSystemInfoStorage]');
			clearFakeTimeout();  // Cancel fake timer call.

			valueOf(testRun, dataObject).shouldNotBeNull();
			removeListener();
			finish(testRun);
		}

		// If called with not null - test failed!
		function onErrorCallback(error) {
			Ti.API.info('Test completed by error callback - ' + JSON.stringify(error));
			valueOf(testRun, error).shouldBe('[object TizenWebAPIError]');
			clearFakeTimeout(); // Cancel fake timer call.
			reportError(testRun, JSON.stringify(error));
		}

		// Clears timeout if it was set before.
		function clearFakeTimeout() {
			if (waitTimeout) {
				// Cancel fake call if any.
				clearTimeout(waitTimeout); 
			}
		}

		// We don't need to wait for real callbacks from device,
		// as generally we are testing that we can subscribe and unsubscribe.
		waitTimeout = setTimeout(function() {
			Ti.API.debug('Test completed by timeout!');
			removeListener();
			finish(testRun);
		}, 2000);

		try {
			// According to documentation:
			// 'Tizen Web App Programming' => 'Programming Guide' => 'Device' => 'Obtain Details on Basic Supported Properties'
			// devices MAY not support all properties. Some properties vary from device to device.
			valueOf(testRun, Tizen.SystemInfo.addPropertyValueChangeListener).shouldBeFunction();

			id = Tizen.SystemInfo.addPropertyValueChangeListener(data.propertyName, onSuccessCallback, onErrorCallback, data.optionsParameter);
			valueOf(testRun, id).shouldBeGreaterThanEqual(0);
			if (id < 0) {
				clearFakeTimeout();
				Ti.API.warn('Property ' + data.propertyName + ' did not accepted listener. This may depends on device.');
				finish(testRun);
			}
		} catch(e) {
			clearFakeTimeout();
			reportError(testRun, JSON.stringify(e));
		}
	}
}

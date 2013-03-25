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
		// {name: 'allPropertiesSupported'},
		{name: 'getCpuProperty'},
		{name: 'getStorageProperty'},
		{name: 'getCellularNetworkProperty'},
		// {name: 'getEthernetNetworkProperty'},
		{name: 'getSimProperty'},
		{name: 'testListenersCpu'},
		{name: 'testListenersStorage'},
		// {name: 'testListenersDevice'},
		{name: 'testListenersSIM'},
		//{name: 'testListenersEthernetNetwork'},
		{name: 'testListenersCellularNetwork'},
		{name: 'testListenersWifiNetwork'}
	];

	this.checkSystemInfo  = function(testRun) {

		Ti.API.debug('Checking SystemInfo object availability.');
		valueOf(testRun, Tizen).shouldBeObject();
		valueOf(testRun, Tizen.SystemInfo).shouldBeObject();
		finish(testRun);
	}

	this.allPropertiesSupported = function(testRun) {
		// Test for Tizen Device API: do all documented properties are supported?
		// according to 'Tizen Web App Programming' => 'Programming Guide' => 'Device' => 'SystemInfo'
		// Basic Supported Properties are: Power, Cpu, Storage, Display, Device, WifiNetwork, CellularNetwork.
		// And 'Network', 'EthernetNetwork', 'SIM', 'DeviceOrientation' are NOT 'Basic Supported Properties' and depends on device
		var i = 0,
			current,
			isSupported,
			listOfAllProperties = [
				Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_BATTERY,
				Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_CPU,
				Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_STORAGE,
				Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_DISPLAY,
				Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_BUILD,
				Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_NETWORK,
				Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_WIFI_NETWORK,
				Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_CELLULAR_NETWORK,
				Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_SIM,
				Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_DEVICE_ORIENTATION
			],
			len = listOfAllProperties.length;

		for (; i < len; i++) {
			current  = listOfAllProperties[i];
			try{
				isSupported = Tizen.SystemInfo.isSupported(current);
				valueOf(testRun, isSupported).shouldBeTrue(); // test passed only if all properties are supported!

				if (isSupported) {
					Ti.API.debug('"' + current + '" property is supported.');
				} else {
					Ti.API.debug('"' + current + '" property is not supported.');
				}
			}catch (e) {
				Ti.API.debug('"' + current + '" property cause exception: ' + e.message);
				reportError(testRun, JSON.stringify(e));
			}
		}
		finish(testRun);
	}

	this.getCpuProperty = function(testRun) {
		//Test for Tizen Device API: SystemInfoCpu
		function onSuccessCallback(cpuData) {
			Ti.API.debug('The power CPU load level is ' + cpuData.load);
			
			valueOf(testRun, cpuData.toString()).shouldBe('[object TizenSystemInfoSystemInfoCpu]');
			valueOf(testRun, cpuData.load).shouldBeNumber(); // double!
			finish(testRun);
		}

		function onErrorCallback(error) {
			Ti.API.info('An error occurred on Cpu property:' + error.message);
			
			valueOf(testRun, error.toString()).shouldBe('[object TizenWebAPIError]');
			finish(testRun);
		}

		valueOf(testRun, Tizen.SystemInfo.getPropertyValue).shouldBeFunction();
		Tizen.SystemInfo.getPropertyValue(Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_CPU, onSuccessCallback, onErrorCallback);
	}

	this.getStorageProperty = function(testRun) {
		//Test for Tizen Device API: SystemInfoStorage and SystemInfoStorageUnit
		function onSuccessCallback(systemInfoStorage) {
			Ti.API.debug('Storage info: ' + JSON.stringify(systemInfoStorage));

			valueOf(testRun, systemInfoStorage.toString()).shouldBe('[object TizenSystemInfoSystemInfoStorage]');

			if (systemInfoStorage.units) {
				var i = 0, 
					len = systemInfoStorage.units.length,
					current;

				for (; i < len; i++) {
					current  = systemInfoStorage.units[i];

					Ti.API.debug('Storage info: ' + JSON.stringify(current));

					valueOf(testRun, current.toString()).shouldBe('[object TizenSystemInfoSystemInfoStorageUnit]');
				}
			}

			finish(testRun);
		}

		function onErrorCallback(error) {
			Ti.API.info('An error occurred on Storage property:' + error.message);
			valueOf(testRun, error.toString()).shouldBe('[object TizenWebAPIError]');
			finish(testRun);
		}

		valueOf(testRun, Tizen.SystemInfo.getPropertyValue).shouldBeFunction();
		Tizen.SystemInfo.getPropertyValue(Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_STORAGE, onSuccessCallback, onErrorCallback);
	}

	this.getCellularNetworkProperty = function(testRun) {
	// Test for Tizen Device API: SystemInfoCellularNetwork
		function onSuccessCallback(systemInfoCellularNetwork) {
			Ti.API.debug('Cellular network info: ' + JSON.stringify(systemInfoCellularNetwork));
			
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
		}

		function onErrorCallback(error) {
			Ti.API.info('An error occurred on "CellularNetwork" property:' + error.message);
			valueOf(testRun, error).shouldBe('[object TizenWebAPIError]');
			finish(testRun);
		}

		valueOf(testRun, Tizen.SystemInfo.getPropertyValue).shouldBeFunction();
		Tizen.SystemInfo.getPropertyValue(Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_CELLULAR_NETWORK, onSuccessCallback, onErrorCallback);
	}

	this.getEthernetNetworkProperty = function(testRun) {
	// Test for Tizen Device API: SystemInfoEthernetNetwork
		function onSuccessCallback(systemInfoEthernetNetwork) {
			Ti.API.debug('Ethernet network info: ' + JSON.stringify(systemInfoEthernetNetwork));
			
			valueOf(testRun, systemInfoEthernetNetwork).shouldBe('[object TizenSystemInfoSystemInfoEthernetNetwork]');
			
			if (systemInfoEthernetNetwork){
				valueOf(testRun, systemInfoEthernetNetwork.status).shouldBeString();
				valueOf(testRun, systemInfoEthernetNetwork.ipAddress).shouldBeString();
				valueOf(testRun, systemInfoEthernetNetwork.ipv6Address).shouldBeString();
				valueOf(testRun, systemInfoEthernetNetwork.proxyAddress).shouldBeString();
				valueOf(testRun, systemInfoEthernetNetwork.macAddress).shouldBeString();
				valueOf(testRun, systemInfoEthernetNetwork.gateway).shouldBeString();
				valueOf(testRun, systemInfoEthernetNetwork.dns).shouldBeString();
				valueOf(testRun, systemInfoEthernetNetwork.subnetMask).shouldBeString();
			}
			finish(testRun);
		}

		function onErrorCallback(error) {
			Ti.API.info('An error occurred on EthernetNetwork property:' + error.message);
			valueOf(testRun, error).shouldBe('[object TizenWebAPIError]');
			finish(testRun);
		}

		valueOf(testRun, Tizen.SystemInfo.getPropertyValue).shouldBeFunction();
		Tizen.SystemInfo.getPropertyValue('EthernetNetwork', onSuccessCallback, onErrorCallback);
	}

	this.getSimProperty = function(testRun) {
	// Test for Tizen Device API: SystemInfoSIM
		function onSuccessCallback(systemInfoSIM) {
			Ti.API.debug('SIM info: ' + JSON.stringify(systemInfoSIM));
			
			valueOf(testRun, systemInfoSIM).shouldBe('[object TizenSystemInfoSystemInfoSIM]');
			
			if (systemInfoSIM){
				valueOf(testRun, systemInfoSIM.operatorName).shouldBeString();
				valueOf(testRun, systemInfoSIM.msisdn).shouldBeString();
				valueOf(testRun, systemInfoSIM.iccid).shouldBeString();
				valueOf(testRun, systemInfoSIM.msin).shouldBeString();
				valueOf(testRun, systemInfoSIM.spn).shouldBeString();
				valueOf(testRun, systemInfoSIM.mcc).shouldBeNumber();
				valueOf(testRun, systemInfoSIM.mnc).shouldBeNumber();
			}

			finish(testRun);
		}

		function onErrorCallback(error) {
			Ti.API.info('An error occurred on SIM property:' + error.message);
			valueOf(testRun, error).shouldBe('[object TizenWebAPIError]');
			finish(testRun);
		}

		valueOf(testRun, Tizen.SystemInfo.getPropertyValue).shouldBeFunction();
		Tizen.SystemInfo.getPropertyValue(Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_SIM, onSuccessCallback, onErrorCallback);
	}

	this.testListenersCpu = function(testRun) {
		checkCallbackMethod( {propertyName: Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_CPU, testRun: testRun, optionsParameter:{}} );
	}

	this.testListenersStorage = function(testRun) {
		checkCallbackMethod( {propertyName: Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_STORAGE, testRun: testRun, optionsParameter:{}} );
	}

	this.testListenersWifiNetwork = function(testRun) {
		checkCallbackMethod( {propertyName: Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_WIFI_NETWORK, testRun: testRun, optionsParameter:{} });
	}

	this.testListenersCellularNetwork = function(testRun) {
		checkCallbackMethod( {propertyName: Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_CELLULAR_NETWORK, testRun: testRun, optionsParameter:{} });
	}

	this.testListenersEthernetNetwork = function(testRun) {
		checkCallbackMethod( {propertyName: 'EthernetNetwork', testRun: testRun, optionsParameter:{} });
	}

	this.testListenersSIM = function(testRun) {
		checkCallbackMethod( {propertyName: Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_SIM, testRun: testRun, optionsParameter:{} });
	}

	// helper that allows to test addPropertyValueChangeListener, removePropertyValueChangeListener, SystemInfoOptions
	// will be completed in 2 sec in any case.
	function checkCallbackMethodFunction (data) {
		Ti.API.debug('Running listener check for: ' + (data?data.propertyName:'[Wrong parameter!]'));
		var id,
			testRun = data.testRun,
			waitTimeout;

		// removes current listener. Must be completed to accept valid test.
		function removeListener() {
			valueOf(testRun, id).shouldNotBeNull();
			Ti.API.debug('removing listener with ID: ' + id);
			if (id != null) {
				try{
					valueOf(testRun, Tizen.SystemInfo.removePropertyValueChangeListener).shouldBeFunction();
					Tizen.SystemInfo.removePropertyValueChangeListener(id);
				} catch(e) {
					reportError(testRun, JSON.stringify(e));
				}
			}
		}

		// If can accept test as on success callback as without it
		function onSuccessCallback(dataObject) {
			Ti.API.debug('Test completed by success callback with parameter: ' + JSON.stringify(dataObject|''));
			valueOf(testRun, dataObject).shouldBe('[object TizenSystemInfoSystemInfoProperty]');
			clearFakeTimeout();  // cancel fake timer call

			valueOf(testRun, dataObject).shouldNotBeNull();
			removeListener();
			finish(testRun);
		}

		// If called with not null - test failed!
		function onErrorCallback(error) {
			Ti.API.info('Test completed by error callback - ' + JSON.stringify(error));
			valueOf(testRun, error).shouldBe('[object TizenWebAPIError]');
			clearFakeTimeout(); // cancel fake timer call
			reportError(testRun, JSON.stringify(error));
		}

		//clears timeout if it was set before.
		function clearFakeTimeout() {
			if (waitTimeout) {
				// cancel fake call if any
				clearTimeout(waitTimeout); 
			}
		}

		// we don't need to wait for real callbacks from device,
		// as generally we are testing that we can subscribe and unsubscribe
		waitTimeout=setTimeout(function() {
			Ti.API.debug('Test completed by timeout!');
			removeListener();
			finish(testRun);
		}, 2000);

		try {
			// According to documentation:
			// 'Tizen Web App Programming' => 'Programming Guide' => 'Device' => 'Obtain Details on Basic Supported Properties'
			// devices MAY not support all properties. Some properties vary from device to device
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

/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

Ti.platformProxy = window.TitaniumPlatform;

Ti.Platform = {
	/**
	 * @tiapi(method=True,name=Platform.createUUID,since=0.4)
	 */
	createUUID : function(){
		return Ti.platformProxy.createUUID();
	},
	/**
	 * @tiapi(method=True,name=Platform.openApplication,since=0.4) Launch an Android application
	 * @tiapi use the helper method logInstalledApplicationNames to discover applications.
	 * @tiarg[string,app] Android application name.
	 * @tiresult[bool] true if application was launched.
	 */
	openApplication : function(app) {
		return Ti.platformProxy.openApplication(app);
	},
	/**
	 * @tiapi(method=True,name=Platform.openURL,since=0.4) Launch the system browser
	 * @tiarg[string,url] url to open
	 * @tiresult[bool] true if browser was launched
	 */
	openURL : function(url) {
		return Ti.platformProxy.openUrl(url);
	},

	/**
	 * @tiapi(method=True,name=Platform.logInstalledApplicationNames,since=0.4)
	 * @tiapi a developer helper method to see installed applications. This api
	 * @tiapi will most likely be replaced in the future. It should not be used
	 * @tiapi in production.
	 */
	logInstalledApplicationNames : function() {
		Ti.platformProxy.logInstalledApplicationNames();
	}
};
/**
 * @tiapi(method=False,property=True,name=Platform.ostype,since=0.4) OS type [read-only]
 * @tireturn[string] currently returns 32bit for Android
 */
Ti.Platform.__defineGetter__("ostype", function(){
	return Ti.platformProxy.getOsType();
});
/**
 * @tiapi(method=False,property=True,name=Platform.name,since=0.4) Platform name [read-only]
 * @tireturn[string] 'android'
 */
Ti.Platform.__defineGetter__("name", function(){
	return Ti.platformProxy.getModuleName();
});
/**
 * @tiapi(method=False,property=True,name=Platform.version,since=0.4) Platform version information [read-only]
 * @tireturn[string] Platform version string.
 */
Ti.Platform.__defineGetter__("version", function(){
	return Ti.platformProxy.getVersion();
});
/**
 * @tiapi(method=False,property=True,name=Platform.architecture,since=0.4) CPU description [read-only]
 * @tireturn[string] description
 */
Ti.Platform.__defineGetter__("architecture", function(){
	return Ti.platformProxy.getArchitecture();
});
/**
 * @tiapi(method=False,property=True,name=Platform.address,since=0.4) IP address if any. [read-only]
 * @tireturn[string] IP address in string form.
 */
Ti.Platform.__defineGetter__("address", function(){
	return Ti.platformProxy.getAddress();
});
/**
 * @tiapi(method=False,property=True,name=Platform.id,since=0.4) Device identifier [read-only]
 * @tireturn[string] device id if present, otherwise a generated ID persisted on first invocation
 */
Ti.Platform.__defineGetter__("id", function(){
	return Ti.platformProxy.getId();
});
/**
 * @tiapi(method=False,property=True,name=Platform.model,since=0.4) Model identifier of the device [read-only]
 * @tireturn[string] device model
 */
Ti.Platform.__defineGetter__("model", function() {
	return Ti.platformProxy.getModel();
});
/**
 * @tiapi(method=False,property=True,name=Platform.macaddress,since=0.4) MAC address if any. [read-only]
 * @tireturn[string] MAC address
 */
Ti.Platform.__defineGetter__("macddress", function(){
	return Ti.platformProxy.getMacAddress();
});
/**
 * @tiapi(method=False,property=True,name=Platform.processorCount,since=0.4) Number of processors as reported by device. [read-only]
 * @tireturn[int] processor count.
 */
Ti.Platform.__defineGetter__("processorCount", function(){
	return Ti.platformProxy.getProcessorCount();
});
/**
 * @tiapi(method=False,property=True,name=Platform.username,since=0.4) Name of user. [read-only]
 * @tireturn[string] On Android return Build.USER
 */
Ti.Platform.__defineGetter__("username", function(){
	return Ti.platformProxy.getUsername();
});
/**
 * @tiapi(method=False,property=True,name=Platform.availableMemory,since=0.4) Available memory as reported by the VM. [read-only]
 * @tireturn[double] available memory.
 */
Ti.Platform.__defineGetter__("availableMemory", function(){
	return Ti.platformProxy.getAvailableMemory();
});

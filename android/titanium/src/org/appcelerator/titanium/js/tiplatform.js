Titanium.platformProxy = window.TitaniumPlatform;

Titanium.Platform = {
	/**
	 * @tiapi(method=True,name=Platform.createUUID,since=0.4)
	 */
	createUUID : function(){
		return Titanium.platformProxy.createUUID();
	},
	/**
	 * @tiapi(method=True,name=Platform.openApplication,since=0.4) Launch an Android application
	 * @tiapi use the helper method logInstalledApplicationNames to discover applications.
	 * @tiarg[string,app] Android application name.
	 * @tiresult[bool] true if application was launched.
	 */
	openApplication : function(app) {
		return Titanium.platformProxy.openApplication(app);
	},
	/**
	 * @tiapi(method=True,name=Platform.openURL,since=0.4) Launch the system browser
	 * @tiarg[string,url] url to open
	 * @tiresult[bool] true if browser was launched
	 */
	openURL : function(url) {
		return Titanium.platformProxy.openUrl(url);
	},

	/**
	 * @tiapi(method=True,name=Platform.logInstalledApplicationNames,since=0.4)
	 * @tiapi a developer helper method to see installed applications. This api
	 * @tiapi will most likely be replaced in the future. It should not be used
	 * @tiapi in production.
	 */
	logInstalledApplicationNames : function() {
		Titanium.platformProxy.logInstalledApplicationNames();
	}
};
/**
 * @tiapi(method=False,property=True,name=Platform.ostype,since=0.4) OS type [read-only]
 * @tireturn[string] currently returns 32bit for Android
 */
Titanium.Platform.__defineGetter__("ostype", function(){
	return Titanium.platformProxy.getOsType();
});
/**
 * @tiapi(method=False,property=True,name=Platform.name,since=0.4) Platform name [read-only]
 * @tireturn[string] 'android'
 */
Titanium.Platform.__defineGetter__("name", function(){
	return Titanium.platformProxy.getModuleName();
});
/**
 * @tiapi(method=False,property=True,name=Platform.version,since=0.4) Platform version information [read-only]
 * @tireturn[string] Platform version string.
 */
Titanium.Platform.__defineGetter__("version", function(){
	return Titanium.platformProxy.getVersion();
});
/**
 * @tiapi(method=False,property=True,name=Platform.architecture,since=0.4) CPU description [read-only]
 * @tireturn[string] description
 */
Titanium.Platform.__defineGetter__("architecture", function(){
	return Titanium.platformProxy.getArchitecture();
});
/**
 * @tiapi(method=False,property=True,name=Platform.address,since=0.4) IP address if any. [read-only]
 * @tireturn[string] IP address in string form.
 */
Titanium.Platform.__defineGetter__("address", function(){
	return Titanium.platformProxy.getAddress();
});
/**
 * @tiapi(method=False,property=True,name=Platform.id,since=0.4) Device identifier [read-only]
 * @tireturn[string] device id if present, otherwise a generated ID persisted on first invocation
 */
Titanium.Platform.__defineGetter__("id", function(){
	return Titanium.platformProxy.getId();
});
/**
 * @tiapi(method=False,property=True,name=Platform.model,since=0.4) Model identifier of the device [read-only]
 * @tireturn[string] device model
 */
Titanium.Platform.__defineGetter__("model", function() {
	return Titanium.platformProxy.getModel();
});
/**
 * @tiapi(method=False,property=True,name=Platform.macaddress,since=0.4) MAC address if any. [read-only]
 * @tireturn[string] MAC address
 */
Titanium.Platform.__defineGetter__("macddress", function(){
	return Titanium.platformProxy.getMacAddress();
});
/**
 * @tiapi(method=False,property=True,name=Platform.processorCount,since=0.4) Number of processors as reported by device. [read-only]
 * @tireturn[int] processor count.
 */
Titanium.Platform.__defineGetter__("processorCount", function(){
	return Titanium.platformProxy.getProcessorCount();
});
/**
 * @tiapi(method=False,property=True,name=Platform.username,since=0.4) Name of user. [read-only]
 * @tireturn[string] On Android return Build.USER
 */
Titanium.Platform.__defineGetter__("username", function(){
	return Titanium.platformProxy.getUsername();
});
/**
 * @tiapi(method=False,property=True,name=Platform.availableMemory,since=0.4) Available memory as reported by the VM. [read-only]
 * @tireturn[double] available memory.
 */
Titanium.Platform.__defineGetter__("availableMemory", function(){
	return Titanium.platformProxy.getAvailableMemory();
});
/**
 * @tiapi(method=False,property=True,name=Platform.phoneNumber,since=0.4) Phone number if available. [read-only]
 * @tireturn[string] phone number.
 */
Titanium.Platform.__defineGetter__("phoneNumber", function(){
	return Titanium.platformProxy.getPhoneNumber();
});

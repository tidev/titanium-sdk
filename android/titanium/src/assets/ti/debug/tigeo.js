/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

Ti.geoProxy = window.TitaniumGeolocation;

Ti.Geolocation = {
	UNKNOWN_ERROR : 0,
	PERMISSION_DENIED : 1,
	POSITION_UNAVAILABLE : 2,
	TIMEOUT : 3,
	/**
	 * @tiapi(method=True,name=Geolocation.getCurrentPosition,since=0.4) Query the device for the last known position.
	 * @tiapi On Android, this method does not cause the radio to start.
	 * @tiarg[function,success] Function to be invoked with a position object if the operation is successful.
	 * @tiarg[function,failure] Function to be invoked if a failure occurs while retrieving the last position.
	 * @tiarg[object,options] An object that contains options to used by the method.
	 */
	getCurrentPosition : function(success, failure, options) {
		var o = transformObjectValue(options, {});
		var json = Ti.JSON.stringify(o);

		Ti.geoProxy.getCurrentPosition(
				registerOneShot(this, success),
				registerOneShot(this, failure),
				json);
	},
	/**
	 * @tiapi(method=True,name=Geolocation.watchPosition,since=0.4) Register to receive geolocation updates.
	 * @tiarg[function,success] Function to be invoked with a position object if the operation is successful.
	 * @tiarg[function,failure] Function to be invoked if a failure occurs while retrieving the last position.
	 * @tiarg[object,options] An object that contains options to used by the method.
	 * @tiresult[int] id to pass to clearWatch to stop un-register.
	 */
	watchPosition : function(success, failure, options) {
		var o = transformObjectValue(options, {});
		var json = Ti.JSON.stringify(o);

		return Ti.geoProxy.watchPosition(
			registerCallback(this, success),
			registerCallback(this, failure),
			json);
	},
	/**
	 * @tiapi(method=True,name=Geolocation.clearWatch,since=0.4) Stop watching geolocation events.
	 * @tiarg[int,watchId] The value returned from watchPosition.
	 */
	clearWatch : function(watchId) {
		Ti.geoProxy.clearWatch(watchId);
	}
};

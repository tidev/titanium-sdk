/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

Ti.accelerometerProxy = window.TitaniumAccelerometer;

Ti.Accelerometer = {
	/**
	 * @tiapi(method=True,name=Accelerometer.addEventListener,since=0.4)
	 * @tiapi Listen for events from the accelerometer.
	 * @tiarg[string,eventName] The name of the event. This API supports 'update' events.
	 * @tiarg[function,listener] Function that receives an event object on each update.
	 * @tiresult[int] id to pass to removeEventListener to cancel the event.
	 */
	addEventListener : function(eventName, listener) {
		return Ti.accelerometerProxy.addEventListener(eventName, registerCallback(this, listener));
	},
	/**
	 * @tiapi(method=True,name=Accelerometer.removeEventListener,since=0.4)
	 * @tiapi Remove a listener previously set with addEventListener.
	 * @tiarg[string,eventName] Name of the event used to register in addEventListener.
	 * @tiarg[int,listenerId] Value returned from addEventListener.
	 */
	removeEventListener : function(eventName, listenerId) {
		Ti.accelerometerProxy.removeEventListener(eventName, listenerId);
	}
};

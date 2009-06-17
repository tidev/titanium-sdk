/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

Titanium.gestureProxy = window.TitaniumGesture;

Titanium.Gesture = {
	/**
	 * @tiapi(property=True,name=Gesture.PORTRAIT,since=0.4,type=int) Portrait orientation
	 */
	PORTRAIT : 0x02,
	/**
	 * @tiapi(property=True,name=Gesture.UPSIDE_PORTRAIT,since=0.4,type=int) Not reported on Android. Device rotated 180 degrees from portrait.
	 */
	UPSIDE_PORTRAIT : 0x04,
	/**
	 * @tiapi(property=True,name=Gesture.LANDSCAPE,since=0.4,type=int) Device is rotated 90 degrees to the left of portrait.
	 */
	LANDSCAPE : 0x10,
	/**
	 * @tiapi(property=True,name=Gesture.LANDSCAPE_LEFT,since=0.4,type=int) Device is rotated 90 degrees to the left of portrait. Same as LANDSCAPE
	 */
	LANDSCAPE_LEFT : 0x10,
	/**
	 * @tiapi(property=True,name=Gesture.LANDSCAPE_RIGHT,since=0.4,type=int) Device is rotated 90 degrees to the right of portrait. Not reported on Android.
	 */
	LANDSCAPE_RIGHT : 0x8,

	/**
	 * @tiapi(method=True,name=Gesture.isPortrait,since=0.4) Helper method to determine if device is in any portrait position.
	 * @tiarg[int,orientation] Obtained via the 'orientationchange' event's 'to' or 'from' property.
	 */
	isPortrait : function(orientation) {
		return (orientation & 0x06) != 0; // orientation & (PORTRAIT | UPSIDE_PORTRAIT)
	},
	/**
	 * @tiapi(method=True,name=Gesture.isPortrait,since=0.4) Helper method to determine if device is in any landscape position.
	 * @tiarg[int,orientation] Obtained via the 'orientationchange' event's 'to' or 'from' property.
	 */
	isLandscape : function(orientation) {
		return (orientation & 0x18) != 0; // orientation & ((LANDSCAPE | LANDSCAPE_LEFT) | LANDSCAPE_RIGHT)
	},
	/**
	 * @tiapi(method=True,name=Gesture.addEventListener,since=0.4) Listen for Gesture events.
	 * @tiapi currently supported events are 'orientationchange' and 'shake'
	 * @tiarg[string,eventName] A supported gesture  event name.
	 * @tiarg[function, listener] Function to pass events gesture events to.
	 * @tiresult[int] id to pass to removeEventListener to stop receiving events. Id is only valid for use with the event name that was used to register the listener.
	 */
	addEventListener : function(eventName, listener) {
		return Titanium.gestureProxy.addEventListener(eventName, registerCallback(this, listener));
	},
	/**
	 * @tiapi(method=True,name=Gesture.removeEventListener,since=0.4) Remove gesture event listener.
	 * @tiarg[string,eventName] Event name used to register event.
	 * @tiarg[int,listenerId] Id returned from addEventListener. Ids are only valid for the eventName passed in addEventListener.
	 */
	removeEventListener : function(eventName, listenerId) {
		Titanium.gestureProxy.removeEventListener(eventName, listenerId);
	}
};

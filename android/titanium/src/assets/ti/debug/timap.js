/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
// requires Ti, UI, Geolocation

Ti.Map = {
	MAP_VIEW_STANDARD : 1,
	MAP_VIEW_SATELLITE : 2,
	MAP_VIEW_HYBRID : 1, /* standard is basically hybrid */

	ANNOTATION_RED : 1,
	ANNOTATION_GREEN : 2,
	ANNOTATION_PURPLE : 3
};

Ti.Map.MapView = function(proxy)
{
	this._proxy = proxy;

	this.getKey = function() {
		return Ti.Method.dispatch(this._proxy, "getKey");
	};

	this.processOptions = function(options) {
		// Stringify until other views are moved to dispatch
		Ti.Method.dispatch(this._proxy, "processOptions", Ti.JSON.stringify(options));
	};

	this.setLocation = function(region) {
		Ti.Method.dispatch(this._proxy, "setLocation", region);
	};

	this.setMapType = function(type) {
		Ti.Method.dispatch(this._proxy, "setMapType", type);
	};

	this.setZoomEnabled = function(enabled) {
		Ti.Method.dipatch(this._proxy,"setZoomEnabled", enabled);
	};

	this.setScrollEnabled = function(enabled) {
		Ti.Method.dipatch(this._proxy,"setScrollEnabled", enabled);
	};

	this.addEventListener = function(event, listener) {
		return Ti.Method.dispatch(this._proxy, "addEventListener", event, registerCallback(this, listener));
	};

	this.removeEventListener = function(event, listenerId) {
		Ti.Method.dispatch(this._proxy, "removeEventListener", event, listenerId);
	};
};

Ti.Map.createView = function(options) {
	if (Ti.isUndefined(options)) {
		options = {};
	}

	var mv = new Ti.Map.MapView(Ti.Method.dispatch("TitaniumMap","createMapView"));
	mv.processOptions(options);
	return mv;
};

Ti.Geolocation.reverseGeocoder = function(coordinate, location) {
	return Ti.Method.dispatch("TitaniumMap", "reverseGeocoder", coordinate, registerOneShot(this, location));
};


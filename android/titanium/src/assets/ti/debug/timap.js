/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
// requires Ti, UI, Geolocation

Ti.UI.MAP_VIEW_STANDARD = 1;
Ti.UI.MAP_VIEW_SATELLITE = 2;
Ti.UI.MAP_VIEW_HYBRID = 3;

Ti.UI.MapView = function(proxy)
{
	this._proxy = proxy;

	this.getKey = function() {
		return Ti.Method.dispatch(this._proxy, "getKey");
	};

	this.processOptions = function(options) {
		// Stringify until other views are moved to dispatch
		Ti.Method.dispatch(this._proxy, "processOptions", Ti.JSON.stringify(options));
	};

	this.setCenterCoordinate = function(coordinate) {
		Ti.Method.dispatch(this._proxy, "setCenterCoordinate", coordinate);
	};

	this.setRegion = function(region) {
		Ti.Method.dispatch(this._proxy, "setRegion", region);
	};

	this.setType = function(type) {
		Ti.Method.dispatch(this._proxy, "setType", type);
	};

	this.setZoomEnabled = function(enabled) {
		Ti.Method.dipatch(this._proxy,"setZoomEnabled", enabled);
	};

	this.setScrollEnabled = function(enabled) {
		Ti.Method.dipatch(this._proxy,"setScrollEnabled", enabled);
	};
};

Ti.UI.createMapView = function(options) {
	if (Ti.isUndefined(options)) {
		options = {};
	}

	var mv = new Ti.UI.MapView(Ti.Method.dispatch("TitaniumMap","createMapView"));
	mv.processOptions(options);
	return mv;
};

Ti.Geolocation.reverseGeocoder = function(coordinate, location) {
	return Ti.Method.dispatch("TitaniumMap", "reverseGeocoder", coordinate, registerOneShot(this, location));
};


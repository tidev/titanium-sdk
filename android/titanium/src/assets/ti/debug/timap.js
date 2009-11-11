/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
// requires Ti, UI, Geolocation

Ti.UI.MAP_VIEW_STANDARD = 0;
Ti.UI.MAP_VIEW_SATELLITE = 1;
Ti.UI.MAP_VIEW_HYBRID = 2;

Ti.UI.MapView =
{
	_module : "TitaniumMap",

	setCenterCoordinate : function(coordinate) {
		Ti.Method.dispatch(this._module, "setCenterCoordinate", coordinate);
	},

	setRegion : function(region) {
		Ti.Method.dispatch(this._module, "setRegion", region);
	},

	setType : function(type) {
		Ti.Method.dispatch(this._module, "setType", type);
	},

	setZoomEnabled : function(enabled) {
		Ti.Method.dipatch(this._module,"setZoomEnabled", enabled);
	},

	setScrollEnabled : function(enabled) {
		Ti.Method.dipatch(this._module,"setScrollEnabled", enabled);
	}
};

Ti.UI.createMapView = function(options) {
	if (Ti.isUndefined(options)) {
		options = {};
	}

};

Ti.Geolocation.reverseGeocoder = function(coordinate, location) {
	return Ti.Method.dispatch("TitaniumMap", "reverseGeocoder", coordinate, registerOneShot(this, location));
};


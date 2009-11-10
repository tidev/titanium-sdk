/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

Ti.UI.MAP_VIEW_STANDARD = 0;
Ti.UI.MAP_VIEW_SATELLITE = 1;
Ti.UI.MAP_VIEW_HYBRID = 2;

Ti.UI.MapView =
{
	_module : "TitaniumMap",

	setCenterCoordinate : function(coordinate) {

	},

	setRegion : function(region) {

	},

	setType : function(type) {

	},

	setZoomEnabled : function(enabled) {

	},

	setScrollEnabled : function(enabled) {

	}
};

Ti.UI.prototype.createMapView = function(options) {
	if (Ti.isUndefined(options)) {
		options = {};
	}

};

Ti.Geolocation.prototype.reverseGeocoder = function(coordinate, location) {

};


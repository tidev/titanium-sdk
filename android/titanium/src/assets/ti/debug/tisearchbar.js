/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
// requires Ti, UI

Ti.UI.SearchBar = function(proxy)
{
	this._proxy = proxy;

	this.setValue = function(value) {
		Ti.Method.dispatch(this._proxy, "setValue", value);
	}

	this.getValue = function() {
		return Ti.Method.dispatch(this._proxy, "getValue");
	}

	this.addEventListener = function(event, listener) {
		return Ti.Method.dispatch(this._proxy, "addEventListener", event, registerCallback(this, listener));
	};

	this.removeEventListener = function(event, listenerId) {
		Ti.Method.dispatch(this._proxy, "removeEventListener", event, listenerId);
	};
};

Ti.UI.createSearchBar = function(options) {
	if (Ti.isUndefined(options)) {
		options = {};
	}

	var sbar = new Ti.UI.SearchBar(Ti.Method.dispatch("TitaniumSearchBarModule","createSearchBar"));
	Ti.Method.dispatch(sbar._proxy, "setControlOptions", options);
	Ti.Method.dispatch(sbar._proxy, "open");
	return sbar;
};

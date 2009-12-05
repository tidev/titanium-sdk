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

	/**
	 * @tiapi(method=true,name=UI.SearchBar.focus,since=0.8) Bring focus to a control. Does not auto display soft-keyboard
	 */
	this.focus = function() {
		Ti.Method.dispatch(this._proxy, "focus");
	};
	/**
	 * @tiapi(method=true,name=UI.SearchBar.blur,since=0.8) Closed soft keyboard if it's display. Android doesn't seem to actually clear focus for Text controls.
	 */
	this.blur = function() {
		Ti.Method.dispatch(this._proxy, "blur");
	};

	this.addEventListener = function(event, listener) {
		return Ti.Method.dispatch(this._proxy, "addEventListener", event, registerCallback(this, listener));
	};

	this.removeEventListener = function(event, listenerId) {
		Ti.Method.dispatch(this._proxy, "removeEventListener", event, listenerId);
	};
};

Ti.UI.SearchBar.prototype.__defineGetter__("value", function() { return this.getValue(); });

Ti.UI.createSearchBar = function(options) {
	if (Ti.isUndefined(options)) {
		options = {};
	}

	var sbar = new Ti.UI.SearchBar(Ti.Method.dispatch("TitaniumSearchBarModule","createSearchBar"));
	Ti.Method.dispatch(sbar._proxy, "setControlOptions", options);
	Ti.Method.dispatch(sbar._proxy, "open");
	return sbar;
};

/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

exports.bootstrap = function(Titanium) {
	var Tab = Titanium.UI.Tab;

	function createTab(scopeVars, options) {
		var tab = new Tab(options);
		if (options) {
			this._window = options.window;
		}
		return tab;
  }

	Titanium.UI.createTab = createTab;

	var tabOpen = Tab.prototype.open;
	Tab.prototype.open = function(window, options) {
		if (!window) {
			return;
		}

		if (!options) {
			options = {};
		}

		this.setWindow(window);
		options.tabOpen = true;

		window.open(options);
	}

	Tab.prototype.close = function(options) {
		var window = this.getWindow();
		if (window) {
			window.close(options);
			this.setWindow(null);
		}
	}

	var _setWindow = Tab.prototype.setWindow;
	Tab.prototype.setWindow = function(window) {
		this._window = window;
		_setWindow.call(this, window);
	}

	Tab.prototype.getWindow = function() {
		return this._window;
	}

	Object.defineProperty(Tab.prototype, 'window', {
		enumerable: true,
		set: Tab.prototype.setWindow,
		get: Tab.prototype.getWindow
	});
}


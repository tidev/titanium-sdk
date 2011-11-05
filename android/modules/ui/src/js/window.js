/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var EventEmitter = require("events").EventEmitter,
	assets = kroll.binding("assets"),
	vm = require("vm");
var TAG = "Window";

exports.bootstrapWindow = function(Titanium) {
	var newActivityRequiredKeys = ["fullscreen", "navBarHidden", "modal", "windowSoftInputMode"];

	// Backward compatibility for lightweight windows
	var UI = Titanium.UI;
	var Window = Titanium.TiBaseWindow;
	var ActivityWindow = UI.ActivityWindow;
	var Proxy = Titanium.Proxy;

	Window.prototype.getActivityDecorView = function() {
		var topActivity = Ti.App.Android.getTopActivity();
		if (topActivity) {
			return topActivity.getDecorView();
		}

		//kroll.log(TAG, "unable to find valid activity for decor view");
		return null;
	}

	Window.prototype._cacheSetProperty = function(setter, value) {
		var cache = this.propertyCache;

		if (!cache) {
			cache = this.propertyCache = {};
		}

		cache[setter] = value;
	}

	function definePropsAndMethods(getter, setter)
	{
		var descriptor = {enumerable: true};
		var getterMethod, setterMethod;

		if (getter) {
			getterMethod = ActivityWindow.prototype[getter];
			function get() {
				var window = this.window;
				if (!window) {
					// If this window isn't open yet, first try
					// getting the property from the cache. It may have
					// been set before this call.
					var cache = this.propertyCache;
					if (setterMethod && cache && setterMethod in cache) {
						return cache[setterMethod];
					} else {
						// If property isn't in the cache, fall back to
						// getting it off the root window.
						window = getActivityDecorView();
					}
				}
				return getterMethod.call(window);
			}
			descriptor.get = Window.prototype[getter] = get;
		}

		if (setter) {
			setterMethod = ActivityWindow.prototype[setter];
			function set(value) {
				var window = this.window;
				if (!window) {
					// Save value to a cache so it can later to set
					// on the window once it has opened.
					this._cacheSetProperty(setterMethod, value);
				} else {
					setterMethod.call(window, value);
				}
			}
			descriptor.set = Window.prototype[setter] = set;
		}
		return descriptor;
	}

	Object.defineProperties(Window.prototype, {
		orientationModes: definePropsAndMethods("getOrientationModes", "setOrientationModes"),
		activity: definePropsAndMethods("getActivity"),
		orientation: definePropsAndMethods("getOrientation"),
		windowPixelFormat: definePropsAndMethods("getWindowPixelFormat", "setWindowPixelFormat")
	});

	Window.prototype.addChildren = function() {
		if (this._children) {
			var length = this._children.length;

			for (var i = 0; i < length; i++) {
				this.view.add(this._children[i]);
			}

			delete this._children;
		}
	}

	Window.prototype.open = function(options) {
		if (!options) {
			options = {};
		} else {
			this._properties.extend(options);
		}

		// Determine if we should create a heavy or light weight window.
		this.isActivity = false;
		newActivityRequiredKeys.forEach(function(key) {
			if (key in this._properties) {
				this.isActivity = true;
			}
		}, this);

		if (!this.isActivity && "tabOpen" in this._properties && options.tabOpen) {
			this.isActivity = true;
		}

		var needsOpen = false;

		if (this.isActivity) {
			this.window = new ActivityWindow(this._properties);
			this.view = this.window;
			needsOpen = true;

		} else {
			this.window = this.getActivityDecorView();
			this.view = new UI.View(this._properties);
			this.view.zIndex = Math.MAX_INT - 2;
			this.window.add(this.view);
		}

		this.setWindowView(this.view);
		this.addChildren();

		if (needsOpen) {
			var self = this;
			this.window.on("open", function () {
				self.postOpen();
			});

			this.window.open();

		} else {
			this.postOpen();
		}
	}

	Window.prototype.setWindow = function(existingWindow) {
		this.window = existingWindow;
		this.view = this.window;
		this.setWindowView(this.view);

		this.addChildren();

		var self = this;
		this.window.on("open", function () {
			self.postOpen();
		});
	}

	Window.prototype.postOpen = function() {
		// Set any cached properties.
		if (this.propertyCache) {
			for (setter in this.propertyCache) {
				setter.call(this.window, this.propertyCache[setter]);
			}
		}

		if ("url" in this) {
			this.loadUrl();
		}
		this.fireEvent("open");
	}

	Window.prototype.close = function(options) {
		if (this.window == null) {
			return;
		}
		this._properties.extend(options);

		if (this.isActivity) {
			var self = this;
			this.window.on("close", function () {
				self.fireEvent("close");
			});
			this.window.close(options);

		} else {
			if (this.view.parent != null) {
				this.window.remove(this.view);
				this.window = null;
			}

			this.fireEvent("close");
		}
	}

	Window.prototype.add = function(view) {
		if (this.view) {
			this.view.add(view);

		} else {
			var children = this._children;
			if (!children) {
				children = this._children = [];
			}

			children.push(view);
		}
	}

	Window.prototype.animate = function(options, callback) {
		if (this.view) {
			if (callback) {
				this.view.animate(options, callback);

			} else {
				this.view.animate(options);
			}

		} else {
			kroll.log(TAG, "unable to call animate, view is undefined");
		}
	}

	Window.prototype.loadUrl = function() {
		if (this.url == null) {
			return;
		}

		Ti.include(this.url, [this._sourceUrl, {
			currentWindow: this,
			currentActivity: this.window.activity,
			currentTab: this.tab,
			currentTabGroup: this.tabGroup
		}]);
	}

	Window.prototype.addEventListener = function(event, listener) {
		if (["open", "close"].indexOf(event) >= 0 || this.window == null) {
			EventEmitter.prototype.addEventListener.call(this, event, listener);

		} else {
			this.window.addEventListener(event, listener);
		}
	}

	Window.prototype.removeEventListener = function(event, listener) {
		if (["open", "close"].indexOf(event) >= 0 || this.window == null) {
			EventEmitter.prototype.removeEventListener.call(this, event, listener);

		} else {
			this.window.removeEventListener(event, listener);
		}
	}

	Window.prototype.fireEvent = function(event, data) {
		if (["open", "close"].indexOf(event) >= 0 || this.window == null) {
			EventEmitter.prototype.fireEvent.call(this, event, data);

		} else {
			this.window.fireEvent(event, data);
		}
	}

	Window.prototype.setPropertyAndFire = function(property, value) {
		if (!this.view) {
			Proxy.prototype.setPropertyAndFire.call(this, property, value);

		} else {
			this.view.setPropertyAndFire(property, value);
		}
	}

	Window.createWindow = function(scopeVars, options) {
		var window = new Window(options);
		window._sourceUrl = scopeVars.sourceUrl;
		window._currentActivity = scopeVars.currentActivity;

		return window;
	}

	return Window;
};


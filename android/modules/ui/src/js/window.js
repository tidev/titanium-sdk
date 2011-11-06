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

	// set constants for representing states for the window
	Window.prototype.stateClosed = 0;
	Window.prototype.stateOpening = 1;
	Window.prototype.stateOpened = 2;
	Window.prototype.stateClosing = 3;

	Window.prototype.getTopActivity = function() {
		var topActivity = Titanium.App.Android.getTopActivity();
		if (topActivity) {
			return topActivity;
		}

		kroll.log(TAG, "unable to find valid top activity");
		return null;
	}

	Window.prototype.getActivityDecorView = function() {
		var topActivity = this.getTopActivity();
		if (topActivity) {
			return topActivity.getDecorView();
		}

		kroll.log(TAG, "unable to find valid activity for decor view");
		return null;
	}

	Window.prototype._cacheSetProperty = function(setter, value) {
		var cache = this.propertyCache;

		if (!cache) {
			cache = this.propertyCache = {};
		}

		cache[setter] = value;
	}

	var wrappedPropsAndMethods = [
		{
			name: 'activity',
			getter: 'getActivity'
		},
		{
			name: 'orientation',
			getter: 'getOrientation'
		},
		{
			name: 'orientationModes',
			getter: 'getOrientationModes',
			setter: 'setOrientationModes'
		},
		{
			name: 'windowPixelFormat',
			getter: 'getWindowPixelFormat',
			setter: 'setWindowPixelFormat'
		}
	]

	function wrapPropsAndMethods(wrapperWindow) {
		wrappedPropsAndMethods.forEach(function(info) {
			var name = info.name,
			    descriptor = {};

			// Define getter and setter methods.
			if (info.getter) {
				function getProperty() {
					return this.window[name];
				}
				wrapperWindow[info.getter] = getProperty;
				descriptor.get = getProperty;
			}
			if (info.setter) {
				function setProperty(value) {
					this.window[name] = value;
				}
				wrapperWindow[info.setter] = setProperty;
				descriptor.set = setProperty;

				// Sync inner window with any property values set
				// on the wrapper before it was opened.
				wrapperWindow.window[name] = wrapperWindow[name];
			}

			// Re-define new property on wrapper which delegates
			// to the inner window proxy.
			delete wrapperWindow[name];
			Object.defineProperty(wrapperWindow, name, descriptor);
		});
	}

	Window.prototype.addChildren = function() {
		if (this._children) {
			var length = this._children.length;

			for (var i = 0; i < length; i++) {
				this.view.add(this._children[i]);
			}
		}

		// don't delete the children once finished in case the window
		// needs to be opened again
	}

	Window.prototype.removeChildren = function() {
		if (this._children) {
			var length = this._children.length;

			for (var i = 0; i < length; i++) {
				this.view.remove(this._children[i]);
			}
		}
	}

	Window.prototype.open = function(options) {
		// if the window is not closed, do not open
		if (this.currentState != this.stateClosed) {
			kroll.log(TAG, "unable to open, window is not closed");
			return;
		}
		this.currentState = this.stateOpening;

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

		// Expose the real window's properties by creating wrappers.
		wrapPropsAndMethods(this);

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
		this.currentState = this.stateOpening;

		this.window = existingWindow;
		this.view = this.window;
		this.setWindowView(this.view);

		wrappedPropsAndMethods(this);

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

		if ("url" in this._properties) {
			this.loadUrl();
		}

		this.currentState = this.stateOpened;
		this.fireEvent("open");
	}

	Window.prototype.close = function(options) {
		// if the window is not opened, do not close
		if (this.currentState != this.stateOpened) {
			kroll.log(TAG, "unable to close, window is not opened");
			return;
		}
		this.currentState = this.stateClosing;

		if (this.isActivity) {
			var self = this;
			this.window.on("close", function () {
				self.fireEvent("close");
			});

			this.window.close(options);
			this.currentState = this.stateClosed;

		} else {
			if (this.view.parent != null) {
				// make sure to remove the children otherwise when the window is opened a second time
				// the children views wont be added again to the native view
				this.removeChildren();

				this.window.remove(this.view);
				this.window = null;
			}

			this.currentState = this.stateClosed;
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

		Titanium.include(this.url, this._sourceUrl, {
			currentWindow: this,
			currentActivity: this.window.activity,
			currentTab: this.tab,
			currentTabGroup: this.tabGroup
		});
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

		// keeps track of the current window state
		window.currentState = window.stateClosed;

		window._sourceUrl = scopeVars.sourceUrl;
		window._currentActivity = scopeVars.currentActivity;

		return window;
	}

	return Window;
};


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
	var Proxy = Titanium.Proxy;

	function getOrientationModes() {
		/*return this.getProperty("orientationModes");*/
		return this.window.getOrientationModes();
	}
	Window.prototype.getOrientationModes = getOrientationModes;

	function setOrientationModes(modes) {
		/*this.setPropertyAndFire("orientationModes", modes);*/
		if (this.window == null) return;
 
		this.window.setOrientationModes(modes);
	}
	Window.prototype.setOrientationModes = setOrientationModes;

	function getActivity() {
		return this.window.getActivity();
	}
	Window.prototype.getActivity = getActivity;

	Object.defineProperties(Window.prototype, {
		orientationModes: {
			get: getOrientationModes,
			set: setOrientationModes,
			enumerable: true
		},
		activity: {
			get: getActivity,
			enumerable: true
		}
	});

	Window.prototype.open = function(options) {
		if (!options) {
			options = {};
		} else {
			this._properties.extend(options);
		}

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
			this.window = new UI.ActivityWindow(this._properties);
			UI.currentWindow = this.window;
			this.nativeView = this.window;
			this.attachListeners();

			// we needs the children man!
			if (this._children) {
				var length = this._children.length;
				for (var i = 0; i < length; i++) {
					this.window.add(this._children[i]);
				}
				delete this._children;
			}

			needsOpen = true;
		} else {
			if (!("currentWindow" in UI)) {
				this.window = new UI.ActivityWindow({
					useCurrentActivity: true
				});
				UI.currentWindow = this.window;
				needsOpen = true;
			}

			this.window = UI.currentWindow;
			this.view = new UI.View(this._properties);
			this.nativeView = this.view;

			if (this._children) {
				var length = this._children.length;
				for (var i = 0; i < length; i++) {
					this.view.add(this._children[i]);
				}
				delete this._children;
			}

			this.view.zIndex = Math.MAX_INT - 2;

			this.window.add(this.view);
		}

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

	Window.prototype.close = function(options) {
		if (this.window == null) {
			return;
		}
		this._properties.extend(options);

		if (this.isActivity) {
			var self = this;
			this.window.on("close", function () {
				self.emit("close");
			});
			this.window.close(options);
		} else {
			if (this.view.parent != null) {
				this.window.remove(this.view);
				this.window = null;
			}
			this.emit("close");
		}
	}

	Window.prototype.add = function(view) {
		if (!("_children" in this)) {
			this._children = [];
		}

		kroll.log(TAG, "adding view " + JSON.stringify(view._properties) + " to window");
		if (this.isActivity && this.window) {
			kroll.log(TAG, "adding to this.window");
			this.window.add(view);
		} else if (this.view) {
			kroll.log(TAG, "adding to this.view: " + view + ", " + JSON.stringify(view._properties));
			this.view.add(view);
		} else {
			this._children.push(view);
		}
	}

	Window.prototype.postOpen = function() {
		if ("url" in this) {
			this.loadUrl();
		}
		this.emit("open");
	}

	Window.prototype.loadUrl = function()
	{
		if (this.url == null) return;

		vm.runInThisContext(assets.readResource(this.url), this.url);
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
		if (!this.window && !this.view) {
			Proxy.prototype.setPropertyAndFire.call(this, property, value);
		}

		if (this.isActivity) {
			this.window.setPropertyAndFire(property, value);
		} else {
			this.view.setPropertyAndFire(property, value);
		}
	}

	Window.createWindow = function(options) {
		return new Window(options);
	}
	return Window;
};
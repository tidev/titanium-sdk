/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var EventEmitter = require("events").EventEmitter,
	assets = kroll.binding("assets"),
	vm = require("vm");

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

		if (this.isActivity) {
			this.window = new UI.ActivityWindow(this._properties);
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

			this.window.open();
		} else {
			var needsOpen = false;

			if (!("currentWindow" in UI)) {
				UI.currentWindow = new UI.ActivityWindow({
					useCurrentActivity: true
				});
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

			this.attachListeners();
			this.window.add(this.view);

			if (needsOpen) {
				this.window.open();
			}
		}
	}

	Window.prototype.close = function(options) {
		if (this.window == null) {
			return;
		}
		this._properties.extend(options);

		if (this.isActivity) {
			this.window.close(options);
		} else {
			if (this.view.parent != null) {
				this.window.remove(this.view);
				this.window = null;
			}
		}
	}

	Window.prototype.add = function(view) {
		if (!("_children" in this)) {
			this._children = [];
		}

		kroll.log("adding view " + JSON.stringify(view._properties) + " to window");
		if (this.isActivity && this.window) {
			kroll.log("adding to this.window");
			this.window.add(view);
		} else if (this.view) {
			kroll.log("adding to this.view: " + view + ", " + JSON.stringify(view._properties));
			this.view.add(view);
		} else {
			kroll.log("pushing into this._children");
			this._children.push(view);
		}
	}

	Window.prototype.attachListeners = function() {
		// map the right events to open/close
		var self = this;
		var openEvent = this.isActivity ? "open" : "added";
		var win = this.isActivity ? this.window : this.view;

		win.on(openEvent, function(e) {
			if ("url" in self) {
				self.loadUrl();
			}
			e.source = self;
			self.emit("open", e);
		});

		var closeEvent = this.isActivity ? "close" : "removed";
		win.on(closeEvent, function(e) {
			e.source = self;
			self.emit("close", e);
		});
	}

	Window.prototype.loadUrl = function()
	{
		if (this.url == null) return;

		vm.runInThisContext(assets.readResource(this.url), this.url);
	}

	Window.prototype.addEventListener = function(event, listener) {
		if (["open", "close"].indexOf(event) > 0 || this.window == null) {
			EventEmitter.prototype.addEventListener.call(this, event, listener);
		} else {
			this.window.addEventListener(event, listener);
		}
	}

	Window.prototype.removeEventListener = function(event, listener) {
		if (["open", "close"].indexOf(event) > 0 || this.window == null) {
			EventEmitter.prototype.removeEventListener.call(this, event, listener);
		} else {
			this.window.removeEventListener(event, listener);
		}
	}

	Window.prototype.fireEvent = function(event, data) {
		if (["open", "close"].indexOf(event) > 0 || this.window == null) {
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
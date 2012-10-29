/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var EventEmitter = require("events").EventEmitter,
	assets = kroll.binding("assets"),
	vm = require("vm"),
	url = require("url"),
	path = require('path'),
	Script = kroll.binding('evals').Script,
	bootstrap = require('bootstrap'),
	PersistentHandle = require('ui').PersistentHandle;

var TAG = "Window";

exports.bootstrapWindow = function(Titanium) {
	// flags to indicate if an activity should be created for the window
	var newActivityRequiredKeys = ["fullscreen", "navBarHidden", "modal", "windowSoftInputMode"];
	
	//list of TiBaseWindow event listeners
	var windowEventListeners = ["open", "close", "focus", "blur", "androidback"];

	// Backward compatibility for lightweight windows
	var UI = Titanium.UI;
	var Window = Titanium.TiBaseWindow;
	var ActivityWindow = UI.ActivityWindow;
	var Proxy = Titanium.Proxy;
	var TiWindow = Titanium.TiWindow;

	Window.prototype.isActivity = false;
	// set constants for representing states for the window
	Window.prototype.state = {closed: 0, opening: 1, opened: 2, closing: 3};

	// cached orientation modes for window that are not part of the normal properties map for the proxy
	Window.prototype.cachedOrientationModes = null;
	Window.prototype.cachedActivityProxy = null;

	// this is mainly used when we need to perform an operation on an activity and our
	// window does not have its own activity.  IE:  setting orientation on a window opened 
	// without having any of the newActivityRequiredKeys in it's construction arguments
	Window.prototype.getActivityDecorView = function() {
		var topActivity = Titanium.App.Android.getTopActivity();
		if (topActivity) {
			return topActivity.getDecorView();
		}
		
		if (kroll.DBG) {
			kroll.log(TAG, "Unable to find valid activity for decor view");
		}
		return null;
	}

	Window.prototype.setCachedProperty = function(name, value) {
		if (!(this.propertyCache)) {
			this.propertyCache = {};
		}

		this.propertyCache[name] = value;
	}

	Window.prototype.getCachedProperty = function(name) {
		if (!(this.propertyCache)) {
			this.propertyCache = {};
		}

		return this.propertyCache[name];
	}

	// set orientation access
	var orientationGetter = function() {
		if (this.window) {
			return this.window.getOrientation();

		}

		return this.getActivityDecorView().getOrientation();
	}
	Window.prototype.getOrientation = orientationGetter;
	Object.defineProperty(Window.prototype, "orientation", { get: orientationGetter});

	// set orientationModes access
	var orientationModesGetter = function() {
		if (this.window) {
			if (this.isActivity) {
				return this.window.getOrientationModes();

			} else {
				return this.getActivityDecorView().getOrientationModes();
			}
		}
		return this.cachedOrientationModes;
	}
	var orientationModesSetter = function(value) {
		if (value != null) {
			if (this.window) {
				if (this.isActivity) {
					this.window.setOrientationModes(value);

				} else {
					this.getActivityDecorView().setOrientationModes(value);
				}

			} else {
				this.cachedOrientationModes = value;
			}

		} else if (kroll.DBG) { 
			kroll.log(TAG, "Not allowed to set orientationModes to null");
		}
	}

	Window.prototype.getOrientationModes = orientationModesGetter;
	Window.prototype.setOrientationModes = orientationModesSetter;
	Object.defineProperty(Window.prototype, "orientationModes", { get: orientationModesGetter, set: orientationModesSetter});

	// activity getter (account for scenario when heavy weight window's activity is not created yet) 
	var activityProxyGetter = function () {
		if (this.currentState == this.state.opened) {
			return this.window._internalActivity;
		}

		if (this.cachedActivityProxy == null) {
			this.cachedActivityProxy = {};
		}

		return this.cachedActivityProxy;
	}

	Window.prototype.getActivity = activityProxyGetter;
	Object.defineProperty(Window.prototype, "activity", { get: activityProxyGetter });

	// set windowPixelFormat access
	var windowPixelFormatGetter = function() {
		if (this.isActivity) {
			if (this.window) {
				return this.window.getWindowPixelFormat();

			} else if (this.getCachedProperty("windowPixelFormat")) {
				return this.getCachedProperty("windowPixelFormat");
			}

			return Titanium.UI.Android.PIXEL_FORMAT_UNKNOWN;

		} else {
			if (this.getCachedProperty("windowPixelFormat")) {
				return this.getCachedProperty("windowPixelFormat");
			}
			return Titanium.UI.Android.PIXEL_FORMAT_UNKNOWN;
		}
	}
	var windowPixelFormatSetter = function(value) {
		if (this.isActivity) {
			if (this.window) {
				TiWindow.prototype.setWindowPixelFormat.call(this, value);

			} else {
				this.setCachedProperty("windowPixelFormat", value);
			}

		} else {
			this.setCachedProperty("windowPixelFormat", value);
		}
	}
	Window.prototype.getWindowPixelFormat = windowPixelFormatGetter;
	Window.prototype.setWindowPixelFormat = windowPixelFormatSetter;
	Object.defineProperty(Window.prototype, "windowPixelFormat", { get: windowPixelFormatGetter, set: windowPixelFormatSetter});
	
	var childrenGetter = function() {
		return this._children;
	}

	Window.prototype.getChildren = childrenGetter;

	Window.prototype.open = function(options) {
		var self = this;

		// if the window is not closed, do not open
		if (this.currentState != this.state.closed) {
			if (kroll.DBG) {
				kroll.log(TAG, "Unable to open, window is not closed");
				
			}
			return;
		}
		this.currentState = this.state.opening;

		// Retain the window until it has been closed.
		var handle = new PersistentHandle(this);
		this.on("close", function() {
			handle.dispose();
		});
		
		if (!options) {
			options = {};

		} else if (!(options instanceof UI.Animation)) {
			kroll.extend(this._properties, options);
		}

		// Determine if we should create a heavy or light weight window.
		newActivityRequiredKeys.forEach(function(key) {
			if (key in this._properties) {
				this.isActivity = true;
			}
		}, this);

		if (!this.isActivity && "tabOpen" in this._properties && options.tabOpen) {
			this.isActivity = true;
		}

		// Set any cached properties on the properties given to the "true" view
		if (this.propertyCache) {
			kroll.extend(this._properties, this.propertyCache);
		}

		var needsOpen = false;
		if (this.isActivity) {
			this.window = new ActivityWindow(this._properties);
			this.view = this.window;
			needsOpen = true;

		} else {
			this.window = this.getActivityDecorView();
			this.view = new UI.View(this._properties);
			
			// Add children before the view is added
			this.addChildren();
			
			this.window.add(this.view);
		}

		// handle orientation - don't put this in post open otherwise the orientation
		// will visibly change after the window opens
		if (this.cachedOrientationModes) {
			this.setOrientationModes(this.cachedOrientationModes);
		}

		this.setWindowView(this.view);

		if (needsOpen) {
			this.window.on("windowCreated", function () {
				// Add children before the view is set
				self.addChildren();
				
				self.postOpen();
				self.fireEvent("open");
			});
			
			this.window.open(options);
			
		} else {
			this.postOpen();
			this.fireEvent("open");

		}

	}

	Window.prototype.setWindow = function(existingWindow) {
		this.currentState = this.state.opening;

		// Set any cached properties on the properties given to the "true" view
		if (this.propertyCache) {
			kroll.extend(this._properties, this.propertyCache);
		}
		this.window = existingWindow;
		this.view = this.window;
		this.setWindowView(this.view);
		this.addChildren();
		var self = this;
		this.on("open", function () {
			self.postOpen(true);
		});
	}

	Window.prototype.postOpen = function(isTab) {
		// Set view and model listener after the window opens
		this.setWindowView(this.view);
		if (!isTab) {
			this.addSelfToStack();
		}

		if ("url" in this._properties) {
			this.loadUrl();
		}

		// Add event listeners and update the source of events after the window opens
		for (var event in this._events) { 
			var listeners = this.listeners(event); 
		 	for (var i = 0; i < listeners.length; i++) { 
		 		this.view.addEventListener(event, listeners[i].listener, this); 
		 	} 
		}
		
		var self = this;
		this.view.addEventListener("closeFromActivity", function(e) {
			self.window = null;
			self.view = null;
			self.currentState = self.state.closed;

			// Dispose the URL context if the window's activity
			// is destroyed since close() will not get called.
			if (self._urlContext) {
				Script.disposeContext(self._urlContext);
				self._urlContext = null;
			}
		}, this);
		
		if (this.cachedActivityProxy) {
			this.window._internalActivity.extend(this.cachedActivityProxy);
		}

		this.currentState = this.state.opened;
		
		// If there is any child added when the window state is opening, handle it here.
		// For HW window, the correct activity is not available until this point.
		// This resolves the issue caused by calling window.open() before calling window.add(view), eg TIMOB-6519.
		this.addPostOpenChildren();
	}

	Window.prototype.loadUrl = function() {
		if (this.url == null) {
			return;
		}

		var resolvedUrl = url.resolve(this._sourceUrl, this.url);
		if (!resolvedUrl.assetPath) {
			kroll.log(TAG, "Window URL must be a resources file.");
			return;
		}

		// Reset creationUrl of the window
		this.window.setCreationUrl(resolvedUrl.href);

		var scopeVars = {
			currentWindow: this,
			currentActivity: this.window._internalActivity,
			currentTab: this.tab,
			currentTabGroup: this.tabGroup
		};
		scopeVars = Titanium.initScopeVars(scopeVars, resolvedUrl);

		var context = this._urlContext = Script.createContext(scopeVars);
		// Set up the global object which is needed when calling the Ti.include function from the new window context.
		scopeVars.global = context;
		context.Titanium = context.Ti = new Titanium.Wrapper(scopeVars);
		bootstrap.bootstrapGlobals(context, Titanium);

		var scriptPath = this.resolveFilePathFromURL(resolvedUrl);
		if (!scriptPath) {
			kroll.log(TAG, "Window URL not found: " + this.url);
			return;
		}

		var relScriptPath = scriptPath.replace("Resources/", "");
		var scriptSource = assets.readAsset(scriptPath);

		// Set up paths, filename and require for the new window context.
		var module = new kroll.Module("app:///" + relScriptPath, this._module || kroll.Module.main, context);
		module.paths = [path.dirname(scriptPath)];
		module.filename = scriptPath;
		context.require = function(request, context) {
			return module.require(request, context);
		};

		if (kroll.runtime == "v8") {
			Script.runInContext(scriptSource, context, relScriptPath, true);
		} else {
			Script.runInThisContext(scriptSource, relScriptPath, true, context);
		}
	}

	// Determine the full path of the file which is defined by the "url" property.
	Window.prototype.resolveFilePathFromURL = function(resolvedURL) {
		var parentModule = this._module || kroll.Module.main,
			resolved = url.toAssetPath(resolvedURL),
			moduleId = this.url;

		// Return "resolvedURL" if it is a valid path.
		if (parentModule.filenameExists(resolved) || assets.fileExists(resolved)) {
			return resolved;

		// Otherwise, try each possible path where the module's source file could be located.
		} else {
			if (moduleId.indexOf(".js") == moduleId.length - 3) {
				moduleId = moduleId.substring(0, moduleId.length -3);
			}
			resolved = parentModule.resolveFilename(moduleId);
			// Return the file path if the file exists.
			if (resolved) {
				return resolved[1];
			}
		}

		return null;
	}

	Window.prototype.close = function(options) {
		// if the window is not opened, do not close
		if (this.currentState != this.state.opened) {
			if (kroll.DBG) {
				kroll.log(TAG, "Unable to close, window is not opened");
			}
			return;
		}
		this.currentState = this.state.closing;

		if (this.isActivity) {
			var self = this;
			this.window.close(options);
			this.currentState = this.state.closed;

		} else {
			if (this.view.parent != null) {
				// make sure to remove the children otherwise when the window is opened a second time
				// the children views wont be added again to the native view
				this.removeChildren();
				this.window.remove(this.view);
				this.window = null;
			}
			this.removeSelfFromStack();
			this.currentState = this.state.closed;
			this.fireEvent("close");
		}

		// Dispose the URL script context if one was created during open.
		if (this._urlContext) {
			Script.disposeContext(this._urlContext);
			this._urlContext = null;
		}
	}

	Window.prototype.add = function(view) {

		if (view instanceof TiWindow) {
			throw new Error("Cannot add window/tabGroup to another window/tabGroup.");	    
		}

		if (this.view) {
		
			// If the window is already opened, add the child to this.view directly
			// and push the child to the array this._children
			if (this.currentState == this.state.opened) {
				this.view.add(view);
				this._children.push(view);
			}
			
			// If the window state is opening, push the child to the array this._postOpenChildren.
			// The children in this array will be added to this.view in postOpen().
			else if (this.currentState == this.state.opening) {
				this._postOpenChildren.push(view);
			}
		}
		
		// If the window state is not opening or opened, push the child to the array this._children.
		// By the time the window opens, the children in this array will be added to this.view.
		else {
			this._children.push(view);
		}
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
	
	Window.prototype.addPostOpenChildren = function() {
		if (this._postOpenChildren) {
			var length = this._postOpenChildren.length;
			
			// Add all the postOpenChildren to this.view and push them to the array this._children.
			for (var i = 0; i < length; i++) {
				var postOpenChild = this._postOpenChildren[i];
				this.view.add(postOpenChild);
				this._children.push(postOpenChild);
			}
			
			// Clear this._postOpenChildren because all the children in this array are now in this._children.
			this._postOpenChildren.length = 0;
		}
	}

	Window.prototype.remove = function(view) {
		if (this.view) {
			this.view.remove(view);
		}

		var children = this._children;
		if (children) {
			var viewIndex = children.indexOf(view);
			if (viewIndex != -1) {
				children.splice(viewIndex, 1);
			}
		}
	}

	Window.prototype.removeChildren = function() {
		if (this._children) {
			var length = this._children.length;

			for (var i = 0; i < length; i++) {
				this.view.remove(this._children[i]);
			}
		}
	}

	Window.prototype.animate = function(options, callback) {
		if (this.view) {
			if (callback) {
				this.view.animate(options, callback);

			} else {
				this.view.animate(options);
			}

		} else if (kroll.DBG) {
			kroll.log(TAG, "Unable to call animate, view is undefined");
		}
	}

	Window.prototype.addEventListener = function(event, listener) {
		if (windowEventListeners.indexOf(event) >= 0 || this.view == null) {
			EventEmitter.prototype.addEventListener.call(this, event, listener);

		} else {
			this.view.addEventListener(event, listener, this); 
			if (event == 'android:back' && this.view._internalActivity) {
				this.view._internalActivity.addEventListener(event, listener, this);  
			}
		}
	}
	
	Window.prototype.removeEventListener = function(event, listener) {
		if (windowEventListeners.indexOf(event) >= 0 || this.window == null) {
			EventEmitter.prototype.removeEventListener.call(this, event, listener);

		} else {
			this.view.removeEventListener(event, listener);
			if (event == 'android:back' && this.view._internalActivity) {
				this.view._internalActivity.removeEventListener(event, listener);  
			}
		}
	}

	Window.prototype.fireEvent = function(event, data) {
		if (windowEventListeners.indexOf(event) >= 0 || this.window == null) {
			EventEmitter.prototype.fireEvent.call(this, event, data);

		} else {
			this.view.fireEvent(event, data);
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
		window.currentState = window.state.closed;

		window._sourceUrl = scopeVars.sourceUrl;
		window._currentActivity = scopeVars.currentActivity; // don't think we are using this, remove?
		window._module = scopeVars.module;
		window._children = [];
		window._postOpenChildren = [];
		var self = window;

		Object.defineProperty(window, "children", { get: childrenGetter});

		return window;
		
	}

	return Window;
};


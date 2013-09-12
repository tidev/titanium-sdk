/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
 
var url = require("url"),
	path = require('path'),
	Script = kroll.binding('evals').Script,
	assets = kroll.binding("assets"),
	NativeModule = require('native_module'),
	bootstrapModule = require('bootstrap'),
	PersistentHandle = require('ui').PersistentHandle;

var TAG = "Window";

exports.bootstrap = function(Titanium) {

	var TiWindow = Titanium.TiWindow;
	var Window = Titanium.UI.Window;
	Window.prototype._cachedActivityProxy = null;

	function createWindow(scopeVars, options) {
		var window = new Window(options);
		window._sourceUrl = scopeVars.sourceUrl;
		window._module = scopeVars.module;
		window._children = [];

		return window;
	}

	Titanium.UI.createWindow = createWindow;

	// Activity getter (account for scenario when heavy weight window's activity is not created yet) 
	var activityProxyGetter = function () {
		// Cannot get the activity for a lightweight window.
		if (this._isLightweight()) {
			return undefined;
		}

		var windowProxy = this._getWindowActivityProxy();
		if (windowProxy) {
			return windowProxy;
		} else if (this._cachedActivityProxy == null) {
			this._cachedActivityProxy = {};
		}

		return this._cachedActivityProxy;
	}
	Window.prototype.getActivity = activityProxyGetter;
	Object.defineProperty(Window.prototype, "activity", { get: activityProxyGetter });


	var _open = Window.prototype.open;
	Window.prototype.open = function(options) {
		// Retain the window until it has closed.
		var handle = new PersistentHandle(this);

		var self = this;
		this.on("close", function(e) {
			if (e._closeFromActivityForcedToDestroy) {
				if (kroll.DBG) {
					kroll.log(TAG, "Window is closed because the activity is forced to destroy by Android OS.");
				}
				return;
			}

			// Dispose the URL context if the window's activity is destroyed.
			if (self._urlContext) {
				Script.disposeContext(self._urlContext);
				self._urlContext = null;
			}
			handle.dispose();

			if (kroll.DBG) {
				kroll.log(TAG, "Window is closed normally.");
			}
		});

		_open.call(this, options);
	}

	var _add = Window.prototype.add;
	Window.prototype.add = function(child) {
		if (child instanceof TiWindow) {
			throw new Error("Cannot add window/tabGroup to another window/tabGroup.");	    
		}

		_add.call(this, child);

		// The children have to be retained by the window in the Javascript side
		// in order to let V8 know the relationship between children and the window.
		// Therefore, as long as the window is open, all its children won't be detached
		// or garbage collected and V8 will recognize the closures and retain all
		// the related proxies.
		this._children.push(child);
	}

	var _remove = Window.prototype.remove;
	Window.prototype.remove = function(child) {
		_remove.call(this, child);

		// Remove the child in the Javascript side so it can be detached and garbage collected.
		var children = this._children;
		if (children) {
			var childIndex = children.indexOf(child);
			if (childIndex != -1) {
				children.splice(childIndex, 1);
			}
		}
	}

	Window.prototype.postWindowCreated = function() {
		if (kroll.DBG) {
			kroll.log(TAG, "Checkpoint: postWindowCreated()");
		}
		this.loadUrl();
		if (this._cachedActivityProxy) {
			this._internalActivity.extend(this._cachedActivityProxy);
		}
	}

	// Run the script where the "url" property specifies in its own sub-context.
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
		this.setCreationUrl(resolvedUrl.href);

		var scopeVars = {
			currentWindow: this,
			currentActivity: this._internalActivity,
			currentTab: this.tab,
			currentTabGroup: this.tabGroup
		};
		var scriptPath = this.resolveFilePathFromURL(resolvedUrl);

		// Use scriptPath as the base URL since that's where we found the window URL.
		scopeVars = Titanium.initScopeVars(scopeVars, scriptPath.replace("Resources/", "app://"));

		var context = this._urlContext = Script.createContext(scopeVars);
		// Set up the global object which is needed when calling the Ti.include function from the new window context.
		scopeVars.global = context;
		context.Titanium = context.Ti = new Titanium.Wrapper(scopeVars);
		context.console = NativeModule.require('console');
		bootstrapModule.bootstrapGlobals(context, Titanium);

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

		Script.runInContext(scriptSource, context, relScriptPath, true);
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
}
/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
'use strict';

var Script = kroll.binding('evals').Script,
	PersistentHandle = require('ui').PersistentHandle;

var TAG = 'Window';

exports.bootstrap = function (Titanium) {

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
	function activityProxyGetter() {
		var activityProxy = this._getWindowActivityProxy();
		if (activityProxy) {
			return activityProxy;
		} else if (this._cachedActivityProxy == null) { // eslint-disable-line
			this._cachedActivityProxy = {};
		}

		return this._cachedActivityProxy;
	}
	Window.prototype.getActivity = activityProxyGetter;
	Object.defineProperty(Window.prototype, 'activity', { get: activityProxyGetter });

	var _open = Window.prototype.open;
	Window.prototype.open = function (options) {
		// Retain the window until it has closed.
		var handle = new PersistentHandle(this);

		var self = this;
		this.once('close', function (e) {
			if (e._closeFromActivityForcedToDestroy) {
				if (kroll.DBG) {
					kroll.log(TAG, 'Window is closed because the activity is forced to destroy by Android OS.');
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
				kroll.log(TAG, 'Window is closed normally.');
			}
		});

		_open.call(this, options);
	};

	var _add = Window.prototype.add;
	Window.prototype.add = function (child) {
		if (child instanceof TiWindow) {
			throw new Error('Cannot add window/tabGroup to another window/tabGroup.');
		}

		_add.call(this, child);

		// The children have to be retained by the window in the Javascript side
		// in order to let V8 know the relationship between children and the window.
		// Therefore, as long as the window is open, all its children won't be detached
		// or garbage collected and V8 will recoganize the closures and retain all
		// the related proxies.
		this._children.push(child);
	};

	var _remove = Window.prototype.remove;
	Window.prototype.remove = function (child) {
		_remove.call(this, child);

		// Remove the child in the Javascript side so it can be detached and garbage collected.
		var children = this._children;
		if (children) {
			var childIndex = children.indexOf(child);
			if (childIndex !== -1) {
				children.splice(childIndex, 1);
			}
		}
	};

	Window.prototype.postWindowCreated = function () {
		if (kroll.DBG) {
			kroll.log(TAG, 'Checkpoint: postWindowCreated()');
		}
		if (this._cachedActivityProxy) {
			this._internalActivity.extend(this._cachedActivityProxy);
		}
	};
};

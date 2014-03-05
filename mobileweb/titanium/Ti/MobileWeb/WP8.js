/*global window, define*/
define(['Ti/_/lang'], function(lang) {

	var global = window,
		proxyList = {},
		sendNativeMessage = require.sendNativeMessage;

	function Handle(hndId) {
		this._hnd = hndId;
		this._listeners = {};
	}

	function _send(action, data) {
		var res;
		global.handleProxyResponse = function (r) {
			res = r;
		};
		sendNativeMessage('r', action + JSON.stringify(data));
		global.handleProxyResponse = void 0;
		res = JSON.parse(res);
		if (res.primitiveValue) {
			return res.primitiveValue;
		} else if (res.hnd) {
			return proxyList[res.hnd] || (proxyList[res.hnd] = new Handle(res.hnd));
		}
	};

	global.handleEvent = function (evt) {
		var payload = JSON.parse(evt),
			src = payload.source = proxyList[payload._hnd];
		src._listeners[payload.type].forEach(function (cb) {
			cb(payload);
		});
	};

	global.handleError = function (err) {
		Ti.API.error(err);
		throw err;
	};

	Handle.prototype.invoke = function (name, argTypes, argValues) {
		return _send('in', {
			hnd: this._hnd,
			name: name,
			argTypes: argTypes,
			argValues: argValues.map(function (value) {
				var isHandle = value instanceof Handle;
				return {
					valueHnd: isHandle ? value._hnd : void 0,
					valuePrimitive: isHandle ? void 0 : value,
				};
			})
		});
	};

	Handle.prototype.getProp = function (name, isAttached) {
		return _send('gp', {
			hnd: this._hnd,
			name: name,
			isAttached: isAttached
		});
	};

	Handle.prototype.setProp = function (name, value, isAttached) {
		var isHandle = value instanceof Handle;
		return _send('sp', {
			hnd: this._hnd,
			name: name,
			valueHnd: isHandle ? value._hnd : void 0,
			valuePrimitive: isHandle ? void 0 : value,
			isAttached: isAttached
		});
	};

	Handle.prototype.getAtIndex = function (name, index) {
		return _send('gi', {
			hnd: this._hnd,
			name: name,
			index: index
		});
	};

	Handle.prototype.setAtIndex = function (name, value, index) {
		return _send('si', {
			hnd: this._hnd,
			name: name,
			value: value,
			index: index
		});
	};

	Handle.prototype.destroy = function () {
		for (var evt in this._listeners) {
			for (var cb in this._listeners[evt]) {
				this.removeEventListener(evt, this._listeners[evt][cb]);
			}
		}
		_send('de', { hnd: this._hnd });
		delete proxyList[this._hnd];
	};

	Handle.prototype.addEventListener = function(name, cb) {
		if (!this._listeners[name]) {
			this._listeners[name] = [];
			sendNativeMessage('r', 'ae' + JSON.stringify({
				hnd: this._hnd,
				name: name
			}));
		}
		this._listeners[name].push(cb);
	};

	Handle.prototype.removeEventListener = function (name, cb) {
		if (!(name in this._listeners)) return;
		var idx = this._listeners[name].indexOf(cb);
		if (this._listeners[name] && ~idx) {
			this._listeners[name].splice(idx, 1);
			this._listeners[name].length || sendNativeMessage('r', 're' + JSON.stringify({
				hnd: this._hnd,
				name: name
			}));
		}
	};

	return lang.setObject('Ti.MobileWeb.WP8', {
		createInstance: function (className, argTypes, argValues) {
			var hnd;
			global.handleProxyResponse = function (r) {
				hnd = r;
			};
			sendNativeMessage('r', 'ci' + JSON.stringify({
				className: className,
				argTypes: argTypes,
				argValues: argValues.map(function (value) {
					var isHandle = value instanceof Handle;
					return {
						valueHnd: isHandle ? value._hnd : void 0,
						valuePrimitive: isHandle ? void 0 : value,
					};
				})
			}));
			global.handleProxyResponse = void 0;
			return proxyList[hnd] = new Handle(hnd);
		},

		getEnum: function (name, value) {
			return _send('ge', { name: name, value: value });
		},

		getRootGrid: function () {
			if (proxyList.root) {
				return proxyList.root;
			}
			var hnd;
			global.handleProxyResponse = function (r) {
				hnd = r;
			};
			sendNativeMessage('r', 'gr');
			global.handleProxyResponse = void 0;
			return proxyList[hnd] = new Handle(hnd);
		},

		getPhoneApplicationPage: function () {
			if (proxyList.app) {
				return proxyList.app;
			}
			var hnd;
			global.handleProxyResponse = function (r) {
				hnd = r;
			};
			sendNativeMessage('r', 'ga');
			global.handleProxyResponse = void 0;
			return proxyList[hnd] = new Handle(hnd);
		},

		getWebBrowser: function () {
			if (proxyList.browser) {
				return proxyList.browser;
			}
			var hnd;
			global.handleProxyResponse = function (r) {
				hnd = r;
			};
			sendNativeMessage('r', 'gw');
			global.handleProxyResponse = void 0;
			return proxyList[hnd] = new Handle(hnd);
		},

		getProxyList: function () { return proxyList; }
	});
});

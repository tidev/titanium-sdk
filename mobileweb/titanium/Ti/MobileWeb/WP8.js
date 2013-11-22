/*global window, define*/
define(['Ti/_/lang'], function(lang) {

	var global = window,
		proxyList = {},
		sendNativeMessage = require.sendNativeMessage;

	function Handle(hndId) {
		this._hnd = hndId;
		this._listeners = {};
	}

	Handle.prototype._send = function (action, data) {
		var res;
		data.hnd = this._hnd;
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

	Handle.prototype.invoke = function (name, argTypes, argValues) {
		return this._send('in', {
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
		return this._send('gp', {
			name: name,
			isAttached: isAttached
		});
	};

	Handle.prototype.setProp = function (name, value, isAttached) {
		var isHandle = value instanceof Handle;
		return this._send('sp', {
			name: name,
			valueHnd: isHandle ? value._hnd : void 0,
			valuePrimitive: isHandle ? void 0 : value,
			isAttached: isAttached
		});
	};

	Handle.prototype.getAtIndex = function (name, index) {
		return this._send('gi', {
			name: name,
			index: index
		});
	};

	Handle.prototype.setAtIndex = function (name, value, index) {
		return this._send('si', {
			name: name,
			value: value,
			index: index
		});
	};

	Handle.prototype.getEnum = function (name, value) {
		return this._send('ge', {
			name: name,
			value: value
		});
	};

	Handle.prototype.destory = function () {
		this._send('de', {});
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
		var idx = this._listeners[name].indexOf(cb);
		if (!this._listeners[name] || !~idx) {
			return;
		}
		this._listeners[name] = this._listeners[name].splice(idx, 1);
		this._listeners[name].length || sendNativeMessage('r', 're' + JSON.stringify({
			hnd: this._hnd,
			name: name
		}));
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
		}
	});
});
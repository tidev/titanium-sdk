(function (global) {
	/**
	 * console shim
	 */
	var objToString = Object.prototype.toString,
		console = global.console = {},
		requests = {},
		handles = {};

	function log() {
		sendRequest('log', {
			message: Array.prototype.slice.call(arguments).map(function (it) {
				return it === void 0 ? 'undefined' : it === null ? 'null' : Array.isArray(it) ? JSON.stringify(it.map(function (f) {
					return typeof f == 'function' ? f.toString() : f;
				})) : objToString.call(it) == '[object Object]' ? JSON.stringify(it) : it;
			}).join(' ')
		});
	}

	['log', 'debug', 'info', 'warn', 'error'].forEach(function (level) {
		console[level] = log;
	});

	function processResponse(data) {
		var tmp = data.primitiveValue;
		return tmp !== void 0 ? tmp : (tmp = data.handle) ? handles[tmp] || (handles[tmp] = new Handle(tmp)) : data;
	}

	// WARNING: Do NOT use console.log() inside this function when type == 'log'!
	function sendRequest(type, data, callback) {
		callback || (callback = processResponse);
		var token = '' + Math.round(Math.random() * 1e9).toString(16),
			tmp;
		requests[token] = callback;

		// window.external.notify() is real finicky, so we have to wrap it in a function
		// otherwise the code minifier will optimize it by putting it in the middle of
		// a comma-separated list of instructions and it freaks out at run time with a
		// "Object doesn't support this action" error. Sigh.
		(function () {
			global.external.notify(JSON.stringify({
				type: type,
				token: token,
				data: data
			}));
		}());

		tmp = requests[token];
		delete requests[token];
		if (tmp instanceof Error && type != 'log') {
			tmp.toString().split(/\r\n|\n/).forEach(function (s) { console.log('[ERROR] ', s); });
			throw tmp;
		}
		return tmp;
	}

	function valueify(v, obj) {
		obj || (obj = {});
		if (v) {
			v instanceof Handle ? (obj.valueHnd = v._hnd) : (obj.valuePrimitive = v);
		}
		return obj;
	}

	/**
	 * Native object handle
	 */
	function Handle(hnd) {
		this._hnd = hnd
		this._listeners = {};
	}

	Handle.prototype = Object.create({
		addEventListener: function (name, callback) {
			var listeners = this._listeners[name] || (this._listeners[name] = []);
			if (!listeners.length) {
				sendRequest('reflection', {
					action: 'addEventListener',
					handle: this._hnd,
					name: name
				});
			}
			listeners.push(callback);
		},

		destroy: function () {
			for (var evt in this._listeners) {
				for (var i = 0, cbs = this._listeners[evt], len = cbs.length; i < len; i++) {
					this.removeEventListener(evt, cbs[i]);
				}
			}
			sendRequest('reflection', {
				action: 'destroy',
				handle: this._hnd
			});
			delete handles[this._hnd];
		},

		invoke: function (method, args) {
			return sendRequest('reflection', {
				action: 'invokeMethod',
				handle: this._hnd,
				method: method,
				args: Array.isArray(args) ? args.map(function (a, i) {
						return i % 2 == 0 ? a : valueify(a);
					}) : []
			});
		},

		property: function (name, value) {
			if (name && objToString.call(name) == '[object Object]') {
				for (var i in name) {
					name[i] = valueify(name[i]);
				}
			}

			return sendRequest('reflection', valueify(value, {
				action: 'property',
				handle: this._hnd,
				name: name
			}), function (data) {
				var obj = data.value;
				if (obj && objToString.call(obj) == '[object Object]') {
					for (var i in obj) {
						obj[i] = processResponse(obj[i]);
					}
					return obj;
				}
				return processResponse(data);
			});
		},

		removeEventListener: function (name, callback) {
			var idx,
				listeners = this._listeners[name];
			if (listeners && ~(idx = listeners.indexOf(callback))) {
				listeners.splice(idx, 1);
				listeners.length || sendRequest('reflection', {
					action: 'removeEventListener',
					handle: this._hnd,
					name: name
				});
			}
		}
	});

	// init default handles
	handles.app = new Handle('app');
	handles.browser = new Handle('browser');
	handles.root = new Handle('root');

	/**
	 * tiwp8 - Titanium Windows Phone 8 namespace
	 */
	global.tiwp8 = {
		createInstance: function (className, args) {
			return sendRequest('reflection', {
				action: 'createInstance',
				className: className,
				args: Array.isArray(args) ? args.map(function (a, i) {
						return i % 2 == 0 ? a : valueify(a);
					}) : []
			});
		},

		fireEvent: function (data) {
			var src = data.source = handles[data._hnd],
				listeners = src._listeners[data.type],
				i = 0,
				len = listeners ? listeners.length : 0;
			data.sender = new Handle(data.sender);
			data.eventArgs = new Handle(data.eventArgs);
			for (; i < len; i++) {
				listeners[i](data);
			}
		},

		getEnum: function (name, value) {
			return sendRequest('reflection', {
				action: 'getEnum',
				name: name,
				value: value
			});
		},

		getFile: function (file, isBinary) {
			return sendRequest('file', {
				file: file,
				isBinary: isBinary
			});
		},

		getHandles: function () {
			return handles;
		},

		getPhoneApplicationPage: function () {
			return handles.app;
		},

		getRootGrid: function () {
			return handles.root;
		},

		getWebBrowser: function () {
			return handles.browser;
		},

		handleResponse: function (data) {
			var err = data.error,
				token = data.token;
			try {
				if (err) {
					throw new Error(err);
				}
				token && requests[token] && (requests[token] = requests[token](data));
			} catch (ex) {
				token && (requests[token] = ex);
			}
		},

		invokeStatic: function (className, method, args) {
			return sendRequest('reflection', {
				action: 'invokeStatic',
				className: className,
				method: method,
				args: Array.isArray(args) ? args.map(function (a, i) {
						return i % 2 == 0 ? a : valueify(a);
					}) : []
			});
		},

		sendRequest: sendRequest
	};

	/**
	 * XMLHttpRequest shim
	 */
	var open = XMLHttpRequest.prototype.open;
	XMLHttpRequest.prototype.open = function (method, url) {
		url = 'http://localhost:9999/fetch/' + escape(btoa(url));
		open.apply(this, arguments);
	};
}(window));
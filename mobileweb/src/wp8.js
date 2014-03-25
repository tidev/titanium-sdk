(function (global) {
	/**
	 * console shim
	 */
	var objToString = Object.prototype.toString,
		console = global.console = {},
		requests = {},
		handles = {};

	['log', 'debug', 'info', 'warn', 'error'].forEach(function (level) {
		console[level] = function () {
			sendRequest('log', {
				level: level,
				message: Array.prototype.slice.call(arguments).map(function (it) {
					return it === void 0 ? 'undefined' : it === null ? 'null' : Array.isArray(it) ? JSON.stringify(it.map(function (f) {
						return typeof f == 'function' ? f.toString() : f;
					})) : objToString.call(it) == '[object Object]' ? JSON.stringify(it) : it;
				}).join(' ')
			});
		};
	});

	function processResponse(data) {
		var tmp = data.handle;
		return tmp ? handles[tmp] || (handles[tmp] = new Handle(tmp)) : (tmp = data.primitiveValue) !== void 0 ? tmp : data;
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
			if (!method) {
				throw new Error('invoke requires a "method"');
			}
			return sendRequest('reflection', {
				action: 'invokeMethod',
				handle: this._hnd,
				method: method,
				args: Array.isArray(args) ? args.map(function (a, i) {
						return i % 2 == 0 ? a : valueify(a);
					}) : []
			});
		},

		invokeAsync: function (method, args, callback) {
			if (!method) {
				throw new Error('invokeAsync requires a "method"');
			}
			if (!args && !callback) {
				throw new Error('invokeAsync requires a "callback"');
			}
			if (typeof args == 'function') {
				callback = args;
				args = 0;
			}
			var r = sendRequest('reflection', {
				action: 'invokeMethodAsync',
				handle: this._hnd,
				method: method,
				args: Array.isArray(args) ? args.map(function (a, i) {
						return i % 2 == 0 ? a : valueify(a);
					}) : []
			});
			r.addEventListener('complete', function (e) {
				var data = e.eventArgs.property(['handle', 'primitiveValue']);
				r.destroy();
				callback(processResponse(data));
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
				if (!listeners.length) {
					sendRequest('reflection', {
						action: 'removeEventListener',
						handle: this._hnd,
						name: name
					});
					delete this._listeners[name];
				}
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

		downloadFile: function (opts) {
			if (!opts.url) {
				throw new Error('Missing required "url"');
			}
			var r = sendRequest('download', {
					url: opts.url,
					saveTo: opts.saveTo,
					overwrite: opts.overwrite
				}),
				oncomplete = opts.oncomplete,
				onerror = opts.onerror;
			r.addEventListener('complete', function (evt) {
				r.destroy();
				oncomplete && typeof oncomplete == 'function' && oncomplete(evt);
			});
			r.addEventListener('error', function (evt) {
				r.destroy();
				onerror && typeof onerror == 'function' && onerror(new Error(evt.error && evt.error.Message || "Unknown error"));
			});
			r.invoke('send');
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

		invokeStaticAsync: function (className, method, args, callback) {
			if (!className) {
				throw new Error('invokeStaticAsync requires a "className"');
			}
			if (!method) {
				throw new Error('invokeStaticAsync requires a "method"');
			}
			if (!args && !callback) {
				throw new Error('invokeStaticAsync requires a "callback"');
			}
			if (typeof args == 'function') {
				callback = args;
				args = 0;
			}
			var r = sendRequest('reflection', {
				action: 'invokeStaticAsync',
				className: className,
				method: method,
				args: Array.isArray(args) ? args.map(function (a, i) {
						return i % 2 == 0 ? a : valueify(a);
					}) : []
			});
			r.addEventListener('complete', function (e) {
				var data = e.eventArgs.property(['handle', 'primitiveValue']);
				r.destroy();
				callback(processResponse(data));
			});
		},

		sendRequest: sendRequest,

		staticProperty: function (className, prop) {
			return sendRequest('reflection', {
				action: 'staticProperty',
				className: className,
				property: prop
			});
		}
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

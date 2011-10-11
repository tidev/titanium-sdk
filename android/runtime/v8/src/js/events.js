//Copyright Joyent, Inc. and other Node contributors.

//Permission is hereby granted, free of charge, to any person obtaining a
//copy of this software and associated documentation files (the
//"Software"), to deal in the Software without restriction, including
//without limitation the rights to use, copy, modify, merge, publish,
//distribute, sublicense, and/or sell copies of the Software, and to permit
//persons to whom the Software is furnished to do so, subject to the
//following conditions:

//The above copyright notice and this permission notice shall be included
//in all copies or substantial portions of the Software.

//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
//OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
//MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
//NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
//DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
//OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
//USE OR OTHER DEALINGS IN THE SOFTWARE.

// Modifications Copyright 2011 Appcelerator, Inc.

var TAG = "EventEmitter";
var EventEmitter = exports.EventEmitter = kroll.EventEmitter;
var isArray = Array.isArray;

//By default EventEmitters will print a warning if more than
//10 listeners are added to it. This is a useful default which
//helps finding memory leaks.

//Obviously not all Emitters should be limited to 10. This function allows
//that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
	if (!this._events) this._events = {};
	this._events.maxListeners = n;
};

EventEmitter.prototype.callHandler = function(handler, type, data) {
	kroll.log(TAG, "calling event handler: type:" + type + ", data: " + data + ", handler: " + handler);
	if (data instanceof Object) {
		data.type = type;
	} else if (!data) {
		data = { type: type };
	}

	handler.call(this, data);
}

EventEmitter.prototype.emit = function(type) {

	kroll.log(TAG, "emit : " + JSON.stringify(arguments));

	// If there is no 'error' event listener then throw.
	if (type === 'error') {
		if (!this._events || !this._events.error ||
				(isArray(this._events.error) && !this._events.error.length))
		{
			if (arguments[1] instanceof Error) {
				throw arguments[1]; // Unhandled 'error' event
			} else {
				throw new Error("Uncaught, unspecified 'error' event.");
			}
			return false;
		}
	}

	if (!this._events) {
		kroll.log(TAG, "no events for " + type + ", not emitting");
		return false;
	}

	var handler = this._events[type];
	if (!handler) {
		kroll.log(TAG, "no handler for " + type + ", not emitting");
		return false;
	}

	if (typeof handler == 'function') {
		switch (arguments.length) {
		case 1:
			this.callHandler(handler, type);
			break;
		default:
			this.callHandler(handler, type, arguments[1]);
			break;
		}
		return true;

	} else if (isArray(handler)) {
		var args = Array.prototype.slice.call(arguments, 1);

		var listeners = handler.slice();
		for (var i = 0, l = listeners.length; i < l; i++) {
			this.callHandler(listeners[i], type, args[0]);
		}
		return true;

	} else {
		return false;
	}
};
// Titanium compatibility
EventEmitter.prototype.fireEvent = EventEmitter.prototype.emit;

//EventEmitter is defined in src/node_events.cc
//EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
	if ('function' !== typeof listener) {
		throw new Error('addListener only takes instances of Function');
	}

	if (!this._events) {
		this._events = {};
	}

	var id;

	// Setup ID first so we can pass count in to "listenerAdded"
	if (!this._events[type]) {
		id = 0;
	} else if (isArray(this._events[type])) {
		id = this._events[type].length;
	} else {
		id = 1;
	}

	if (!this._events[type]) {
		// Optimize the case of one listener. Don't need the extra array object.
		this._events[type] = listener;
	} else if (isArray(this._events[type])) {

		// If we've already got an array, just append.
		this._events[type].push(listener);
		// Check for listener leak
		if (!this._events[type].warned) {
			var m;
			if (this._events.maxListeners !== undefined) {
				m = this._events.maxListeners;
			} else {
				m = defaultMaxListeners;
			}

			if (m && m > 0 && this._events[type].length > m) {
				this._events[type].warned = true;
				Ti.API.error('warning: possible EventEmitter memory ' +
					'leak detected. %d listeners added. ' +
					'Use emitter.setMaxListeners() to increase limit.',
					this._events[type].length);
				//TODO console.trace();
			}
		}
	} else {
		// Adding the second element, need to change to array.
		this._events[type] = [this._events[type], listener];
	}

	// Notify the Java proxy if this is the first listener added.
	if (id == 0) {
		this._hasListenersForEventType(type, true);
	}

	return id;
};

// The JavaObject prototype will provide a version of this
// that delegates back to the Java proxy. Non-Java versions
// of EventEmitter don't care, so this no op is called instead.
EventEmitter.prototype._listenerForEvent = function () { }

EventEmitter.prototype.on = EventEmitter.prototype.addListener;
// Titanium compatibility
EventEmitter.prototype.addEventListener = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
	var self = this;
	function g() {
		self.removeListener(type, g);
		listener.apply(this, arguments);
	};

	g.listener = listener;
	self.on(type, g);

	return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
	if ('function' !== typeof listener) {
		throw new Error('removeListener only takes instances of Function');
	}

	// does not use listeners(), so no side effect of creating _events[type]
	if (!this._events || !this._events[type]) return this;

	var list = this._events[type];
	var count = 0;

	if (isArray(list)) {
		var position = -1;
		// Also support listener indexes / ids
		if (typeof(listener) === 'number') {
			position = listener;
			if (position > list.length || position < 0) {
				return this;
			}
		} else {
			for (var i = 0, length = list.length; i < length; i++) {
				if (list[i] === listener ||
					(list[i].listener && list[i].listener === listener))
				{
					position = i;
					break;
				}
			}
		}

		if (position < 0) return this;
		list.splice(position, 1);
		if (list.length == 0)
			delete this._events[type];
		count = list.length;
	} else if (list === listener ||
		(list.listener && list.listener === listener) ||
		listener == 0)
	{
		delete this._events[type];
	}

	if (count == 0) {
		this._hasListenersForEventType(type, false);
	}

	return this;
};

EventEmitter.prototype.removeEventListener = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners = function(type) {
	// does not use listeners(), so no side effect of creating _events[type]
	if (type && this._events && this._events[type]) {
		this._events[type] = null;
		this._hasListenersForEventType(type, false);
	}
	return this;
};

EventEmitter.prototype.listeners = function(type) {
	if (!this._events) this._events = {};
	if (!this._events[type]) this._events[type] = [];
	if (!isArray(this._events[type])) {
		this._events[type] = [this._events[type]];
	}
	return this._events[type];
};

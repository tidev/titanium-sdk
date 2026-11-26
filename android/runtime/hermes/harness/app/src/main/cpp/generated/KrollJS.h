// Harness stand-in for the file that the SDK build generates from the JS kernel.
#ifndef KROLL_NATIVES_H
#define KROLL_NATIVES_H

#include <stddef.h>

namespace titanium {

// A small kernel that does what kroll.js and its helpers do for the tests.
const char kroll_native[] = R"KERNEL((function (global, kroll) {
	global.kroll = kroll;
	var tiBinding = kroll.binding('Titanium');
	var Proxy = tiBinding.Proxy;
	Object.defineProperty(Proxy.prototype, 'getProperty', {
		value: function (name) { return this._properties[name]; }
	});
	Object.defineProperty(Proxy.prototype, 'setProperty', {
		value: function (name, value) { return this._properties[name] = value; }
	});
	var EventEmitter = kroll.EventEmitter;
	EventEmitter.prototype.addEventListener = function (type, listener) {
		if (!this._events) {
			this._events = {};
		}
		if (!this._events[type]) {
			this._events[type] = [];
			this._hasListenersForEventType(type, true);
		}
		this._events[type].push(listener);
	};
	EventEmitter.prototype.emit = function (type, data) {
		var listeners = this._events && this._events[type];
		if (!listeners) {
			return false;
		}
		for (var i = 0; i < listeners.length; i++) {
			listeners[i].call(this, data);
		}
		return true;
	};
	global.Module = {
		runModule: function (source, filename, activity) {
			global.lastModule = filename;
			return (0, eval)(source);
		}
	};
	global.Titanium = tiBinding.TitaniumModule;
	global.Ti = { Proxy: Proxy, API: kroll.binding('API').API };
	global.TestProxy = kroll.binding('ti.harness.TestProxy').TestProxy;
	global.IndexedProxy = kroll.binding('ti.harness.IndexedProxy').IndexedProxy;
	global.InterceptProxy = kroll.binding('ti.harness.InterceptProxy').InterceptProxy;
}))KERNEL";

const char bootstrap_native[] = "exports.bootstrapLoaded = true;";

struct _native {
	const char* name;
	const char* source;
	size_t source_length;
};

static const struct _native natives[] = {
	{ "bootstrap", bootstrap_native, sizeof(bootstrap_native) - 1 },
	{ "kroll", kroll_native, sizeof(kroll_native) - 1 },
	{ NULL, NULL, 0 } /* sentinel */
};

} // namespace titanium

#endif

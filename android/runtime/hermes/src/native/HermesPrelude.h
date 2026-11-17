/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef HERMES_PRELUDE_H
#define HERMES_PRELUDE_H

namespace titanium {

// JSI has no function templates, accessors, or interceptors. The runtime does these jobs with
// a few JS helper functions. The script evaluates to a function that returns the helper table.
// See RuntimeState in TiRuntime.h for the native side.
static const char kHermesPreludeName[] = "ti:/hermes-prelude.js";
static const char kHermesPreludeSource[] = R"TIPRELUDE((function () {
	'use strict';
	var defineProperty = Object.defineProperty;
	var getOwnPropertyNames = Object.getOwnPropertyNames;
	var hasOwn = Object.prototype.hasOwnProperty;
	var objectToString = Object.prototype.toString;
	var reflectGet = Reflect.get;
	var reflectSet = Reflect.set;

	// Key of the table that lists the native accessors of a proxy prototype.
	// The table of a child class inherits from the table of its parent class.
	var accessorsKey = Symbol('ti.accessors');
	// Key of the link from a proxy object to itself. An ES Proxy in front of it forwards the lookup.
	var backingKey = Symbol('ti.backing');

	function isIndex(key) {
		if (typeof key !== 'string' || key.length === 0 || key.length > 10) {
			return false;
		}
		var index = key >>> 0;
		return String(index) === key && index !== 4294967295;
	}

	return {
		backingKey: backingKey,

		// Hermes rejects "new" on a host function, so every constructor is a JS function.
		// "init" attaches the native state and returns the object that "new" must produce.
		makeConstructor: function (name, init) {
			var ctor = function () {
				return init(this, arguments);
			};
			defineProperty(ctor, 'name', { value: name, configurable: true });
			return ctor;
		},

		// Links a child prototype to its parent and gives it an own accessor table.
		setupPrototype: function (ctor, parentCtor) {
			var parentProto = parentCtor ? parentCtor.prototype : null;
			var proto = parentProto ? Object.create(parentProto) : {};
			defineProperty(proto, 'constructor', { value: ctor, writable: true, configurable: true });
			defineProperty(proto, accessorsKey, {
				value: Object.create(parentProto && parentProto[accessorsKey] ? parentProto[accessorsKey] : null)
			});
			ctor.prototype = proto;
			return proto;
		},

		defineNativeAccessor: function (proto, name, getter, setter) {
			var descriptor = { get: getter, enumerable: true, configurable: true };
			if (setter) {
				descriptor.set = setter;
			}
			defineProperty(proto, name, descriptor);
			proto[accessorsKey][name] = true;
		},

		defineConstant: function (target, name, value) {
			defineProperty(target, name, { value: value, enumerable: true });
		},

		// A plain assignment: an own data property that shadows an inherited accessor.
		defineOwn: function (target, name, value) {
			defineProperty(target, name, { value: value, writable: true, enumerable: true, configurable: true });
		},

		defineHidden: function (target, name, value) {
			defineProperty(target, name, { value: value, writable: true, configurable: true });
		},

		linkBacking: function (backing) {
			defineProperty(backing, backingKey, { value: backing });
		},

		// JSI has no indexed property handler and no named property interceptor. A proxy class that
		// needs one of them gives JS code an ES Proxy object in front of the real object.
		// No other proxy class uses an ES Proxy.
		makeTrappedWrapper: function (backing, getIndexed, setIndexed, intercept, dontIntercept) {
			var handler = {};
			handler.get = function (target, key, receiver) {
				if (getIndexed && isIndex(key)) {
					return getIndexed(target, key >>> 0);
				}
				if (intercept && typeof key === 'string') {
					var result = intercept(target, key);
					if (result !== dontIntercept) {
						return result;
					}
				}
				return reflectGet(target, key, receiver);
			};
			if (setIndexed) {
				handler.set = function (target, key, value, receiver) {
					if (isIndex(key)) {
						setIndexed(target, key >>> 0, value);
						return true;
					}
					return reflectSet(target, key, value, receiver);
				};
			}
			return new Proxy(backing, handler);
		},

		hasOwn: function (object, name) {
			return hasOwn.call(object, name);
		},

		objectKeys: Object.keys,

		isArguments: function (value) {
			return objectToString.call(value) === '[object Arguments]';
		},

		isDate: function (value) {
			return objectToString.call(value) === '[object Date]';
		},

		constructorName: function (value) {
			var ctor = value && value.constructor;
			return ctor && typeof ctor.name === 'string' ? ctor.name : '';
		},

		// A creation property that the proxy class knows goes into "_properties". Java already has
		// its value from the constructor arguments. Every other property is set on the proxy itself.
		applyCreationProperties: function (backing, source) {
			var names = getOwnPropertyNames(source);
			var accessors = backing[accessorsKey];
			var properties = backing._properties;
			for (var i = 0; i < names.length; i++) {
				var name = names[i];
				if ((accessors && accessors[name]) || hasOwn.call(backing, name)) {
					properties[name] = source[name];
				} else {
					backing[name] = source[name];
				}
			}
		},

		// Used when Java sets a property that the proxy class does not declare.
		defineDynamicProperty: function (backing, name, onChanged) {
			if (hasOwn.call(backing, name)) {
				return;
			}
			defineProperty(backing, name, {
				get: function () {
					return this.getProperty(name);
				},
				set: function (value) {
					onChanged(this, name, value);
				},
				enumerable: true,
				configurable: true
			});
		},

		makeDeferred: function () {
			var deferred = {};
			deferred.promise = new Promise(function (resolve, reject) {
				deferred.resolve = resolve;
				deferred.reject = reject;
			});
			return deferred;
		},

		// Returns the script URL of the first stack frame that is not in this file.
		currentSourceUrl: function () {
			var stack = String(new Error().stack || '').split('\n');
			for (var i = 1; i < stack.length; i++) {
				var match = /\(?([^()\s]+):\d+:\d+\)?\s*$/.exec(stack[i]);
				if (match && match[1].indexOf('hermes-prelude.js') === -1 && match[1] !== 'native') {
					return match[1];
				}
			}
			return null;
		},

		jsonStringify: function (value) {
			return JSON.stringify(value);
		}
	};
}))TIPRELUDE";

} // namespace titanium

#endif

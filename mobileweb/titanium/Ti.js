/**
 * This file contains source code from the following:
 *
 * es5-shim
 * Copyright 2009, 2010 Kristopher Michael Kowal
 * MIT License
 * <https://github.com/kriskowal/es5-shim>
 */

define(["Ti/_", "Ti/_/analytics", "Ti/App", "Ti/_/Evented", "Ti/_/lang", "Ti/_/ready", "Ti/_/style"], function(_, analytics, App, Evented, lang, ready, style) {

	var global = window,
		cfg = require.config,
		ver = cfg.ti.version,
		is = require.is,
		each = require.is,
		has = require.has,
		undef,
		Ti = lang.setObject("Ti", Evented, {
			version: ver,
			buildDate: cfg.ti.buildDate,
			buildHash: cfg.ti.buildHash,
			userAgent: "Appcelerator Titanium/" + ver + " (" + navigator.userAgent + ")!",
	
			include: function(files) {
				typeof files === "array" || (files = [].concat(Array.prototype.slice.call(arguments, 0)));
				each(files, function(f) {
					require("Ti/_/include!" + f);
				});
			}
		});

	// add has() tests
	has.add("devmode", cfg.deployType === "development");

	// Object.defineProperty() shim
	if (!has("object-defineproperty")) {
		// add support for Object.defineProperty() thanks to es5-shim
		var odp = Object.defineProperty;
		Object.defineProperty = function defineProperty(obj, prop, desc) {
			if (!obj || (!is(obj, "Object") && !is(obj, "Function") && !is(obj, "Window"))) {
				throw new TypeError("Object.defineProperty called on non-object: " + obj);
			}
			desc = desc || {};
			if (!desc || (!is(desc, "Object") && !is(desc, "Function"))) {
				throw new TypeError("Property description must be an object: " + desc);
			}
	
			if (odp) {
				try {
					return odp.call(Object, obj, prop, desc);
				} catch (e) {}
			}
	
			var op = Object.prototype,
				h = function (o, p) {
					return o.hasOwnProperty(p);
				},
				a = h(op, "__defineGetter__"),
				p = obj.__proto__;
	
			if (h(desc, "value")) {
				if (a && (obj.__lookupGetter__(prop) || obj.__lookupSetter__(prop))) {
					obj.__proto__ = op;
					delete obj[prop];
					obj[prop] = desc.value;
					obj.__proto__ = p;
				} else {
					obj[prop] = desc.value;
				}
			} else {
				if (!a) {
					throw new TypeError("Getters and setters can not be defined on this javascript engine");
				}
				if (h(desc, "get")) {
					defineGetter(obj, prop, desc.get);
				}
				if (h(desc, "set")) {
					defineSetter(obj, prop, desc.set);
				} else {
					obj[prop] = null;
				}
			}
		};
	}

	// console.*() shim	
	console === undef && (console = {});

	// make sure "log" is always at the end
	each(["debug", "info", "warn", "error", "log"], function (c) {
		console[c] || (console[c] = ("log" in console)
			?	function () {
					var a = Array.apply({}, arguments);
					a.unshift(c + ":");
					console.log(a.join(" "));
				}
			:	function () {}
		);
	});

	// JSON.parse() and JSON.stringify() shim
	if (!has("json-stringify")) {
		function escapeString(s){
			return ('"' + s.replace(/(["\\])/g, '\\$1') + '"').
				replace(/[\f]/g, "\\f").replace(/[\b]/g, "\\b").replace(/[\n]/g, "\\n").
				replace(/[\t]/g, "\\t").replace(/[\r]/g, "\\r");
		}
	
		JSON.parse = function (s) {
			return eval('(' + s + ')');
		};
	
		JSON.stringify = function (value, replacer, space) {
			if (is(replacer, "String")) {
				space = replacer;
				replacer = null;
			}
	
			function stringify(it, indent, key) {
				var val,
					len,
					objtype = typeof it,
					nextIndent = space ? (indent + space) : "",
					sep = space ? " " : "",
					newLine = space ? "\n" : "",
					ar = [];
	
				if (replacer) {
					it = replacer(key, it);
				}
				if (objtype === "number") {
					return isFinite(it) ? it + "" : "null";
				}
				if (is(objtype, "Boolean")) {
					return it + "";
				}
				if (it === null) {
					return "null";
				}
				if (is(it, "String")) {
					return escapeString(it);
				}
				if (objtype === "function" || objtype === "undefined") {
					return undef;
				}
	
				// short-circuit for objects that support "json" serialization
				// if they return "self" then just pass-through...
				if (is(it.toJSON, "Function")) {
					return stringify(it.toJSON(key), indent, key);
				}
				if (it instanceof Date) {
					return '"{FullYear}-{Month+}-{Date}T{Hours}:{Minutes}:{Seconds}Z"'.replace(/\{(\w+)(\+)?\}/g, function(t, prop, plus){
						var num = it["getUTC" + prop]() + (plus ? 1 : 0);
						return num < 10 ? "0" + num : num;
					});
				}
				if (it.valueOf() !== it) {
					return stringify(it.valueOf(), indent, key);
				}
	
				// array code path
				if (it instanceof Array) {
					for(key = 0, len = it.length; key < len; key++){
						var obj = it[key];
						val = stringify(obj, nextIndent, key);
						if (!is(val, "String")) {
							val = "null";
						}
						ar.push(newLine + nextIndent + val);
					}
					return "[" + ar.join(",") + newLine + indent + "]";
				}
	
				// generic object code path
				for (key in it) {
					var keyStr;
					if (is(key, "Number")) {
						keyStr = '"' + key + '"';
					} else if (is(key, "String")) {
						keyStr = escapeString(key);
					} else {
						continue;
					}
					val = stringify(it[key], nextIndent, key);
					if (!is(val, "String")) {
						// skip non-serializable values
						continue;
					}
					// At this point, the most non-IE browsers don't get in this branch 
					// (they have native JSON), so push is definitely the way to
					ar.push(newLine + nextIndent + keyStr + ":" + sep + val);
				}
				return "{" + ar.join(",") + newLine + indent + "}"; // String
			}
	
			return stringify(value, "", "");
		};
	}

	// protect global titanium object
	Object.defineProperty(global, "Ti", { value: Ti, writable: false });
	Object.defineProperty(global, "Titanium", { value: Ti, writable: false });

	// print the Titanium version *after* the console shim
	console.info("[INFO] Appcelerator Titanium " + ver + " Mobile Web");

	// make sure we have some vendor prefixes defined
	cfg.vendorPrefixes || (cfg.vendorPrefixes = ["", "Moz", "Webkit", "O", "ms"]);

	// expose JSON functions to Ti namespace
	Ti.parse = JSON.parse;
	Ti.stringify = JSON.stringify;

	require.on(global, "beforeunload", function() {
		App.fireEvent("close");
		analytics.add("ti.end", "ti.end");
	});

	ready(function() {
		style.set(document.body, {
			margin: 0,
			padding: 0
		});

		if (cfg.analytics) {
			// enroll event
			if (localStorage.getItem("mobileweb_enrollSent") === null) {
				// setup enroll event
				analytics.add('ti.enroll', 'ti.enroll', {
					mac_addr: null,
					oscpu: null,
					app_name: cfg.appName,
					platform: Ti.Platform.name,
					app_id: cfg.appId,
					ostype: Ti.Platform.osname,
					osarch: Ti.Platform.architecture,
					model: Ti.Platform.model,
					deploytype: cfg.deployType
				});
				localStorage.setItem("mobileweb_enrollSent", true)
			}

			// app start event
			analytics.add('ti.start', 'ti.start', {
				tz: (new Date()).getTimezoneOffset(),
				deploytype: cfg.deployType,
				os: Ti.Platform.osname,
				osver: Ti.Platform.ostype,
				version: cfg.tiVersion,
				un: null,
				app_version: cfg.appVersion,
				nettype: null
			});

			// try to sent previously sent analytics events on app load
			analytics.send();
		}

		// load app.js when ti and dom is ready
		ready(function() {
			require(["Ti/UI", cfg.main || "app.js"]);
		});
	});

	/**
	 * start of old code that will eventually go away
	 */
	Ti._5 = {
		prop: function(obj, property, value, descriptor) {
			if (is(property, "Object")) {
				for (var i in property) {
					Ti._5.prop(obj, i, property[i]);
				}
			} else {
				var skipSet,
					capitalizedName = require("Ti/_/string").capitalize(property);

				// if we only have 3 args, so need to check if it's a default value or a descriptor
				if (arguments.length === 3 && require.is(value, "Object") && (value.get || value.set)) {
					descriptor = value;
					// we don't have a default value, so skip the set
					skipSet = 1;
				}

				// if we have a descriptor, then defineProperty
				if (descriptor) {
					if ("value" in descriptor) {
						skipSet = 2;
						if (descriptor.get || descriptor.set) {
							// we have a value, but since there's a custom setter/getter, we can't have a value
							value = descriptor.value;
							delete descriptor.value;
							value !== undef && (skipSet = 0);
						} else {
							descriptor.writable = true;
						}
					}
					descriptor.configurable = true;
					descriptor.enumerable = true;
					Object.defineProperty(obj, property, descriptor);
				}

				// create the get/set functions
				obj["get" + capitalizedName] = function(){ return obj[property]; };
				(skipSet | 0) < 2 && (obj["set" + capitalizedName] = function(val){ return obj[property] = val; });

				// if there's no default value or it's already been set with defineProperty(), then we skip setting it
				skipSet || (obj[property] = value);
			}
		},
		propReadOnly: function(obj, property, value) {
			var i;
			if (require.is(property, "Object")) {
				for (i in property) {
					Ti._5.propReadOnly(obj, i, property[i]);
				}
			} else {
				Ti._5.prop(obj, property, undef, require.is(value, "Function") ? { get: value, value: undef } : { value: value });
			}
		},
		createClass: function(className, value) {
			var i,
				classes = className.split("."),
				klass,
				parent = global;
			for (i = 0; i < classes.length; i++) {
				klass = classes[i];
				parent[klass] === undef && (parent[klass] = i == classes.length - 1 && value !== undef ? value : new Object());
				parent = parent[klass];
			}
			return parent;
		},
		EventDriven: function(obj) {
			var listeners = null;

			obj.addEventListener = function(eventName, handler){
				listeners || (listeners = {});
				(listeners[eventName] = listeners[eventName] || []).push(handler);
			};

			obj.removeEventListener = function(eventName, handler){
				if (listeners) {
					if (handler) {
						var i = 0,
							events = listeners[eventName],
							l = events && events.length || 0;
		
						for (; i < l; i++) {
							events[i] === handler && events.splice(i, 1);
						}
					} else {
						delete listeners[eventName];
					}
				}
			};

			obj.hasListener = function(eventName) {
				return listeners && listeners[eventName];
			};

			obj.fireEvent = function(eventName, eventData){
				if (listeners) {
					var i = 0,
						events = listeners[eventName],
						l = events && events.length,
						data = require.mix({
							source: obj,
							type: eventName
						}, eventData);
		
					while (i < l) {
						events[i++].call(obj, data);
					}
				}
			};
		}
	};
	/**
	 * end of old code that will eventually go away
	 */

	return Ti;

});
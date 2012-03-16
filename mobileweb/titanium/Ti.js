/**
 * This file contains source code from the following:
 *
 * es5-shim
 * Copyright 2009, 2010 Kristopher Michael Kowal
 * MIT License
 * <https://github.com/kriskowal/es5-shim>
 *
 * Dojo Toolkit
 * Copyright (c) 2005-2011, The Dojo Foundation
 * New BSD License
 * <http://dojotoolkit.org>
 */

define(
	["Ti/_", "Ti/_/analytics", "Ti/App", "Ti/_/Evented", "Ti/_/lang", "Ti/_/ready", "Ti/_/style", "Ti/Buffer", "Ti/Platform", "Ti/Locale", "Ti/_/include"],
	function(_, analytics, App, Evented, lang, ready, style, Buffer, Platform) {

	var global = window,
		cfg = require.config,
		ver = cfg.ti.version,
		is = require.is,
		each = require.each,
		has = require.has,
		undef,
		Ti = lang.setObject("Ti", Evented, {
			constants: {
				buildDate: cfg.ti.buildDate,
				buildHash: cfg.ti.buildHash,
				version: ver
			},

			properties: {
				userAgent: "Appcelerator Titanium/" + ver + " (" + navigator.userAgent + ")!"
			},

			createBuffer: function(args) {
				return new Buffer(args);
			},

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

	if (!has("js-btoa")) {
		var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
			fromCharCode = String.fromCharCode;

		global.btoa = function(bytes) {
			var ascii = [],
				chr1, chr2, chr3,
				enc1, enc2, enc3, enc4,
				i = 0,
				len = bytes.length;

			while (i < len) {
				chr1 = bytes.charCodeAt(i++);
				chr2 = bytes.charCodeAt(i++);
				chr3 = bytes.charCodeAt(i++);

				enc1 = chr1 >> 2;
				enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
				enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
				enc4 = chr3 & 63;

				if (isNaN(chr2)) {
					enc3 = enc4 = 64;
				} else if (isNaN(chr3)) {
					enc4 = 64;
				}

				ascii.push(tab.charAt(enc1) + tab.charAt(enc2) + tab.charAt(enc3) + tab.charAt(enc4));
			}

			return ascii.join('');
		};

		global.atob = function(ascii) {
			var bytes = [],
				enc1, enc2, enc3, enc4,
				i = 0,
				len = ascii.length;

			ascii = ascii.replace(/[^A-Za-z0-9\+\/\=]/g, "");

			while (i < len) {
				enc1 = tab.indexOf(ascii.charAt(i++));
				enc2 = tab.indexOf(ascii.charAt(i++));
				enc3 = tab.indexOf(ascii.charAt(i++));
				enc4 = tab.indexOf(ascii.charAt(i++));

				bytes.push(fromCharCode((enc1 << 2) | (enc2 >> 4)));

				enc3 !== 64 && bytes.push(fromCharCode(((enc2 & 15) << 4) | (enc3 >> 2)));
				enc4 !== 64 && bytes.push(fromCharCode(((enc3 & 3) << 6) | enc4));
			}

			return bytes.join('');
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

		if (cfg.app.analytics) {
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
				os: Platform.osname,
				osver: Platform.ostype,
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
			require(cfg.main || ["app.js"]);
		});
	});

	return Ti;

});
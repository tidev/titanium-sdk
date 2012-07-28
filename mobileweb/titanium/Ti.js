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
	["Ti/_", "Ti/API", "Ti/_/analytics", "Ti/App", "Ti/_/Evented", "Ti/_/has", "Ti/_/lang", "Ti/_/ready", "Ti/_/style", "Ti/Buffer", "Ti/Platform", "Ti/UI", "Ti/Locale", "Ti/_/include"],
	function(_, API, analytics, App, Evented, has, lang, ready, style, Buffer, Platform, UI) {

	var global = window,
		req = require,
		cfg = req.config,
		deployType = App.deployType,
		ver = cfg.ti.version,
		is = req.is,
		on = req.on,
		loaded,
		unloaded,
		showingError,
		waiting = [],
		Ti = lang.setObject("Ti", Evented, {
			constants: {
				buildDate: cfg.ti.buildDate,
				buildHash: cfg.ti.buildHash,
				version: ver
			},

			properties: {
				userAgent: function() {
					return navigator.userAgent;
				}
			},

			createBuffer: function(args) {
				return new Buffer(args);
			},

			include: function(files) {
				typeof files === "array" || (files = [].concat(Array.prototype.slice.call(arguments, 0)));
				files.forEach(function(f) {
					require("Ti/_/include!" + f);
				});
			},

			deferStart: function() {
				if (loaded) {
					API.warn("app.js already loaded!");
				} else {
					var n = Math.round(Math.random()*1e12);
					waiting.push(n);
					return function() {
						var p = waiting.indexOf(n);
						~p && waiting.splice(p, 1);
						loaded = 1;
						if (!waiting.length) {
							has("ti-instrumentation") && instrumentation.stopTest(instrumentation.systemLoadTimeTest);
							require(cfg.main || ["app.js"]);
						}
					};
				}
			}
		}),
		loadAppjs = Ti.deferStart();

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
					return void 0;
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

	API.info("Appcelerator Titanium " + ver + " Mobile Web");

	// make sure we have some vendor prefixes defined
	cfg.vendorPrefixes || (cfg.vendorPrefixes = ["", "Moz", "Webkit", "O", "ms"]);

	// expose JSON functions to Ti namespace
	Ti.parse = JSON.parse;
	Ti.stringify = JSON.stringify;

	function shutdown() {
		if (!unloaded) {
			unloaded = 1;
			App.fireEvent("close");
			analytics.add("ti.end", "ti.end");
		}
	}

	on(global, "beforeunload", shutdown);
	on(global, "unload", shutdown);

	if (has("ti-show-errors")) {
		on(global, "error", function(e) {
			if (!showingError) {
				showingError = 1;

				var f = e.filename || "",
					match = f.match(/:\/\/.+(\/.*)/),
					filename = match ? match[1] : e.filename,
					line = e.lineno,
					win = UI.createWindow({
						backgroundColor: "#f00",
						top: "100%",
						height: "100%",
						layout: UI._LAYOUT_CONSTRAINING_VERTICAL
					}),
					view,
					button;

				function makeLabel(text, height, color, fontSize) {
					win.add(UI.createLabel({
						color: color,
						font: { fontSize: fontSize, fontWeight: "bold" },
						height: height,
						left: 10,
						right: 10,
						textAlign: UI.TEXT_ALIGNMENT_CENTER,
						text: text
					}));
				}

				makeLabel("Application Error", "15%", "#0f0", "24pt");
				makeLabel((e.message || "Unknown error").trim() + (filename && filename !== "undefined" ? " at " + filename : "") + (line ? " (line " + line + ")" : ""), "45%", "#fff", "16pt");

				win.add(view = UI.createView({ height: "12%" }));
				view.add(button = UI.createButton({ title: "Dismiss" }));
				win.addEventListener("close", function() { win.destroy(); });
				button.addEventListener("singletap", function() {
					win.animate({
						duration: 500,
						top: "100%"
					}, function() {
						win.close();
						showingError = 0;
					});
				});

				makeLabel("Error messages will only be displayed during development. When your app is packaged for final distribution, no error screen will appear. Test your code!", "28%", "#000", "10pt");
				
				on.once(win,"postlayout", function() {
					setTimeout(function() {
						win.animate({
							duration: 500,
							top: 0
						}, function() {
							win.top = 0;
							win.height = "100%";
						});
					}, 100);
				});
				
				win.open();
			}
		});
	}

	ready(function() {
		style.set(document.body, {
			margin: 0,
			padding: 0
		});

		if (App.analytics) {
			// enroll event
			if (localStorage.getItem("ti:enrolled") === null) {
				// setup enroll event
				analytics.add("ti.enroll", "ti.enroll", {
					app_name: App.name,
					oscpu: 1,
					mac_addr: null,
					deploytype: deployType,
					ostype: Platform.osname,
					osarch: null,
					app_id: App.id,
					platform: Platform.name,
					model: Platform.model
				});
				localStorage.setItem("ti:enrolled", true)
			}

			// app start event
			analytics.add("ti.start", "ti.start", {
				tz: (new Date).getTimezoneOffset(),
				deploytype: deployType,
				os: Platform.osname,
				osver: Platform.ostype,
				version: cfg.ti.version,
				platform: Platform.name,
				model: Platform.model,
				un: null,
				app_version: App.version,
				nettype: null
			});

			// try to sent previously sent analytics events on app load
			analytics.send();
		}

		// load app.js when ti and dom is ready
		setTimeout(loadAppjs, 1);
	});

	return Ti;

});
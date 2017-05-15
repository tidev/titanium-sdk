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

	// protect global titanium object
	Object.defineProperty(global, "Ti", { value: Ti, writable: false });
	Object.defineProperty(global, "Titanium", { value: Ti, writable: false });

	API.info("Appcelerator Titanium " + ver + " Mobile Web");

	// make sure we have some vendor prefixes defined
	cfg.vendorPrefixes || (cfg.vendorPrefixes = ["", "Moz", "Webkit", "O", "ms"]);

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
			return true;
		});
	}

	ready(function() {
		style.set(document.body, {
			margin: 0,
			padding: 0
		});

		if (App.analytics) {
			var analyticsPlatformName = require.config.ti.analyticsPlatformName;

			// enroll event
			if (localStorage.getItem("ti:enrolled") === null) {
				// setup enroll event
				analytics.add("ti.enroll", "ti.enroll", {
					app_name: App.name,
					app_version: App.version,
					oscpu: 1,
					mac_addr: null,
					deploytype: deployType,
					ostype: Platform.osname,
					osarch: null,
					app_id: App.id,
					platform: analyticsPlatformName,
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
				platform: analyticsPlatformName,
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

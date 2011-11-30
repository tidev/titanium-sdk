function($window, args){
	function is(it, type) {
		return ({}).toString.call(it).indexOf('[object ' + type) === 0;
	}

	function each(a, fn) {
		var i = 0,
			l = (a && a.length) || 0,
			args = Array.prototype.slice.call(arguments, 0);
		args.shift();
		while (i < l) {
			args[0] = a[i++];
			fn.apply(null, args);
		}
	}

	// Object.defineProperty() shim
	if (!Object.defineProperty || !(function (obj) {
			try {
				Object.defineProperty(obj, "x", {});
				return obj.hasOwnProperty("x");
			} catch (e) { }
		}({}))) {
		// add support for Object.defineProperty() thanks to es5-shim
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
				} catch (e) { }
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
	typeof console !== "undefined" || (console = {});

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
	if (typeof JSON === "undefined" || JSON.stringify({a:0}, function(k,v){return v||1;}) !== '{"a":1}') {
		function escapeString(s){
			return ('"' + s.replace(/(["\\])/g, '\\$1') + '"').
				replace(/[\f]/g, "\\f").replace(/[\b]/g, "\\b").replace(/[\n]/g, "\\n").
				replace(/[\t]/g, "\\t").replace(/[\r]/g, "\\r");
		}
	
		JSON.parse = function (s) {
			return eval('(' + s + ')');
		};
	
		JSON.stringify = function (value, replacer, space) {
			var undef;
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

	console.info("[INFO] Appcelerator Titanium " + (args['tiVersion'] || "") + " for Mobile Web");

	var Ti = {};
	$window.Titanium = Ti; $window.Ti = Ti;

	Ti._5 = {};
	var loaded = false;
	var loaders = [];

	// public function for onload notification
	$window.onloaded = function(f){
		onload(f);
	};

	// private function
	function onload(f) {
		if (loaded) {
			f();
		} else {
			loaders.push(f);
		}
	}

	function beforeonload() {
		document.body.style.margin = "0";
		document.body.style.padding = "0";
		$window.scrollTo(0, 1);
	}

	function afteronload() {
	}

	// TODO use DOMContentLoaded event instead
	$window.onload = function() {
		loaded = true;
		beforeonload();
		for (var c=0 ; c < loaders.length; c++) {
			loaders[c]();
		}
		loaders = null;
		afteronload();
	};

	$window.onbeforeunload = function() {
		Ti.App.fireEvent('close');
		Ti._5.addAnalyticsEvent('ti.end', 'ti.end');

	};

	// run onload
	Ti._5.run = function(app) {
		onload(app);
	};

	Ti._5.preset = function(obj, props, values){
		if(!values || !obj || !props){
			return;
		}

		for(var ii = 0; ii < props.length; ii++){
			var prop = props[ii];
			if(typeof values[prop] != 'undefined'){
				obj[prop] = values[prop];
			}
		}
	};

	Ti._5.presetUserDefinedElements = function(obj, args){
		if(!args){
			return;
		}

		for(prop in args){
			if(typeof obj[prop] == 'undefined'){
				obj[prop] = args[prop];
			}
		}
	};
	
	Ti._5.presetUserArguments = function(obj,args) {
		if(!args){
			return;
		}

		for(prop in args){
			obj[prop] = args[prop];
		}
	}

	Ti._5.createClass = function(className, value){
		var classes = className.split(".");
		var parent = window;
		for(var ii = 0; ii < classes.length; ii++){
			var klass = classes[ii];
			if(typeof parent[klass] == 'undefined'){
				parent[klass] = ii == classes.length - 1 && typeof value != 'undefined' ? value : new Object();
			}
			parent = parent[klass];
		}
		return parent;
	};

	// do some actions when framework is loaded
	Ti._5.frameworkLoaded = function(){
		if(args.appAnalytics === 'true'){
			// enroll event
			if(localStorage.getItem("html5_enrollSent") == null){
				// setup enroll event
				Ti._5.addAnalyticsEvent('ti.enroll', 'ti.enroll', {
					mac_addr: null,
					oscpu: null,
					app_name: args.appName,
					platform: Ti.Platform.name,
					app_id: args.appId,
					ostype: Ti.Platform.osname,
					osarch: Ti.Platform.architecture,
					model: Ti.Platform.model,
					deploytype: args.deployType
				});
				localStorage.setItem("html5_enrollSent", true)
			}

			// app start event
			Ti._5.addAnalyticsEvent('ti.start', 'ti.start', {
				tz: (new Date()).getTimezoneOffset(),
				deploytype: args.deployType,
				os: Ti.Platform.osname,
				osver: Ti.Platform.ostype,
				version: args.tiVersion,
				un: null,
				app_version: args.appVersion,
				nettype: null
			});

			// try to sent previously sent analytics events on app load
			Ti._5.sendAnalytics();
		}

		Ti.UI.createWindow({
			title: args.projectName
		}).open();
	};

	Ti._5.getAbsolutePath = function(path){
		if(path.indexOf("app://") == 0){
			path = path.substring(6);
		}

		if(path.charAt(0) == "/"){
			path = path.substring(1);
		}

		if(path.indexOf("://") >= 0){
			return path;
		} else {
			return location.pathname.replace(/(.*)\/.*/, "$1") + "/" + path;
		}
	};

	Ti._5.parseLength = function(val){
		return val + (typeof val == 'number' ? 'px' : '');
	};

	if(typeof Object.defineProperty == 'undefined'){
		// trying to emulate missing defineProperty
		try{
			Object.defineProperty = function(obj, prop, desc){
				if(obj == null || prop == null){
					throw "Object.defineProperty: object and property name are required parameters";
				}
				if(desc == null){
					desc = {};
				}

				if(desc.set){
					obj.__defineSetter__(prop, desc.set);
				}
				if(desc.get && desc.writable !== false){
					obj.__defineGetter__(prop, desc.get);
				}
			};
		} catch(e){
			console.error(e);
		}
	}

		Ti._5.parseLength = function(val){
		return val + (typeof val == 'number' ? 'px' : '');
	};

	Ti._5.createUUID = function(){
		/*!
		Math.uuid.js (v1.4)
		http://www.broofa.com
		mailto:robert@broofa.com

		Copyright (c) 2010 Robert Kieffer
		Dual licensed under the MIT and GPL licenses.
		*/
		// RFC4122v4 solution:
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		}).toUpperCase();
	};

	Ti._5.getArguments = function(){
		return args;
	};

	var _sessionId = sessionStorage.getItem('html5_sessionId');
	if(_sessionId == null){
		_sessionId = Ti._5.createUUID();
		sessionStorage.setItem('html5_sessionId', _sessionId);
	}

	var ANALYTICS_STORAGE = "html5_analyticsEvents";
	Ti._5.addAnalyticsEvent = function(eventType, eventEvent, data, isUrgent){
		if(args.appAnalytics !== 'true'){
			return;
		}
		// store event
		var storage = localStorage.getItem(ANALYTICS_STORAGE);
		if(storage == null){
			storage = [];
		} else {
			storage = JSON.parse(storage);
		}
		var now = new Date();
		var ts = "yyyy-MM-dd'T'HH:mm:ss.SSSZ".replace(/\w+/g, function(str){
			switch(str){
				case "yyyy":
					return now.getFullYear();
				case "MM":
					return now.getMonth() + 1;
				case "dd":
					return now.getDate();
				case "HH":
					return now.getHours();
				case "mm":
					return now.getMinutes();
				case "ss":
					return now.getSeconds();
				case "SSSZ":
					var tz = now.getTimezoneOffset();
					var atz = Math.abs(tz);
					tz = (tz < 0 ? "-" : "+") + (atz < 100 ? "00" : (atz < 1000 ? "0" : "")) + atz;
					return now.getMilliseconds() + tz;
				default:
					return str;
			}
		});
		var formatZeros = function(v, n){
			var d = (v+'').length;
			return (d < n ? (new Array(++n - d)).join("0") : "") + v;
		};

		storage.push({
			eventId: Ti._5.createUUID(),
			eventType: eventType,
			eventEvent: eventEvent,
			eventTimestamp: ts,
			eventPayload: data
		});
		localStorage.setItem(ANALYTICS_STORAGE, JSON.stringify(storage));
		Ti._5.sendAnalytics(isUrgent);
	};

	var ANALYTICS_WAIT = 300000; // 5 minutes
	var _analyticsLastSent = null;
	var eventSeq = 1;

	// collect and send Ti.Analytics notifications
	Ti._5.sendAnalytics = function(isUrgent){
		if(args.appAnalytics !== 'true'){
			return;
		}
		// store event
		var storage = localStorage.getItem(ANALYTICS_STORAGE);
		if(storage == null){
			return;
		} else {
			storage = JSON.parse(storage);
		}

		var now = (new Date()).getTime();

		if(isUrgent !== true && _analyticsLastSent != null && now - _analyticsLastSent < ANALYTICS_WAIT){
			return;
		}

		var jsonStrs = [];
		var ids = [];

		for(var ii = 0; ii < storage.length; ii++){
			var ev = storage[ii];
			ids.push(ev.eventId);
			var res = {
				seq: eventSeq++,
				ver: '2',
				id: ev.eventId,
				type: ev.eventType,
				event: ev.eventEvent,
				ts: ev.eventTimestamp,
				mid: Ti.Platform.id,
				sid: _sessionId,
				aguid: args.guid,
				data: typeof ev.eventPayload == 'object' ? JSON.stringify(ev.eventPayload) : ev.eventPayload
			};

			jsonStrs.push(JSON.stringify(res));
		}

		var iframe = document.createElement("iframe");
		iframe.style.display = 'none';
		iframe.id = "analytics" + Math.random();
		var form = document.createElement("form");
		form.style.display = 'none';
		form.target = iframe.id;
		form.method = 'POST';
		var fname = "html5_jsonp"+Math.floor(Math.random() * 1e6);
		form.action = 'https://api.appcelerator.net/p/v2/mobile-track?callback=' + fname;
		document.body.appendChild(iframe);
		document.body.appendChild(form);
		var hidden = document.createElement("input");
		hidden.type = 'hidden';
		hidden.name = 'content';
		hidden.value = jsonStrs.join("\n");
		form.appendChild(hidden);
		$window[fname] = function(response){
			if(response && response.success){
				// remove sent events on successful sent
				var storage = localStorage.getItem(ANALYTICS_STORAGE);
				var evs = [];
				for(var ii = 0; ii < storage.length; ii++){
					var ev = storage[ii];
					var found = false;
					for(var jj = 0; jj < ids.length; jj++){
						if(ev.eventId == ids[jj]){
							found = true;
							ids.splice(jj, 1);
							break;
						}
					}

					if(!found){
						evs.push(ev);
					}
				}

				localStorage.setItem(ANALYTICS_STORAGE, JSON.stringify(evs));
				document.body.removeChild(form);
				document.body.removeChild(iframe);
			}
		};
		form.submit();
	};

	Ti._5.extend = function(dest, source){
		for(var key in source){
			dest[key] = source[key];
		}

		return dest;
	};

	var _localeData = {};
	Ti._5.setLocaleData = function(obj){
		_localeData = obj;
	};
	Ti._5.getLocaleData = function(){
		return _localeData;
	};

	// Get browser window sizes
	Ti._5.getWindowSizes = function() {
		var winW = 630, winH = 460;
		if (document.body && document.body.offsetWidth) {
			winW = document.body.offsetWidth;
			winH = document.body.offsetHeight;
		}
		if (
			document.compatMode=='CSS1Compat' &&
			document.documentElement &&
			document.documentElement.offsetWidth
		) {
			winW = document.documentElement.offsetWidth;
			winH = document.documentElement.offsetHeight;
		}
		if (window.innerWidth && window.innerHeight) {
			winW = window.innerWidth;
			winH = window.innerHeight;
		}
		return {
			width: parseInt(winW),
			height: parseInt(winH)
		}
	};

	var _loadedScripts = {};
	Ti._5.getS = function(){
		return _loadedScripts;
	}
	Ti._5.setLoadedScripts = function(scripts){
		if(scripts == null){
			return;
		}

		for(var key in scripts){
			Ti._5.addLoadedScript(key, scripts[key]);
		}
	};

	Ti._5.addLoadedScript = function(path, content){
		path = Ti._5.getAbsolutePath(path);
		_loadedScripts[path] = content;
	};

	Ti._5.getLoadedScript = function(path){
		path = Ti._5.getAbsolutePath(path);
		return _loadedScripts[path];
	};

	Ti._5.execLoadedScript = function(path){
		var code = Ti._5.getLoadedScript(path);
		if(typeof code == 'undefined'){
			return;
		}

		var head = document.getElementsByTagName('head')[0];
		if(head == null){
			head = document;
		}
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.innerHTML = code;
		head.appendChild(script);
	};
}

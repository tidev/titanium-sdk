define("Ti/Network/HTTPClient", ["Ti/_/Evented"], function(Evented) {

	Ti._5.createClass("Ti.Network.HTTPClient", function(args){
	
		var undef,
			obj = this,
			enc = encodeURIComponent,
			is = require.is,
			on = require.on,
			xhr = new XMLHttpRequest,
			UNSENT = 0,
			OPENED = 1,
			HEADERS_RECEIVED = 2,
			LOADING = 3,
			DONE = 4,
			_readyState = UNSENT, // unsent
			_completed, // This completed stuff is a hack to get around a non-obvious bug.
			timeoutTimer;
		
		Ti._5.EventDriven(obj);
		
		function fireStateChange() {
			is(obj.onreadystatechange, "Function") && obj.onreadystatechange.call(obj);
		}

		function serialize(obj) {
			var pairs = [],
				prop,
				value;

			for (prop in obj) {
				if (obj.hasOwnProperty(prop)) {
					is(value = obj[prop], "Array") || (value = [value]);
					prop = enc(prop) + "=";
					require.each(value, function(v) {
						pairs.push(prop + enc(v));
					});
				}
			}

			return pairs.join("&");
		}

		xhr.onreadystatechange = function() {
			switch (xhr.readyState) {
				case 0: _readyState = UNSENT; break;
				case 1: _readyState = OPENED; break;
				case 2: _readyState = LOADING; break;
				case 3: _readyState = HEADERS_RECEIVED; break;
				case 4:
					clearTimeout(timeoutTimer);
					_completed = true;
					_readyState = DONE;
					if (xhr.status == 200) {
						obj.responseText = xhr.responseText;
						obj.responseXML = xhr.responseXML;
						obj.responseData = xhr.responseHeader;
						is(obj.onload, "Function") && obj.onload.call(obj);
					} else {
						xhr.status / 100 | 0 > 3 && onerror();
					}
			}
			fireStateChange();
		};
	
		function onerror(error) {
			obj.abort();
			is(error, "Object") || (error = { message: error });
			error.error || (error.error = error.message || xhr.status);
			parseInt(error.error) || (error.error = "Can't reach host");
			is(obj.onerror, "Function") && obj.onerror.call(obj, error);
		}
	
		on(xhr, "error", onerror);
		on(xhr.upload, "error", onerror);
	
		function onprogress(evt) {
			evt.progress = evt.lengthComputable ? evt.loaded / evt.total : false;
			is(obj.onsendstream, "Function") && obj.onsendstream.call(obj, evt);
		}
	
		on(xhr, "progress", onprogress);
		on(xhr.upload, "progress", onprogress);
	
		// Properties
		Ti._5.propReadOnly(obj, {
			UNSENT: UNSENT,
			OPENED: OPENED,
			HEADERS_RECEIVED: HEADERS_RECEIVED,
			LOADING: LOADING,
			DONE: DONE,
			connected: function() { return _readyState >= OPENED; },
			readyState: function() { return _readyState; },
			status: function() { return xhr.status; }
		});
	
		Ti._5.prop(obj, {
			connectionType: undef,
			file: undef,
			location: undef,
			ondatastream: undef,
			onerror: undef,
			onload: undef,
			onreadystatechange: undef,
			onsendstream: undef,
			responseData: "",
			responseText: "",
			responseXML: "",
			timeout: undef,
			validatesSecureCertificate: false
		});
	
		require.mix(obj, args);
	
		// Methods
		obj.abort = function() {
			obj.responseText = obj.responseXML = obj.responseData = "";
			_completed = true;
			clearTimeout(timeoutTimer);
			obj.connected && xhr.abort();
			_readyState = UNSENT;
			fireStateChange();
		};
	
		obj.getResponseHeader = function(name) {
			return xhr.readyState === 2 ? xhr.getResponseHeader(name) : null;
		};
	
		obj.open = function(method, url, async) {
			var httpURLFormatter = Ti.Network.httpURLFormatter;
			obj.abort();
			xhr.open(
				obj.connectionType = method,
				obj.location = require("Ti/_").getAbsolutePath(httpURLFormatter ? httpURLFormatter(url) : url),
				!!async
			);
			xhr.setRequestHeader("UserAgent", Ti.userAgent);
		};
	
		obj.send = function(args){
			_completed = false;
			try {
				args = is(args, "Object") ? serialize(args) : args;
				args && xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
				xhr.send(args);
				clearTimeout(timeoutTimer);
				obj.timeout && (timeoutTimer = setTimeout(function() {
					if (obj.connected) {
						obj.abort();
						!_completed && onerror("Request timed out");
					}
				}, obj.timeout));
			} catch (error) {
				onerror(error);
			}
		};
	
		obj.setRequestHeader = function(label,value) {
			xhr.setRequestHeader(label,value);
		};
	});


});
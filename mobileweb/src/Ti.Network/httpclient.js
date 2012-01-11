Ti._5.createClass("Ti.Network.HTTPClient", function(args){
	var obj = this,
		on = require.on,
		xhr = new XMLHttpRequest(),
		requestComplete = false,
		_callErrorFunc = function(error) {
			obj.responseText = obj.responseXML = obj.responseData = "";
			require.is(error, "Object") || (error = { message: error });
			error.error || (error.error = error.message ? error.message : xhr.status);
			parseInt(error.error) || (error.error = "Can`t reach host");
			require.is(obj.onerror, "Function") && obj.onerror(error);
		};

	//xhr.overrideMimeType("text/xml");
	xhr.timeout = 60000; // Default timeout = 1 minute
	xhr.ontimeout = function(error) {
		_callErrorFunc(error);
	};
	xhr.onreadystatechange = function() {
		require.is(obj.onreadystatechange, "Function") && obj.onreadystatechange();
		if (xhr.readyState == 4) {
			if (xhr.status == 200) {
				obj.connected = true;
				obj.responseText = xhr.responseText;
				obj.responseXML = xhr.responseXML;
				obj.responseData = xhr.responceHeader;
				require.is(obj.onload, "Function") && obj.onload();
			} else {
				obj.connected = false;
			}
			requestComplete = true;
		}
	};
	on(xhr, "error", function(error) {
		_callErrorFunc(error);
	});
	on(xhr.upload, "error", function(error) {
		_callErrorFunc(error);
	});
	on(xhr, "progress", function(evt) {
		evt.progress = evt.lengthComputable ? evt.loaded / evt.total : false;
		require.is(obj.onsendstream, "Function") && obj.onsendstream(evt);
	});
	on(xhr.upload, "progress", function(evt) {
		evt.progress = evt.lengthComputable ? evt.loaded / evt.total : false;
		require.is(obj.onsendstream, "Function") && obj.onsendstream(evt);
	});

	// Properties
	Ti._5.prop(obj, {
		DONE: function() {return _xml.DONE;},
		HEADERS_RECEIVED: function(){return _xml.HEADERS_RECEIVED;},
		LOADING: function(){return _xml.LOADING;},
		OPENED: function(){return _xml.OPENED;},
		UNSENT: function(){return _xml.UNSENT;},
		readyState: function() { return xhr.readyState; },
		status: function() { return xhr.status; }
	});

	Ti._5.prop(obj, {
		connected: false,
		connectionType: null,
		file: null,
		location: null,
		ondatastream: null,
		onerror: null,
		onload: null,
		onreadystatechange: null,
		onsendstream: null,
		responseData: null,
		responseText: null,
		responseXML: null,
		timeout: {
			get: function() {return xhr.timeout;},
			set: function(val) {xhr.timeout = val;}
		},
		validatesSecureCertificate: false
	});

	// Methods
	obj.abort = function() {
		xhr.abort();
	};
	obj.getResponseHeader = function(name) {
		return xhr.readyState === 2 ? xhr.getResponseHeader(name) : null;
	};
	obj.open = function(method, url, async) {
		var u,
			httpURLFormatter = Ti.Network.httpURLFormatter;

		httpURLFormatter && (url = httpURLFormatter(url));

		requestComplete = false;
		obj.connectionType = method;
		obj.location = Ti._5.getAbsolutePath(url);
		async === u && (async = true);

		xhr.open(obj.connectionType, obj.location, async);
		xhr.setRequestHeader("UserAgent", Ti.userAgent);
		//xhr.setRequestHeader("Access-Control-Allow-Origin", "*");
		//xhr.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
	};
	obj.send = function(args){
		requestComplete = false;
		obj.responseText = "";
		obj.responseXML = "";
		obj.responseData = "";
		try {
			xhr.send(args || null);
		} catch (error) {
			_callErrorFunc(error);
		}
	};
	obj.setRequestHeader = function(label,value) {
		xhr.setRequestHeader(label,value);
	};
	obj.setTimeout = function(timeout) {
		if ("undefined" == typeof timeout) {
			timeout = _timeout;
		}
		setTimeout(function(){
			if (!requestComplete){
				xhr.abort();
				_callErrorFunc("Request was aborted");
			}
		}, timeout);
	};
});

<%!
	def jsQuoteEscapeFilter(str):
		return str.replace("\"","\\\"")
%>
Ti._5.createClass('Titanium.Network.HTTPClient', function(args){
	var obj = this;
	// Interfaces
	var _xhr = new XMLHttpRequest(); 
	//_xhr.overrideMimeType('text/xml');
	var _requestComplete = false;
	
	var _callErrorFunc = function(error) {
		obj.responseText = '';
		obj.responseXML = '';
		obj.responseData = '';
		if ('object' != typeof error) {
			error = {message : error};
		}
		if (!error.error) {
			error.error = error.message ? error.message : _xhr.status;
		}
		if (0 == parseInt(error.error)) {
			error.error = "Can`t reach host";
		}
		if ('function' == typeof obj.onerror) {
			obj.onerror(error);
		}
	};
	_xhr.ontimeout = function(error) {
		_callErrorFunc(error);
	};
	_xhr.onreadystatechange = function() {
		if ('function' == typeof obj.onreadystatechange) {
			obj.onreadystatechange();
		}
		if (_xhr.readyState == 4) {
			if (_xhr.status == 200) {
				obj.connected = true;
				obj.responseText = _xhr.responseText;
				obj.responseXML = _xhr.responseXML;
				obj.responseData = _xhr.responceHeader;
				if ('function' == typeof obj.onload) {
					obj.onload();
				}
			} else {
				obj.connected = false;
			}
			_requestComplete = true;
		}
	};
	//*
	_xhr.addEventListener("error", function(error) {
		_callErrorFunc(error);
	}, false);
	/*
	_xhr.upload.addEventListener("error", function(error) {
		_callErrorFunc(error);
	});
	//*/
	_xhr.addEventListener("progress", function(evt) {
		if (evt.lengthComputable) {
			evt.progress = evt.loaded / evt.total;
		} else {
			// Unable to compute progress information since the total size is unknown
			evt.progress = false;
		}
		if ('function' == typeof obj.onsendstream) {
			obj.ondatastream(evt);
		}
	}, false);
	_xhr.upload.addEventListener("progress", function(evt) {
		if (evt.lengthComputable) {
			evt.progress = evt.loaded / evt.total;
		} else {
			// Unable to compute progress information since the total size is unknown
			evt.progress = false;
		}
		if ('function' == typeof obj.onsendstream) {
			obj.onsendstream(evt);
		}
	}, false);
	
	// Properties
	Ti._5.prop(this, 'DONE', {
		get: function() {return _xml.DONE;}
	});

	Ti._5.prop(this, 'HEADERS_RECEIVED', {
		get: function(){return _xml.HEADERS_RECEIVED;}
	});

	Ti._5.prop(this, 'LOADING', {
		get: function(){return _xml.LOADING;}
	});

	Ti._5.prop(this, 'OPENED', {
		get: function(){return _xml.OPENED;}
	});

	Ti._5.prop(this, 'UNSENT', {
		get: function(){return _xml.UNSENT;}
	});

	Ti._5.prop(this, 'connected', false);

	Ti._5.prop(this, 'connectionType');

	Ti._5.prop(this, 'file');

	Ti._5.prop(this, 'location');

	Ti._5.prop(this, 'ondatastream');

	Ti._5.prop(this, 'onerror');

	Ti._5.prop(this, 'onload');

	Ti._5.prop(this, 'onreadystatechange');

	Ti._5.prop(this, 'onsendstream');

	Ti._5.prop(this, 'readyState', {
		get: function() { return _xhr.readyState; }
	});

	Ti._5.prop(this, 'responseData');

	Ti._5.prop(this, 'responseText');

	Ti._5.prop(this, 'responseXML');

	Ti._5.prop(this, 'status', {
		get: function() { return _xhr.status; }
	});

	_xhr.timeout = 60000; // Default timeout = 1 minute
	Ti._5.prop(this, 'timeout', {
		get: function() {return _xhr.timeout;},
		set: function(val) {return _xhr.timeout = val;}
	});

	Ti._5.prop(this, 'validatesSecureCertificate', false);

	// Methods
	this.abort = function() {
		_xhr.abort();
	};
	this.getResponseHeader = function(name) {
		if (2 != _xhr.readyState) {
			return null;
		} else {
			return _xhr.getResponseHeader(name);
		}
	};
	this.open = function(method, url, async) {
		
		var httpURLFormatter = Ti.Network.httpURLFormatter;
		httpURLFormatter && (url = httpURLFormatter(url));
		
		_requestComplete = false;
		obj.connectionType = method;
		obj.location = Ti._5.getAbsolutePath(url);
		if ('undefined' == typeof async) {
			async = true;
		}
		_xhr.open(obj.connectionType,obj.location,async);
		//_xhr.setRequestHeader("UserAgent","Appcelerator Titanium/${ti_version | jsQuoteEscapeFilter} ("+navigator.userAgent+")");
		//_xhr.setRequestHeader("Access-Control-Allow-Origin","*");
		//_xhr.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
	};
	this.send = function(args){
		_requestComplete = false;
		obj.responseText = '';
		obj.responseXML = '';
		obj.responseData = '';
		try {
			_xhr.send(args ? args : null);
		} catch (error) {
			_callErrorFunc(error);
		}
	};
	this.setRequestHeader = function(label,value) {
		_xhr.setRequestHeader(label,value);
	};
	this.setTimeout = function(timeout) {
		if ('undefined' == typeof timeout) {
			timeout = _timeout;
		}
		setTimeout(function(){
			if (!_requestComplete){
				_xhr.abort();
				_callErrorFunc("Request was aborted");
			}
		}, timeout);
	};
});

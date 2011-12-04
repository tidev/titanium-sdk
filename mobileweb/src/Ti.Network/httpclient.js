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
		_responseText = '';
		_responseXML = '';
		_responseData = '';
		if ('object' != typeof error) {
			error = {message : error};
		}
		if (!error.error) {
			error.error = error.message ? error.message : _xhr.status;
		}
		if (0 == parseInt(error.error)) {
			error.error = "Can`t reach host";
		}
		if ('function' == typeof _onerror) {
			_onerror(error);
		}
	};
	_xhr.ontimeout = function(error) {
		_callErrorFunc(error);
	};
	_xhr.onreadystatechange = function() {
		if ('function' == typeof _onreadystatechange) {
			_onreadystatechange();
		}
		if (_xhr.readyState == 4) {
			if (_xhr.status == 200) {
				_connected = true;
				_responseText = _xhr.responseText;
				_responseXML = _xhr.responseXML;
				_responseData = _xhr.responceHeader;
				if ('function' == typeof _onload) {
					_onload();
				}
			} else {
				_connected = false;
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
		if ('function' == typeof _onsendstream) {
			_ondatastream(evt);
		}
	}, false);
	_xhr.upload.addEventListener("progress", function(evt) {
		if (evt.lengthComputable) {
			evt.progress = evt.loaded / evt.total;
		} else {
			// Unable to compute progress information since the total size is unknown
			evt.progress = false;
		}
		if ('function' == typeof _onsendstream) {
			_onsendstream(evt);
		}
	}, false);
	
	// Properties
	Object.defineProperty(this, 'DONE', {
		get: function() {return _xml.DONE;},
		set: function(val) { ; /* Do nothing  */ }
	});

	Object.defineProperty(this, 'HEADERS_RECEIVED', {
		get: function(){return _xml.HEADERS_RECEIVED;},
		set: function(val) { ; /* Do nothing  */ }
	});

	Object.defineProperty(this, 'LOADING', {
		get: function(){return _xml.LOADING;},
		set: function(val) { ; /* Do nothing  */ }
	});

	Object.defineProperty(this, 'OPENED', {
		get: function(){return _xml.OPENED;},
		set: function(val) { ; /* Do nothing  */ }
	});

	Object.defineProperty(this, 'UNSENT', {
		get: function(){return _xml.UNSENT;},
		_set: function(val) { ; /* Do nothing  */ }
	});

	var _connected = false;
	Object.defineProperty(this, 'connected', {
		get: function() {return _connected;},
		set: function(val) {return _connected = val;}
	});

	var _connectionType = null;
	Object.defineProperty(this, 'connectionType', {
		get: function() {return _connectionType;},
		set: function(val) {return _connectionType = val;}
	});

	var _file = null;
	Object.defineProperty(this, 'file', { 
		get: function() {return _file;},
		set: function(val) {return _file = val;}
	});

	var _location = null;
	Object.defineProperty(this, 'location', {
		get: function(){return _location;},
		set: function(val){return _location = val;}
	});

	var _ondatastream = null;
	Object.defineProperty(this, 'ondatastream', {
		get: function() {return _ondatastream;},
		set: function(val) {return _ondatastream = val;}
	});

	var _onerror = null;
	Object.defineProperty(this, 'onerror', {
		get: function() {return _onerror;},
		set: function(val) {return _onerror = val;}
	});

	var _onload = null;
	Object.defineProperty(this, 'onload', {
		get: function() {return _onload;},
		set: function(val) {return _onload = val;}
	});

	var _onreadystatechange = null;
	Object.defineProperty(this, 'onreadystatechange', {
		get: function() {return _onreadystatechange;},
		set: function(val) {return _onreadystatechange = val;}
	});

	var _onsendstream = null;
	Object.defineProperty(this, 'onsendstream', {
		get: function() {return _onsendstream;},
		set: function(val) {return _onsendstream = val;}
	});

	Object.defineProperty(this, 'readyState', {
		get: function()  {return _xhr.readyState;},
		set: function(val) {return false;}
	});

	var _responseHeader = null;
	Object.defineProperty(this, 'responseData', {
		get: function(){return _responseHeader;},
		set: function(val){return _responseHeader = val;}
	});

	var _responseText = null;
	Object.defineProperty(this, 'responseText', {
		get: function() {return _responseText;},
		set: function(val) {return _responseText = val;}
	});

	var _responseXML = null;
	Object.defineProperty(this, 'responseXML', {
		get: function() {return _responseXML;},
		set: function(val) {return _responseXML = val;}
	});

	Object.defineProperty(this, 'status', {
		get: function() {return _xhr.status;},
		set: function(val) {return false;}
	});

	_xhr.timeout = 60000; // Default timeout = 1 minute
	Object.defineProperty(this, 'timeout', {
		get: function() {return _xhr.timeout;},
		set: function(val) {return _xhr.timeout = val;}
	});

	var _validatesSecureCertificate = false; 
	Object.defineProperty(this, 'validatesSecureCertificate', {
		get: function() {return _validatesSecureCertificate;},
		set: function(val) {return _validatesSecureCertificate = val;}
	});

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
		_connectionType = method;
		_location = Ti._5.getAbsolutePath(url);
		if ('undefined' == typeof async) {
			async = true;
		}
		_xhr.open(_connectionType,_location,async);
		//_xhr.setRequestHeader("UserAgent","Appcelerator Titanium/${ti_version | jsQuoteEscapeFilter} ("+navigator.userAgent+")");
		//_xhr.setRequestHeader("Access-Control-Allow-Origin","*");
		//_xhr.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
	};
	this.send = function(args){
		_requestComplete = false;
		_responseText = '';
		_responseXML = '';
		_responseData = '';
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

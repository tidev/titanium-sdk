/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

Titanium.networkProxy = window.TitaniumNetwork;
//Titanium.Net is aliased at the bottom for Titanium.Network

var HTTPClient = function() {
	this.obj; // reference to java TitaniumHttpClient
	this._onreadystatechange;
	this._onload

	/**
	 * @tiapi(method=true,name=Network.HTTPClient.getReadyState,since=0.4) the state of the network operation
	 * @tiresult[int] current operation state
	 */
	this.getReadyState = function() {
		return this.obj.getReadyState();
	};

	/**
	 * @tiapi(method=true,name=Network.HTTPClient.getResponseText,since=0.4) The response of an HTTP request as text
	 * @tiresult[string] the response text
	 */
	this.getResponseText = function() {
		return this.obj.getResponseText();
	};

	/**
	 * @tiapi(method=true,name=Network.HTTPClient.getStatus,since=0.4) The response status code of an HTTP request
	 * @tiresult[int] the response status code.
	 */
	this.getStatus = function() {
		return this.obj.getStatus();
	};

	/**
	 * @tiapi(method=true,name=Network.HTTPClient.getStatusText,since=0.4) The response status text of an HTTP Request
	 * @tiresult[string] the response string
	 */
	this.getStatusText = function() {
		return this.obj.getStatusText();
	};

	/**
	 * @tiapi(method=true,name=Network.HTTPClient.abort,since=0.4) Aborts an in progress connection
	 */
	this.abort = function() {
		this.obj.abort();
	};

	/**
	 * @tiapi(method=true,name=Network.HTTPClient.getAllResponseHeaders,since=0.4) get all response headers
	 * @tiresult[list] headers
	 */
	this.getAllResponseHeaders = function() {
		return this.obj.getAllResponseHeaders();
	};

	/**
	 * @tiapi(method=true,name=Network.HTTPClient.getResponseHeader,since=0.4) Get the value of a response header
	 * @tiarg[string,header] Name of header value to retrieve
	 * @tiresult[string] the value
	 */
	this.getResponseHeader = function(header) {
		return this.obj.getResponseHeader(header);
	};

	/**
	 * @tiapi(method=true,name=Network.HTTPClient.open,since=0.4) open an HTTP connection
	 * @tiarg[string,method] HTTP method (GET, POST, HEAD)
	 * @tiarg[string,url] Url to perform method on
	 */
	this.open = function(method, url) {
		this.obj.open(method, url); // Don't currently support other args
	};

	/**
	 * @tiapi(method=true,name=Network.HTTPClient.send,since=0.4) Send data through the HTTP connection
	 * @tiarg[string,data,optional=true] zero or more data segments to transmit.
	 */
	this.send = function() {
		for(i=0; i < arguments.length; i++) {
			d = arguments[i];
			if (typeof d == 'object') {
				for(key in d) {
					value = d[key];
					type = typeof value;
					if (type != 'object') {
						this.obj.addPostData(key, String(value));
					} else if (type.indexOf('TitaniumBlob') != -1) {
						Titanium.API.error("send: typeof=" + typeof value);
						this.obj.addTitaniumFileAsPostData(key, value.obj.proxy);
					} else {
						this.obj.addTitaniumFileAsPostData(key, value.proxy);
					}
				}
			} else {
				this.obj.addStringData(String(d));
			}
		}
		this.obj.send();
	};
	/**
	 * @tiapi(method=true,name=Network.HTTPClient.setRequestHeader,since=0.4) Set a request header for the connection
	 * @tiarg[string,name] header name
	 * @tiarg[string,value] value to associate with header
	 */
	this.setRequestHeader = function(name,value) {
		this.obj.setRequestHeader(name,value);
	};

	/**
	 * @tiapi(method=true,name=Network.HTTPClient.setOnReadyStateChange,since=0.4) Set a function to be called when the ready state changes
	 * @tiapi same as onreadystatechange property
	 * @tiarg[function,f] callback for ready state change events.
	 */
	this.setOnReadyStateChange = function(f) {
		_onreadystatechange = f;
		this.obj.setOnReadyStateChangeCallback(registerCallback(this, f));
	};
};

/**
 * @tiapi(property=true,name=Network.HTTPClient.onreadystatechange,since=0.4) Set or get the ready stage change handler
 */
HTTPClient.prototype.__defineGetter__("onreadystatechange", function(){
	return this._onreadystatechange
});
HTTPClient.prototype.__defineSetter__("onreadystatechange", function(f) {
	this.setOnReadyStateChange(f);
});
/**
 * @tiapi(property=true,name=Network.HTTPClient.onload,since=0.6.3) Set or get the onload handler.
 */
HTTPClient.prototype.__defineGetter__("onload", function(){
	return this._onload
});
HTTPClient.prototype.__defineSetter__("onload", function(f) {
	this._onload = f;
	this.obj.setOnLoadCallback(registerCallback(this, f));
});
/**
 * @tiapi(property=true,name=Network.HTTPClient.readyState,since=0.4) Get the current ready state
 * @tiresult[int] the current ready state
 */
HTTPClient.prototype.__defineGetter__("readyState", function(){
	return this.getReadyState();
});
/**
 * @tiapi(property=true,name=Network.HTTPClient.responseText,since=0.4) Get the text response from the operation
 * @tiresult[string] the response
 */
HTTPClient.prototype.__defineGetter__("responseText", function(){
	return this.getResponseText();
});
/**
 * @tiapi(property=true,name=Network.HTTPClient.responseText,since=0.6.3) Get the response as XML from the operation
 * @tiresult[object] the response
 */
HTTPClient.prototype.__defineGetter__('responseXML',function(){
	return new DOMParser().parseFromString(this.getResponseText(),'text/xml');
});

/**
 * @tiapi(property=true,name=Network.HTTPClient.status,since=0.4) Get the status code of the request
 * @tiresult[int] the status code
 */
HTTPClient.prototype.__defineGetter__("status", function(){
	return this.getStatus();
});
/**
 * @tiapi(property=true,name=Network.HTTPClient.statusText,since=0.4) Get the status text of the request
 * @tiresult[string] the status text
 */
HTTPClient.prototype.__defineGetter__("statusText", function(){
	return this.getStatusText();
});

Titanium.Network = {
	createTCPSocket : function() {
		//TODO implement Network.createTCPSocket
	},
	createIRCClient : function() {
		//TODO implement Network.IRCClient
	},
	createIPAddress : function() {
		//TODO implement Network.createIPAddress
	},
	/**
	 * @tiapi(method=true,name=Network.createHTTPClient,since=0.4) Create an HTTPClient object
	 * @tiresult[HTTPClient] the HTTP client
	 */
	createHTTPClient : function() {
		var c = new HTTPClient();
		c.obj = Titanium.networkProxy.createHTTPClient();
		return c;
	},
	getHostByName : function() {
		//TODO implement Network.getHostByName
	},
	getHostByAddress : function() {
		//TODO implement Network.getHostByAddress
	},
	/**
	 * @tiapi(method=true,name=Network.encodeURIComponent,since=0.4) URL Encode
	 * @tiarg[string,fragment] URL fragment to encode
	 * @tiresult[string] the encoded fragment
	 */
	encodeURIComponent : function(x) {
		return window.encodeURIComponent(x);
	},
	/**
	 * @tiapi(method=true,name=Network.decodeURIComponent,since=0.4) URL Decode
	 * @tiarg[string,fragment] The fragment to URL decode
	 * @tiresult[string] the decoded fragment.
	 */
	decodeURIComponent : function(x) {
		return window.decodeURIComponent(x);
	},
	/**
	 * @tiapi(method=true,name=Network.addEventListener,since=0.4) Register an event handler for connectivity events.
	 * @tiarg[string, eventName] Must be 'connectivity'. Only event currently supported
	 * @tiarg[function, listener] function to recieve notification of network connectivity changes.
	 * @tiresult[int] an id used to remove the event listener.
	 */
	addEventListener : function(eventName, listener) {
		return Titanium.networkProxy.addEventListener(eventName, registerCallback(this, listener));
	},
	/**
	 * @tiapi(method=true,name=Network.removeEventListener,since=0.4)
	 * @tiarg[string,eventName] The event name use to register for an event.
	 * @tiarg[int,listenerId] The id returned by addEventListener
	 */
	removeEventListener : function(eventName, listenerId) {
		Titanium.networkProxy.removeEventListener(eventName, listenerId);
	},
	/**
	 * @tiapi(method=true,name=Network.addConnectivityListener,since=0.4) Not supported in android. Use addEventListener
	 * @tiresult[]
	 */
	addConnectivityListener : function(f) {
		var fn = function(data) {
			f(data.online,data.type);
		};
		return Titanium.networkProxy.addConnectivityListener(registerCallback(this, fn));
	},
	/**
	 * @tiapi(method=true,name=Network.removeConnectivityListener,since=0.4) Not supported in android. Use removeEventListener
	 * @tiresult[]
	 */
	removeConnectivityListener : function(id) {
		return removeEventListener('connectivity', id);
	},

	/**
	 * @tiapi(property=true,name=Network.NETWORK_NONE,since=0.4) No network connection
	 * @tiresult[int] returns 0
	 */
	NETWORK_NONE: 0,
	/**
	 * @tiapi(property=true,name=Network.NETWORK_WIFI,since=0.4) The network connection is WIFI
	 * @tiresult[int] returns 1
	 */
	NETWORK_WIFI: 1,
	/**
	 * @tiapi(property=true,name=Network.NETWORK_MOBILE,since=0.4) The network connection is Mobile
	 * @tiresult[int] returns 2
	 */
	NETWORK_MOBILE: 2,
	/**
	 * @tiapi(property=true,name=Network.NETWORK_LAN,since=0.4) The network connection is a LAN
	 * @tiresult[int] returns 3
	 */
	NETWORK_LAN: 3,
	/**
	 * @tiapi(property=true,name=Network.NETWORK_UNKNOWN,since=0.4) The network type is unknown.
	 * @tiresult[int] returns 4
	 */
	NETWORK_UNKNOWN: 4
};

/**
 * @tiapi(property=true,name=Network.online,since=0.4) Examine connectivity state
 * @tiresult[boolean] true, if the device has a network connection; otherwise, false.
 */
Titanium.Network.__defineGetter__("online", function() {
	return Titanium.networkProxy.isOnline();
});
/**
 * @tiapi(property=true,name=Network.networkTypeName,since=0.4) The current network connection type.
 * @tiresult[string] The network type
 */
Titanium.Network.__defineGetter__("networkTypeName", function() {
	return Titanium.networkProxy.getNetworkTypeName();
});

/**
 * @tiapi(property=true,name=Network.networkType,since=0.4) The current network connection type.
 * @tiresult[int] A code representing the current network connection type
 */
Titanium.Network.__defineGetter__("networkType", function() {
	return Titanium.networkProxy.getNetworkType();
});

// alias this to what's in Desktop
Titanium.Net = Titanium.Network;

// patch the internal XMLHttpRequest object to use our network client instead
// this fixes apps that would like to use Ajax-libraries like jQuery, YUI, etc.
window.XMLHttpRequest = function() {
	return new Titanium.Network.createHTTPClient()
};

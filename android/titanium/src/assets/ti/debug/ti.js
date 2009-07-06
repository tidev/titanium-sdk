/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var Titanium = new function() {
	this.platform = 'android';
	this.version = 'TI_VERSION';  // this is build driven
	this.window = window;
	this.document = document;
	this.callbacks = new Array();

	//TODO: hide these once we map them
	this.apiProxy = window.TitaniumAPI;

	this.rethrow = function(e) { throw e; }

	this.doPostProcessing = function () {
		var imgs = document.getElementsByTagName('img');
		for(i=0; i < imgs.length;i++) {
			var s = imgs[i].src;
			//alert('BEFORE: ' + s);
			if (s.indexOf('file:///') == 0) {
				if (s.indexOf('file:///sdcard/') == -1 && s.indexOf('file:///android_asset') == -1) {
					imgs[i].src = s.substring(8);
				}
			} else if (s.indexOf('app://') == 0) {
				imgs[i].src = s.substring(6);
			}

			//alert('AFTER: ' + imgs[i].src);
		};
	}
};

function TitaniumCallback(obj, method) {
	this.obj = obj;
	this.method = method;
	this.invoke = function (data)
	{
		method.call(obj,data);
	};
};

function registerCallback(o, f) {
	var i = Titanium.callbacks.length;
	Titanium.callbacks[i] = new TitaniumCallback(o,f);
	return "Titanium.callbacks[" + i + "]"; // Don't pass javascript: native layer will prepend as needed
};

//this is a special androidized bridge conversion routine
//to determine if the thing passed is really undefined
function isUndefined(value)
{
	if (value === null || typeof(value)==='undefined')
	{
		return true;
	}
	return (typeof(value)=='object' && String(value).length === 0);
}

function typeOf(value) {
    var s = typeof value;
    if (s === 'object') {
        if (value) {
            if (value instanceof Array) {
                s = 'array';
            }
        } else {
            s = 'null';
        }
    }
    return s;
}

function transformObjectValue(value,def)
{
	if (isUndefined(value)) return def;
	return value;
}

// Logging should always be available
Titanium.API = {
	/*
	 * @tiapi(method=True,name=API.log,since=0.4) log data to the console.
	 * @tiarg[int,severity] Severity code from FATAL down to TRACE
	 * @tiarg[string,msg] Message to send to the console
	 */
	log: function(severity,msg)
	{
		Titanium.apiProxy.log(severity,msg);
	},
	/**
	 * @tiapi(method=True,name=API.debug,since=0.4) log data at the DEBUG level.
	 * @tiarg[string,msg] Message to send to the console.
	 */
	debug: function(msg)
	{
		this.log(this.DEBUG,msg);
	},
	/**
	 * @tiapi(method=True,name=API.error,since=0.4) log data at the ERROR level.
	 * @tiarg[string,msg] Message to send to the console.
	 */
	error: function(msg)
	{
		this.log(this.ERROR,msg);
	},
	/**
	 * @tiapi(method=True,name=API.warn,since=0.4) log data at the WARN level.
	 * @tiarg[string,msg] Message to send to the console.
	 */
	warn: function(msg)
	{
		this.log(this.WARN,msg);
	},
	/**
	 * @tiapi(method=True,name=API.info,since=0.4) log data at the INFO level.
	 * @tiarg[string,msg] Message to send to the console.
	 */
	info: function(msg)
	{
		this.log(this.INFO,msg);
	},
	/**
	 * @tiapi(method=True,name=API.trace,since=0.4) log data at the TRACE level.
	 * @tiarg[string,msg] Message to send to the console.
	 */
	trace: function(msg)
	{
		this.log(this.TRACE,msg);
	},
	/**
	 * @tiapi(method=True,name=API.notice,since=0.4) log data at the NOTICE level.
	 * @tiarg[string,msg] Message to send to the console.
	 */
	notice: function(msg)
	{
		this.log(this.NOTICE,msg);
	},
	/**
	 * @tiapi(method=True,name=API.critical,since=0.4) log data at the CRITICAL level.
	 * @tiarg[string,msg] Message to send to the console.
	 */
	critical: function(msg)
	{
		this.log(this.CRITICAL,msg);
	},
	/**
	 * @tiapi(method=True,name=API.fatal,since=0.4) log data at the FATAL level.
	 * @tiarg[string,msg] Message to send to the console.
	 */
	fatal: function(msg)
	{
		this.log(this.FATAL,msg);
	},
	TRACE: 1,
	DEBUG: 2,
	INFO: 3,
	NOTICE: 4,
	WARN: 5,
	ERROR: 6,
	CRITICAL: 7,
	FATAL: 8
};

Titanium.Process = {
	getEnv : function() {
		//TODO implement Process.getEnv
	},
	setEnv : function() {
		//TODO implement Process.setEnv
	},
	hasEnv : function() {
		//TODO implement Process.hasEnv
	},
	launch : function() {
		//TODO implement Process.launch
	}
};




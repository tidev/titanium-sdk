/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

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

var Titanium = new function() {
	/*
	 * @tiapi(method=False,property=True,name=platform,since=0.4,type=string) titanium platform name property
	 */
	this.platform = 'android';
	/*
	 * @tiapi(method=False,property=True,name=version,since=0.4,type=string) titanium platform version property
	 */
	this.version = 'TI_VERSION';  // this is build driven
	this.window = window;
	this.document = document;

	//TODO: hide these once we map them
	this.apiProxy = window.TitaniumAPI;

	this.rethrow = function(e) { throw e; };

	this.checked = function(r) {
		if (!isUndefined(r)) {
			if (typeof(r.getException) !== 'undefined') {
				this.apiProxy.log(6,"checking: " + r.getException());
				if(!isUndefined(r.getException())) {
					throw r.getException();
				} else {
					if (typeof(r.getResult) !== 'undefined') {
						r = r.getResult();
					}
				}
			}
		}
		return r;
	};

	this.doPostProcessing = function () {
		var imgs = document.getElementsByTagName('img');
		for(i=0; i < imgs.length;i++) {
			var s = imgs[i].src;
			//alert('BEFORE: ' + s);
			if (s.indexOf('file:///') === 0) {
				if (s.indexOf('file:///sdcard/') == -1 && s.indexOf('file:///android_asset') == -1) {
					imgs[i].src = s.substring(8);
				}
			} else if (s.indexOf('app://') === 0) {
				imgs[i].src = s.substring(6);
			}

			//alert('AFTER: ' + imgs[i].src);
		}

		document.addEventListener('DOMSubtreeModified', function(e) {
			Titanium.apiProxy.invalidateLayout();
		});
	};

	this.getPosition = function(obj) {
        var pos = { top: 0, left: 0, width: 0, height: 0 };
        if (!isUndefined(obj)) {
	        pos.width = obj.offsetWidth;
	        pos.height = obj.offsetHeight;
		    while(obj){
	            pos.left+= obj.offsetLeft;
	            pos.top+= obj.offsetTop;
	            obj= obj.offsetParent;
		    }
        }
	    return pos;
	};

	this.sendLayoutToNative = function(ids) {
		var positions = {};

		for(i=0; i < ids.length; i++) {
			var id = ids[i];
			var o = document.getElementById(id);
			positions[id] = this.getPosition(o);
		}

		this.apiProxy.updateNativeControls(Titanium.JSON.stringify(positions));
	};

	this.callbackCounter = 0;
	this.callbacks = {};

	this.nextCallbackId = function() {
		return 'cb' + this.callbackCounter++;
	};

	this.addCallback = function(o,f,os) {
		var cb = new TitaniumCallback(o, f, os);
		return (new TitaniumCallback(o, f, os)).register();
	};
	this.removeCallback = function(name) {
		delete this.callbacks[name];
		Titanium.API.debug('Deleted callback with name: ' + name);
	};

	this.getObjectReference = function(key) {
		return this.apiProxy.getObjectReference(key);
	};

	this.getTitaniumMemoryBlobLength = function(key) {
		return this.apiProxy.getTitaniumMemoryBlobLength(key);
	};
};

function TitaniumCallback(obj, method, oneShot) {
	this.name = Titanium.nextCallbackId();
	this.obj = obj;
	this.method = method;
	this.oneShot = oneShot;
	this.invoke = function (data, syncId)
	{
		if(!isUndefined(this.method)) {
			this.method.call(this.obj,data);
			if (!isUndefined(syncId)) {
				Titanium.apiProxy.signal(syncId);
			}
			if (oneShot) {
				Titanium.removeCallback(this.name);
			}
		} else {
			Titanium.API.warn("Expected a valid callback, callback not set");
		}
	};
	this.register = function() {
		Titanium.callbacks[this.name] = this;
		return 'Titanium.callbacks["' + this.name + '"]'; // Don't pass javascript: native layer will prepend as needed
	};
}

function registerCallback(o, f) {
	return Titanium.addCallback(o, f, false);
}

function registerOneShot(o, f) {
	return Titanium.addCallback(o, f, true);
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
	return isUndefined(value) ? def : value;
}

function transformObjectValueAsString(value,def)
{
	return isUndefined(value) ? def : String(value);
}

function transformObjectValueAsInt(value,def)
{
	return isUndefined(value) ? def : parseInt(value,10);
}

function transformObjectValueAsBool(value,def)
{
	return isUndefined(value) ? def : !!value;
}

function transformObjectValueAsDouble(value,def)
{
	return isUndefined(value) ? def : parseFloat(value);
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

var TitaniumMemoryBlob = function(key) {
	this._key = key;
	this._ref = Titanium.getObjectReference(key); // get the native reference for tracking.

	this.getLength = function() {
		return Titanium.getTitaniumMemoryBlobLength(this._key);
	};
	this.getKey = function() {
		return this._key;
	};
};
TitaniumMemoryBlob.prototype.__defineGetter__("length", function(){
	return this.getLength();
});


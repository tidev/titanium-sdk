/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

//this is a special androidized bridge conversion routine
//to determine if the thing passed is really undefined

function transformObjectValue(value,def)
{
	return Ti.isUndefined(value) ? def : value;
}

function transformObjectValueAsString(value,def)
{
	return Ti.isUndefined(value) ? def : String(value);
}

function transformObjectValueAsInt(value,def)
{
	return Ti.isUndefined(value) ? def : parseInt(value,10);
}

function transformObjectValueAsBool(value,def)
{
	return Ti.isUndefined(value) ? def : !!value;
}

function transformObjectValueAsDouble(value,def)
{
	return Ti.isUndefined(value) ? def : parseFloat(value);
}

var Ti = new function() {
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

	this.apiProxy = window.TitaniumAPI;

	this.isUndefined = function(value)
	{
		if (value === null || typeof(value)==='undefined')
		{
			return true;
		}
		return (typeof(value)=='object' && String(value).length === 0);
	};

	this.typeOf = function(value) {
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
	};

	this.Method = {
		caller : this.apiProxy.acquireMethod(),
		dispatchWithTypes : function(name, method, types, args) {
			// force to JS String, boosts performance.
			var r = eval("("+String(this.caller.call(Ti.JSON.stringify({ name : name, method : method, types : types, args : args})))+")");
			if (r.exception !== undefined) {
				throw r.exception;
			}
			Ti.apiProxy.log(2, "Name: " + name + " Method: " + method + "Result Type: " + r.resultType + " Result: " + r.result);
			switch(r.resultType) {
			case 'null' : return null;
			case 'string' : return r.result;
			case 'integer' : return parseInt(r.result,10);
			case 'boolean' : return !!r.result;
			case 'double' : return parseFloat(r.result);
			default : return r.result;
			}

		},
		dispatch : function(name, method) {
			var args = [];
			var types = [];

			for(var i = 2; i < arguments.length; i++) {
				var a = arguments[i];
				if (a === undefined) {
					a = null;
				}
				args.push(a);
				if (a === null) {
					types.push("null");
				} else if (typeof a == 'string') {
					types.push("string");
				} else if (typeof a == 'number') {
					if (String(a).indexOf(".") === -1) {
						types.push("integer");
					} else {
						types.push("double");
					}
				} else if (typeof a == "object") {
					if (a.constructor.name == "Array") {
						types.push("array");
					} else {
						types.push("object");
					}
				} else {
					throw "Unknown argument type " + typeof a;
				}
			}
			return this.dispatchWithTypes(name, method, types, args);
		},
		dispatchWithArguments : function(name, method, args) {
			var argList = [name,method];
			for(var i = 0; i < args.length; i++) {
				argList.push(args[i]);
			}
			return Ti.Method.dispatch.apply(this, argList);
		}
	};

	this.rethrow = function(e) { throw e; };

	this.checked = function(r) {
		var v = null;
		if (!this.isUndefined(r)) {
			if (typeof(r.getException) !== 'undefined') {
				if(!this.isUndefined(r.getException())) {
					this.apiProxy.log(6,"checking: " + r.getException());
					var e = r.getException();
					r.destroy();
					r = null;
					throw e;
				} else {
					if (typeof(r.getResult) !== 'undefined') {
						var v = r.getResult();
						//this.apiProxy.log(6,"TYPE: " + r.getType());
						switch(String(r.getType())) {
							case 'string' : v = transformObjectValueAsString(v); break;
							case 'int' : v = transformObjectValueAsInt(v.intValue()); break;
							case 'boolean' : v = transformObjectValueAsBool(v.booleanValue()); break;
							case 'double' : v = transformObjectValueAsDouble(v.doubleValue()); break;
						}
					}
					r.destroy(); // cleanup native
					r = null;
				}
			}
		}
		return v;
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
			Ti.apiProxy.invalidateLayout();
		});
	};

	this.getPosition = function(obj) {
        var pos = { top: 0, left: 0, width: 0, height: 0 };
        if (!this.isUndefined(obj)) {
	        pos.width = obj.offsetWidth;
	        pos.height = obj.offsetHeight;
		    while(obj){
	            pos.left+= obj.offsetLeft;
	            pos.top+= obj.offsetTop;
	            obj= obj.offsetParent;
		    }
		    //Ti.API.debug("COORDS: " + pos.left + " " + pos.top + " " + pos.width + " " + pos.height);
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

		this.apiProxy.updateNativeControls(Ti.JSON.stringify(positions));
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
		Ti.API.debug('Deleted callback with name: ' + name);
	};

	this.getObjectReference = function(key) {
		return this.apiProxy.getObjectReference(key);
	};

	this.getTitaniumMemoryBlobLength = function(key) {
		return this.apiProxy.getTitaniumMemoryBlobLength(key);
	};

	this.getTitaniumMemoryBlobString = function(key) {
		return this.apiProxy.getTitaniumMemoryBlobString(key);
	};

	this.DateFormatter = {
		pad : function(n) {
	    	return (n < 10 ? "0" : "") + String(n);
	  	},
	  	formatUTC : function(d) {
	  		/* format to yyyy-MM-dd'T'HH:mm:ss.SSSZ to be consistent with mobile's UTC timestamp strings */
	  		return [
	  		    d.getUTCFullYear() , '-',
	  		    this.pad(1 + d.getUTCMonth()), '-',
	  		    this.pad(d.getUTCDate()),
	  		    'T',
	  		    this.pad(d.getUTCHours()) ,':',
	  		    this.pad(d.getUTCMinutes()), ':',
	  		    this.pad(d.getUTCSeconds()),'+0000'
	  		].join("");
	  }
	};
};

var Titanium = Ti;

function TitaniumCallback(obj, method, oneShot) {
	this.name = Ti.nextCallbackId();
	this.obj = obj;
	this.method = method;
	this.oneShot = oneShot;
	this.invoke = function (data, syncId)
	{
		if(!Ti.isUndefined(this.method)) {
			this.method.call(this.obj,data);
			if (!Ti.isUndefined(syncId)) {
				Ti.apiProxy.signal(syncId);
			}
			if (oneShot) {
				Ti.removeCallback(this.name);
			}
		} else {
			Ti.API.warn("Expected a valid callback, callback not set");
		}
	};
	this.register = function() {
		Ti.callbacks[this.name] = this;
		return 'Titanium.callbacks["' + this.name + '"]'; // Don't pass javascript: native layer will prepend as needed
	};
}

function registerCallback(o, f) {
	return Ti.addCallback(o, f, false);
}

function registerOneShot(o, f) {
	return Ti.addCallback(o, f, true);
}


// Logging should always be available
Ti.API = {
	/*
	 * @tiapi(method=True,name=API.log,since=0.4) log data to the console.
	 * @tiarg[int,severity] Severity code from FATAL down to TRACE
	 * @tiarg[string,msg] Message to send to the console
	 */
	log: function(severity,msg)
	{
		Ti.apiProxy.log(severity,msg);
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

var TitaniumMemoryBlob = function(key) {
	this._key = key;
	this._ref = Ti.getObjectReference(key); // get the native reference for tracking.

	this.getLength = function() {
		return Ti.getTitaniumMemoryBlobLength(this._key);
	};
	this.getKey = function() {
		return this._key;
	};

	this.toString = function() {
		return transformObjectValueAsString(Ti.getTitaniumMemoryBlobString(this._key));
	}
};
TitaniumMemoryBlob.prototype.__defineGetter__("length", function(){
	return this.getLength();
});


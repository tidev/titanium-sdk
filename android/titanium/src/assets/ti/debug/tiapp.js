/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

Ti.appProxy = window.TitaniumApp;

Ti.App =
{
	/**
	 * @tiapi(method=True,name=App.getID,since=0.4) Get the application id.
	 * @tiresult[string] the id as stored in tiapp.xml
	 */
	getID : function ()
	{
		return transformObjectValueAsString(Ti.appProxy.getID(),null);
	},
	/**
	 * @tiapi(method=True,name=App.getName,since=0.4) Get the name of the application.
	 * @tiresult[string] the name as stored in tiapp.xml
	 */
	getName: function()
	{
		return transformObjectValueAsString(Ti.appProxy.getModuleName(),null);
	},
	/**
	 * @tiapi(method=True,name=App.getVersion,since=0.4) Get the application version.
	 * @tiresult[string] the application version as stored in tiapp.xml.
	 */
	getVersion: function()
	{
		return transformObjectValueAsString(Ti.appProxy.getVersion(),null);
	},
	/**
	 * @tiapi(method=True,name=App.getPublisher,since=0.4) Get the publisher.
	 * @tiresult[string] the publisher name as stored in tiapp.xml
	 */
	getPublisher: function()
	{
		return transformObjectValueAsString(Ti.appProxy.getPublisher(),null);
	},
	/**
	 * @tiapi(method=True,name=App.getURL,since=0.4) Get the url to application's external website.
	 * @tiresult[string] url to external website as store in tiapp.xml
	 */
	getURL: function()
	{
		return transformObjectValueAsString(Ti.appProxy.getURL(),null);
	},
	/**
	 * @tiapi(method=True,name=App.getDescription,since=0.4) Get description of application
	 * @tiresult[string] description of application as stored in tiapp.xml
	 */
	getDescription: function()
	{
		return transformObjectValueAsString(Ti.appProxy.getDescription(),null);
	},
	/**
	 * @tiapi(method=True,name=App.getCopyright,since=0.4) Get application copyright
	 * @tiresult[string] application copyright as stored in tiapp.xml.
	 */
	getCopyright: function()
	{
		return transformObjectValueAsString(Ti.appProxy.getCopyright(),null);
	},
	/**
	 * @tiapi(method=True,name=App.getGUID,since=0.4) get the application's globally unique id
	 * @tiresult[string] global unique id as stored in tiapp.xml
	 */
	getGUID: function()
	{
		return transformObjectValueAsString(Ti.appProxy.getGUID(),null);
	},
	/**
	 * @tiapi(method=True,name=App.appURLToPath,since=0.4) Get url for file under Resources
	 * @tiarg[string,url] path portion of the url.
	 * @tiresult[string] full url including path. On Android this will normally prefix with file:///android_asset/
	 */
	appURLToPath: function(url)
	{
		return transformObjectValueAsString(Ti.appProxy.appURLToPath(url),null);
	},
	/**
	 * @tiapi(method=True,name=App.getStreamURL,since=0.4) Not implemented yet
	 * @tiarg[string,stream] deploytype (TBD)
	 * @tiresult[string] url for analytics
	 */
	getStreamURL: function(stream)
	{
		return transformObjectValueAsString(Ti.appProxy.getStreamURL(stream),null);
	},
	/**
	 * @tiapi(method=True,name=App.triggerLoad,since=0.4) (Internal, Android only)
	 * @tiapi Method to signal switching to the webView in the activity.
	 * @tiapi Normally called automatically when the page end event fires.
	 */
	triggerLoad: function()
	{
		Ti.appProxy.triggerLoad();
	},
	/**
	 * @tiapi(method=True,name=App.setLoadOnPageEnd,since=0.4)
	 * @tiapi Used to control automatic execution of triggerLoad.
	 * @tiarg[bool,load] if true, automatically call triggerLoad.
	 */
	setLoadOnPageEnd: function(load)
	{
		return transformObjectValue(Ti.appProxy.setLoadOnPageEnd(load), null);
	}
};

Properties = function(proxy) {
	this.proxy = proxy;

	/**
	 * @tiapi(method=True,name=App.Properties.getString,since=0.4) Retrieve a string property
	 * @tiarg[string,name] property name
	 * @tiarg[string,def] default value if no value set for key in name
	 * @tiresult[string] property value or default
	 */
	/**
	 * @tiapi(method=True,name=App.SystemProperties.getString,since=0.4) Retrieve a string property
	 * @tiarg[string,name] property name
	 * @tiarg[string,def] default value if no value set for key in name
	 * @tiresult[string] property value or default
	 */
	this.getString = function(name, def) {
		var r = null;

		if (this.hasProperty(name)) {
			def = arguments.length == 1 || isUndefined(def) ? null : def;
			r = this.proxy.getString(name,def);
		} else {
			if (isUndefined(def)) {
				def = null;
			}
		}
		return transformObjectValueAsString(r,def);
	};
	/**
	 * @tiapi(method=True,name=App.Properties.setString,since=0.4) Store a string property
	 * @tiarg[string,name] property name
	 * @tiarg[string,value] property value
	 */
	/**
	 * @tiapi(method=True,name=App.SystemProperties.setString,since=0.4) Store a string property
	 * @tiarg[string,name] property name
	 * @tiarg[string,value] property value
	 */
	this.setString = function(name, value) {
		return this.proxy.setString(name,value);
	};
	/**
	 * @tiapi(method=True,name=App.Properties.getInt,since=0.4) Retrieve an integer property
	 * @tiarg[string,name] property name
	 * @tiarg[int,def] default value if no value set for key in name
	 * @tiresult[int] property value or default
	 */
	/**
	 * @tiapi(method=True,name=App.SystemProperties.getInt,since=0.4) Retrieve an integer property
	 * @tiarg[string,name] property name
	 * @tiarg[int,def] default value if no value set for key in name
	 * @tiresult[int] property value or default
	 */
	this.getInt = function(name,def) {
		var r = null;

		if(this.hasProperty(name)) {
			def = arguments.length == 1 || isUndefined(def) ? -1 : def;
			r = this.proxy.getInt(name,def);
		} else {
			if (isUndefined(def)) {
				def = null;
			}
		}
		return transformObjectValueAsInt(r,def);
	};
	/**
	 * @tiapi(method=True,name=App.Properties.setInt,since=0.4) Store an integer property
	 * @tiarg[string,name] property name
	 * @tiarg[int,value] property value
	 */
	/**
	 * @tiapi(method=True,name=App.SystemProperties.setInt,since=0.4) Store an integer property
	 * @tiarg[string,name] property name
	 * @tiarg[int,value] property value
	 */
	this.setInt = function(name,value){
		return this.proxy.setInt(name,value);
	};
	/**
	 * @tiapi(method=True,name=App.Properties.getBool,since=0.4) Retrieve a boolean property
	 * @tiarg[string,name] property name
	 * @tiarg[bool,def] default value if no value set for key in name
	 * @tiresult[bool] property value or default
	 */
	/**
	 * @tiapi(method=True,name=App.SystemProperties.getBool,since=0.4) Retrieve a boolean property
	 * @tiarg[string,name] property name
	 * @tiarg[bool,def] default value if no value set for key in name
	 * @tiresult[bool] property value or default
	 */
	this.getBool = function(name,def) {
		var r = null;
		if (this.hasProperty(name)) {
			def = arguments.length == 1 || isUndefined(def) ? false : def;
			r = this.proxy.getBool(name,def);
		} else {
			if(isUndefined(def)) {
				def = null;
			}
		}
		return transformObjectValueAsBool(r,def);
	};
	/**
	 * @tiapi(method=True,name=App.Properties.setBool,since=0.4) Store a boolean property
	 * @tiarg[string,name] property name
	 * @tiarg[bool,value] property value
	 */
	/**
	 * @tiapi(method=True,name=App.SystemProperties.setBool,since=0.4) Store a boolean property
	 * @tiarg[string,name] property name
	 * @tiarg[bool,value] property value
	 */
	this.setBool = function(name,value){
		return this.proxy.setBool(name,value);
	};
	/**
	 * @tiapi(method=True,name=App.Properties.getDouble,since=0.4) Retrieve a double property
	 * @tiarg[string,name] property name
	 * @tiarg[double,def] default value if no value set for key in name
	 * @tiresult[double] property value or default
	 */
	/**
	 * @tiapi(method=True,name=App.SystemProperties.getDouble,since=0.4) Retrieve a string property
	 * @tiarg[string,name] property name
	 * @tiarg[double,def] default value if no value set for key in name
	 * @tiresult[double] property value or default
	 */
	this.getDouble = function(name,def){
		if (this.hasProperty(name)) {
			def = arguments.length == 1 || isUndefined(def) ? 0.0 : def;
			r = this.proxy.getDouble(name,def);
		} else {
			if(isUndefined(def)) {
				def = null;
			}
		}
		return transformObjectValueAsDouble(r,def);
	};
	this.setDouble = function(name,value){
		return this.proxy.setDouble(name,value);
	};
	/**
	 * @tiapi(method=True,name=App.Properties.getList,since=0.7.0) Retrieve a list
	 * @tiarg[string,name] property name
	 * @tiarg[list,def] default value if no value set for key in name
	 * @tiresult[list] property value or default
	 */
	/**
	 * @tiapi(method=True,name=App.SystemProperties.getList,since=0.7.0) Retrieve a list
	 * @tiarg[string,name] property name
	 * @tiarg[list,def] default value if no value set for key in name
	 * @tiresult[list] property value or default
	 */
	this.getList = function(name, def)
	{
		 if (isUndefined(def)) {
			 def = [];
		 }
		 var s = this.proxy.getList(name, Ti.JSON.stringify(def));
		 return eval("(" + s + ")");
	};

	/**
	 * @tiapi(method=True,name=App.Properties.setList,since=0.7.0) Store a list of JSON'able objects
	 * @tiarg[string,name] property name
	 * @tiarg[list,value] value to store
	 */
	/**
	 * @tiapi(method=True,name=App.SystemProperties.setList,since=0.7.0) Store a list of JSON'able objects
	 * @tiarg[string,name] property name
	 * @tiarg[list,def] value to store
	 */
	this.setList = function(name, value) {
		if (isUndefined(value)) {
			value = [];
		}

		if (!typeOf(value) == 'array') {
			value = [ value ];
		}

		this.proxy.setList(name, Ti.JSON.stringify(value));
	};
	/**
	 * @tiapi(method=True,name=App.Properties.hasProperty,since=0.7.0) Detect existence of a property
	 * @tiarg[string,name] property name
	 * @tiresult[boolean] true if property with 'name' exists.
	 */
	/**
	 * @tiapi(method=True,name=App.SystemProperties.hasProperty,since=0.7.0) Detect existence of a property
	 * @tiarg[string,name] property name
	 * @tiresult[boolean] true if property with 'name' exists.
	 */
	this.hasProperty = function(name) {
		return this.proxy.hasProperty(name);
	};
	/**
	 * @tiapi(method=True,name=App.Properties.listProperties,since=0.7.0) Retrieve a list of property names
	 * @tiresult[list] list of property names
	 */
	/**
	 * @tiapi(method=True,name=App.SystemProperties.listProperties,since=0.7.0) Retrieve a list of property names
	 * @tiresult[list] list of property names
	 */
	this.listProperties = function() {
		return eval("(" + this.proxy.listProperties() + ")");
	};
	/**
	 * @tiapi(method=True,name=App.Properties.removeProperty,since=0.7.0) Remove a property
	 * @tiarg[string,name] property name
	 */
	/**
	 * @tiapi(method=True,name=App.SystemProperties.getList,since=0.7.0) Remove a property
	 * @tiarg[string,name] property name
	 */
	this.removeProperty = function(name) {
		if (!isUndefined(name)) {
			this.proxy.removeProperty(name);
		}
	};
};

Ti.App.Properties = new Properties(Ti.appProxy.getAppProperties());
Ti.App.SystemProperties = new Properties(Ti.appProxy.getSystemProperties());

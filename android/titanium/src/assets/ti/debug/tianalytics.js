/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

Titanium.analyticsProxy = window.TitaniumAnalytics;

Titanium.Analytics =
{
	/**
	 * @tiapi(method=True,name=Analytics.addEvent,since=0.4) send an analytics event associated with the application
	 * @tiarg(for=Analytics.addEvent,type=string,name=event) event name
	 * @tiarg(for=Analytics.addEvent,type=string,name=data,optional=True) data to send with the event
	 */
	addEvent : function (name,data)
	{
		return transformObjectValue(Titanium.analyticsProxy.addEvent(name,data),null);
	}
};


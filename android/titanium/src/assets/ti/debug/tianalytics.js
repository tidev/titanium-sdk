/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

Titanium.analyticsProxy = window.TitaniumAnalytics;

Titanium.Analytics =
{
	addEvent : function (type,event,data)
	{
		 if(!isUndefined(type) && type.indexOf("ti.") !== 0) {
			 if(isUndefined(data)) {
				 data = {};
			 }
			 if (typeOf(data) == "string") {
				 data = { value : data };
			 }
			return transformObjectValue(Titanium.analyticsProxy.addEvent(type,event,Titanium.JSON.stringify(data)));
		 } else {
			 Titanium.API.warn("events classes starting with ti. are reserved for use by Appcelerator");
		 }
	},

	/**
	 * @tiapi(method=True,name=Analytics.navEvent,since=0.7.0) send an application nav event
	 * @tiarg(for=Analytics.navEvent,type=string,name=from) The from string
	 * @tiarg(for=Analytics.navEvent,type=string,name=to) The to string
	 * @tiarg(for=Analytics.navEvent,type=string,name=event,optional=True) name of the event
	 * @tiarg(for=Analytics.navEvent,type=Object,name=data,optional=True) data to send with the event
	 */
	navEvent : function(from, to, event, data) {
		if (!isUndefined(from) && !isUndefined(to)) {
			if (isUndefined(event)) {
				event = "";
			}

			var payload = {};
			payload.from = isUndefined(from) ? {} : from;
			payload.to = isUndefined(to) ? {} : to;
			payload.data = isUndefined(data) ? {} : data;

			this.addEvent("app.nav", event, payload);
		} else {
			Titanium.API.error("from and to are required parameters for navEvent");
		}
	},
	/**
	 * @tiapi(method=True,name=Analytics.timedEvent,since=0.7.0) send an application timed event.
	 * @tiarg(for=Analytics.timedEvent,type=string,name=event) name of the event
	 * @tiarg(for=Analytics.timedEvent,type=Date,name=start,optional=True) Start date, a Javascript Date
	 * @tiarg(for=Analytics.timedEvent,type=Date,name=stop,optional=True) End date, a Javascript Date
	 * @tiarg(for=Analytics.timedEvent,type=string,name=duration,optional=True) duration in seconds
	 * @tiarg(for=Analytics.timedEvent,type=Object,name=data,optional=True) data to send with the event
	 */
	timedEvent : function(event, start, stop, duration, data) {
		if (!isUndefined(event)) {
			var payload = {};
			if (!isUndefined(start)) {
				payload.start = Titanium.DateFormatter.formatUTC(start);
			}
			if (!isUndefined(stop)) {
				payload.stop = Titanium.DateFormatter.formatUTC(stop);
			}
			if (!isUndefined(duration)) {
				payload.duration = duration;
			}
			payload.data = isUndefined(data) ? {} : data;
			this.addEvent("app.timed_event", event, payload);
		} else {
			Titanium.API.error("timedEvent requires an event name");
		}
	},
	/**
	 * @tiapi(method=True,name=Analytics.featureEvent,since=0.7.0) send an application feature event.
	 * @tiarg(for=Analytics.featureEvent,type=string,name=event) name of the event
	 * @tiarg(for=Analytics.featureEvent,type=Object,name=data,optional=True) data to send with the event
	 */
	featureEvent : function(event, data) {
		if (!isUndefined(event)) {
			var payload = {};
			payload.data = isUndefined(data) ? {} : data;
			this.addEvent("app.feature", event, payload);
		} else {
			Titanium.API.error("featureEvent requires an event name");
		}
	},
	/**
	 * @tiapi(method=True,name=Analytics.settingsEvent,since=0.7.0) send an application settings event.
	 * @tiarg(for=Analytics.settingsEvent,type=string,name=event) name of the event
	 * @tiarg(for=Analytics.settingsEvent,type=Object,name=data,optional=True) data to send with the event
	 */
	settingsEvent : function(event, data) {
		if (!isUndefined(event)) {
			var payload = {};
			payload.data = isUndefined(data) ? {} : data;
			this.addEvent("app.settings", event, payload);
		} else {
			Titanium.API.error("settingsEvent requires an event name");
		}
	},
	/**
	 * @tiapi(method=True,name=Analytics.userEvent,since=0.7.0) send an application user event.
	 * @tiarg(for=Analytics.userEvent,type=string,name=event) name of the event
	 * @tiarg(for=Analytics.userEvent,type=Object,name=data,optional=True) data to send with the event
	 */
	userEvent : function(event, data) {
		if (!isUndefined(event)) {
			var payload = {};
			payload.data = isUndefined(data) ? {} : data;
			this.addEvent("app.user", event, payload);
		} else {
			Titanium.API.error("userEvent requires an event name");
		}
	}
};


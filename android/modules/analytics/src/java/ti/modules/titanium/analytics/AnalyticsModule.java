/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.analytics;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.analytics.TiAnalyticsEventFactory;
import org.appcelerator.titanium.util.TiConvert;

@Kroll.module
public class AnalyticsModule extends KrollModule
{
	public AnalyticsModule()
	{
		super();
	}

	public AnalyticsModule(TiContext tiContext)
	{
		this();
	}

	@Kroll.method
	public void addEvent(String type, String event, @Kroll.argument(optional=true) KrollDict data)
	{
		localAddEvent(type, event, data);
	}
	
	protected void localAddEvent(String type, String event, KrollDict data) {
		TiApplication.getInstance().postAnalyticsEvent(TiAnalyticsEventFactory.createEvent(type, event, TiConvert.toJSON(data).toString()));
	}

	@Kroll.method
	public void navEvent(String from, String to,
		@Kroll.argument(optional=true) String event,
		@Kroll.argument(optional=true) KrollDict data)
	{
		KrollDict payload = new KrollDict();
		payload.put("from", from);
		payload.put("to", to);
		payload.put("event", event);
		payload.put("data", data);

		localAddEvent("app.nav", payload.getString("event"), payload);
	}

	@Kroll.method
	public void timedEvent(String event, long start, long stop, int duration,
		@Kroll.argument(optional=true) KrollDict data)
	{
		KrollDict payload = new KrollDict();
		payload.put("event", event);
		payload.put("start", start);
		payload.put("stop", stop);
		payload.put("duration", duration);
		payload.put("data", data);

		localAddEvent("app.timed", payload.getString("event"), payload);
	}

	@Kroll.method
	public void featureEvent(String event, @Kroll.argument(optional=true) KrollDict data) {
		localAddEvent("app.feature", event, data);
	}

	@Kroll.method
	public void settingsEvent(String event, @Kroll.argument(optional=true) KrollDict data) {
		localAddEvent("app.settings", event, data);
	}

	@Kroll.method
	public void userEvent(String event, @Kroll.argument(optional=true) KrollDict data) {
		localAddEvent("app.user", event, data);
	}
}

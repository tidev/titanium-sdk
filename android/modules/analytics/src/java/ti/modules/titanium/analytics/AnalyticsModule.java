/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.analytics;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiPlatformHelper;
import org.json.JSONException;
import org.json.JSONObject;

import com.appcelerator.analytics.APSAnalytics;
import com.appcelerator.analytics.APSAnalyticsEvent;

@Kroll.module
public class AnalyticsModule extends KrollModule
{
	protected static final String PROPERTY_APP_NAV = "app.nav";
	protected static final String PROPERTY_APP_TIMED = "app.timed";
	protected static final String PROPERTY_APP_FEATURE = "app.feature";
	protected static final String PROPERTY_APP_SETTINGS = "app.settings";
	protected static final String PROPERTY_APP_USER = "app.user";

	public AnalyticsModule()
	{
		super();
	}

	public AnalyticsModule(TiContext tiContext)
	{
		this();
	}

	@Kroll.method
	public void navEvent(String from, String to,
		@Kroll.argument(optional=true) String event,
		@Kroll.argument(optional=true) KrollDict data)
	{
		if (TiApplication.getInstance().isAnalyticsEnabled()) {
			APSAnalytics.sendAppNavEvent(from, to, event, TiConvert.toJSON(data));
		}
	}

	@Kroll.method
	public void featureEvent(String event, @Kroll.argument(optional = true) KrollDict data)
	{
		if (TiApplication.getInstance().isAnalyticsEnabled()) {
			APSAnalytics.sendFeatureEvent(event, TiConvert.toJSON(data));
		}
	}

	@Kroll.getProperty @Kroll.method
	public String getLastEvent()
	{
		if (TiApplication.getInstance().isAnalyticsEnabled()) {
			try {
				APSAnalyticsEvent event = APSAnalytics.getLastEvent();
				if (event == null) {
					return null;
				}
				JSONObject json = new JSONObject();
				json.put("ver", "2");
				json.put("id", TiPlatformHelper.getInstance().getLastEventID());
				json.put("event", event.getEventType());
				json.put("ts", event.getEventTimestamp());
				json.put("mid", event.getEventMid());
				json.put("sid", event.getEventSid());
				json.put("aguid", event.getEventAppGuid());
				if (event.mustExpandPayload()) {
					json.put("data", new JSONObject(event.getEventPayload()));
				} else {
					json.put("data", event.getEventPayload());
				}
				return json.toString();
			} catch (JSONException e) {
			}
		}
		return null;
	}

	@Override
	public String getApiName()
	{
		return "Ti.Analytics";
	}
}

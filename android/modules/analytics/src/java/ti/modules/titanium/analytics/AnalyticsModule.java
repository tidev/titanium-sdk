/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.analytics;

import java.util.HashMap;
import java.util.Iterator;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiPlatformHelper;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.util.Log;

import com.appcelerator.aps.APSAnalytics;

@Kroll.module
public class AnalyticsModule extends KrollModule
{
	private static final String TAG = "AnalyticsModule";

	protected static final String PROPERTY_APP_NAV = "app.nav";
	protected static final String PROPERTY_APP_TIMED = "app.timed";
	protected static final String PROPERTY_APP_FEATURE = "app.feature";
	protected static final String PROPERTY_APP_SETTINGS = "app.settings";
	protected static final String PROPERTY_APP_USER = "app.user";
	private APSAnalytics analytics = APSAnalytics.getInstance();

	public static final int MAX_LEVELS = 5;
	public static final int MAX_SERLENGTH = 1000;
	public static final int MAX_KEYS = 25;
	public static final int MAX_KEYLENGTH = 50;

	public static final int SUCCESS = 0;
	public static final int JSON_VALIDATION_FAILED = -1;
	public static final int ANALYTICS_DISABLED = -2;

	public AnalyticsModule()
	{
		super();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public boolean getOptedOut()
	// clang-format on
	{
		return APSAnalytics.getInstance().isOptedOut();
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setOptedOut(boolean optedOut)
	// clang-format on
	{
		APSAnalytics.getInstance().setOptedOut(optedOut);
	}

	@Kroll.method
	public void navEvent(String from, String to, @Kroll.argument(optional = true) String event,
						 @Kroll.argument(optional = true) KrollDict data)
	{
		if (TiApplication.getInstance().isAnalyticsEnabled()) {
			// Preserve legacy behavior allowing the argument to be optional. We set it to be an empty string now
			// instead of "null".
			if (event == null) {
				event = "";
			}
			JSONObject payload = null;
			if (data instanceof HashMap) {
				payload = TiConvert.toJSON(data);
			} else if (data != null) {
				try {
					payload = new JSONObject(data.toString());
				} catch (JSONException e) {
					Log.e(TAG, "Cannot convert data into JSON");
				}
			}
			analytics.sendAppNavEvent(from, to, event, payload);
		} else {
			Log.e(
				TAG,
				"Analytics is disabled.  To enable, please update the <analytics></analytics> node in your tiapp.xml");
		}
	}

	@Kroll.method
	public void filterEvents(Object eventsObj)
	{
		if (eventsObj instanceof Object[]) {
			Object[] events = (Object[]) eventsObj;
			String[] temp = new String[events.length];
			for (int i = 0; i < events.length; ++i) {
				temp[i] = TiConvert.toString(events[i]);
			}
			TiApplication.getInstance().setFilterAnalyticsEvents(temp);
		}
	}

	@Kroll.method
	public int featureEvent(String event, @Kroll.argument(optional = true) KrollDict data)
	{
		if (TiApplication.getInstance().isAnalyticsEnabled()) {
			if (data instanceof HashMap) {
				JSONObject jsonData = TiConvert.toJSON(data);
				if (AnalyticsModule.validateJSON(jsonData, 0) == SUCCESS) {
					analytics.sendAppFeatureEvent(event, jsonData);
					return SUCCESS;
				} else {
					Log.e(TAG, "Feature event " + event + " not conforming to recommended usage.");
					return JSON_VALIDATION_FAILED;
				}
			} else if (data != null) {
				try {
					JSONObject jsonData = new JSONObject(data.toString());
					if (AnalyticsModule.validateJSON(jsonData, 0) == SUCCESS) {
						analytics.sendAppFeatureEvent(event, jsonData);
						return SUCCESS;
					} else {
						Log.e(TAG, "Feature event " + event + " not conforming to recommended usage.");
						return JSON_VALIDATION_FAILED;
					}
				} catch (JSONException e) {
					Log.e(TAG, "Cannot convert data into JSON");
					return JSON_VALIDATION_FAILED;
				}
			} else {
				analytics.sendAppFeatureEvent(event, null);
				return SUCCESS;
			}
		} else {
			Log.e(
				TAG,
				"Analytics is disabled.  To enable, please update the <analytics></analytics> node in your tiapp.xml");
			return ANALYTICS_DISABLED;
		}
	}

	public static int validateJSON(JSONObject jsonObject, int level)
	{

		if (level > MAX_LEVELS) {
			Log.w(TAG, "Feature event cannot have more than " + MAX_LEVELS + " nested JSONs");
			return JSON_VALIDATION_FAILED;
		}
		if (jsonObject == null) {
			return JSON_VALIDATION_FAILED;
		}
		if ((level == 0) & (jsonObject.toString().getBytes().length > MAX_SERLENGTH)) {
			Log.w(TAG, "Feature event cannot exceed more than " + MAX_SERLENGTH + " total serialized bytes");
			return JSON_VALIDATION_FAILED;
		}
		if (jsonObject.length() > MAX_KEYS) {
			Log.w(TAG, "Feature event maximum keys should not exceed " + MAX_KEYS);
			return JSON_VALIDATION_FAILED;
		}

		Iterator<String> keys = jsonObject.keys();

		while (keys.hasNext()) {
			String key = (String) keys.next();
			if (key.length() > MAX_KEYLENGTH) {
				Log.w(TAG, "Feature event key " + key + " length should not exceed " + MAX_KEYLENGTH + " characters");
				return JSON_VALIDATION_FAILED;
			}
			try {
				Object child;
				child = jsonObject.get(key);
				if (child instanceof JSONObject) {
					if (validateJSON(((JSONObject) child), level + 1) != SUCCESS) {
						return JSON_VALIDATION_FAILED;
					}
				} else if (jsonObject.get(key) instanceof JSONArray) {
					JSONArray jsonArray = (JSONArray) child;
					for (int i = 0; i < jsonArray.length(); i++) {
						Object o = jsonArray.get(i);
						if (o instanceof JSONObject) {
							if (validateJSON(((JSONObject) o), level + 1) != SUCCESS) {
								return JSON_VALIDATION_FAILED;
							}
						}
					}
				}
			} catch (JSONException e) {
				Log.w(TAG, "Unable to validate JSON: " + e);
			}
		}
		return SUCCESS;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getLastEvent()
	// clang-format on
	{
		if (TiApplication.getInstance().isAnalyticsEnabled()) {
			if (analytics.getLastEvent() != null) {
				return analytics.getLastEvent().toString();
			}
		} else {
			Log.e(
				TAG,
				"Analytics is disabled.  To enable, please update the <analytics></analytics> node in your tiapp.xml");
		}
		return null;
	}

	@Override
	public String getApiName()
	{
		return "Ti.Analytics";
	}
}

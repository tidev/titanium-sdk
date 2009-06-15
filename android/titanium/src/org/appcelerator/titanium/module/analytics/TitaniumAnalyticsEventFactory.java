package org.appcelerator.titanium.module.analytics;

import org.appcelerator.titanium.api.ITitaniumApp;
import org.appcelerator.titanium.api.ITitaniumNetwork;
import org.appcelerator.titanium.api.ITitaniumPlatform;
import org.json.JSONException;
import org.json.JSONObject;

import android.util.Log;

public class TitaniumAnalyticsEventFactory
{
	private static final String LCAT = "TiAnalyticsEventFactory";

	public static final String EVENT_APP_START = "ti.start";
	public static final String EVENT_APP_END = "ti.end";
	public static final String EVENT_ERROR = "ti.error";

	public static TitaniumAnalyticsEvent createAppStartEvent( ITitaniumNetwork network,
			ITitaniumPlatform platform, ITitaniumApp application, String deployType
		)
	{
		TitaniumAnalyticsEvent event = null;

		JSONObject json;

		try {
			json = new JSONObject();
			json.put("platform", "android");
			json.put("version", "0.4"); //TODO get from build
			json.put("deploytype", deployType);

			json.put("model", platform.getModel());
			json.put("mid", platform.getId());
			json.put("mac_addr", platform.getMacAddress());
			json.put("osver", platform.getVersion());
			json.put("os", platform.getModel());
			json.put("ostype", platform.getOsType());
			json.put("osarch", platform.getArchitecture());
			json.put("oscpu", platform.getProcessorCount());
			json.put("ip", platform.getAddress());
			json.put("un", platform.getUsername());

			json.put("app_version", application.getVersion());
			json.put("app_guid", application.getGUID());
			json.put("app_id", application.getID());
			json.put("app_name", application.getModuleName());
			json.put("app_publisher", application.getPublisher());

			event = new TitaniumAnalyticsEvent(EVENT_APP_START, json);
		} catch (JSONException e) {
			Log.e(LCAT, "Unable to encode start event", e);
			event = null;
		}

		return event;
	}

	public static TitaniumAnalyticsEvent createAppEndEvent()
	{
		return new TitaniumAnalyticsEvent(EVENT_APP_END, "");
	}

	public static TitaniumAnalyticsEvent createErrorEvent(Thread t, Throwable err)
	{
		TitaniumAnalyticsEvent event = null;

		JSONObject json;

		try {
			json = new JSONObject();
			json.put("thread_name", t.getName());
			json.put("thread_id", t.getId());

			json.put("error_msg", err.toString());

			StringBuilder sb = new StringBuilder(512);
			StackTraceElement[] elements = err.getStackTrace();
			int len = elements.length;

			for (int i=0; i < len; i++) {
				sb.append(elements[i].toString()).append("\n");
			}

			json.put("error_trace", sb.toString());
			sb.setLength(0);
			sb = null;

			event = new TitaniumAnalyticsEvent(EVENT_ERROR, json);
		} catch (JSONException e) {
			Log.e(LCAT, "Unable to encode stop event", e);
			event = null;
		}

		return event;
	}

	public static TitaniumAnalyticsEvent createEvent(String eventName, String data) {
		return new TitaniumAnalyticsEvent(EVENT_APP_END, data);
	}
}

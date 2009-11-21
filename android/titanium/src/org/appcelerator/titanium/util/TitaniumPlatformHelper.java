/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.util;

import java.util.UUID;

import org.json.JSONException;
import org.json.JSONObject;

import android.app.Activity;
import android.content.Context;
import android.provider.Settings;
import android.util.DisplayMetrics;
import android.view.Display;

public class TitaniumPlatformHelper
{
	public static String platformId;
	public static String sessionId;
	public static StringBuilder sb = new StringBuilder(256);

	public static void initialize(Context context) {
		platformId = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ANDROID_ID);
		if (platformId == null) {
			platformId = "";
			TitaniumDatabaseHelper db = new TitaniumDatabaseHelper(context);
			platformId = db.getPlatformParam("unique_machine_id",null);
			if (platformId == null)
			{
				platformId = createUUID();
				db.setPlatformParam("unique_machine_id", platformId);
			}
		}

		sessionId = createUUID();
	}

	public static String getMobileId()
	{
		return platformId;
	}

	public static String createUUID() {
		return UUID.randomUUID().toString();
	}

	public static String getSessionId() {
		return sessionId;
	}

	public static String createEventId() {
		String s = null;
		synchronized(sb) {
			sb.append(createUUID()).append(":").append(getMobileId());
			s = sb.toString();
			sb.setLength(0); // reuse.
		}
		return s;
	}

	public static JSONObject getDisplayCaps(Activity activity)
		throws JSONException
	{
		JSONObject caps = new JSONObject();
		Display d = activity.getWindowManager().getDefaultDisplay();
		caps.put("width", d.getWidth());
		caps.put("height", d.getHeight());
		DisplayMetrics dm = new DisplayMetrics();
		d.getMetrics(dm);
		// Level 3 SDK, doesn't have Low, Medium, or High, so guess.
		int dpi = (int) (dm.xdpi + dm.ydpi) / 2;
		caps.put("dpi", dpi);

		String density = "medium";
		if (dpi < 140) {
			density = "low";
		} else if (dpi > 200) {
			density = "high";
		}
		caps.put("density", density);

		caps.put("xdpi", dm.xdpi);
		caps.put("ydpi", dm.ydpi);
		caps.put("logicalDensityFactor", dm.density); // 1.0 ~ 160dpi
		return caps;
	}
}

package org.appcelerator.titanium.util;

import java.util.UUID;

import android.content.Context;
import android.provider.Settings;

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
}

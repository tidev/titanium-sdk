/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.android.notificationmanager;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.common.Log;

import ti.modules.titanium.android.AndroidModule;

import android.app.Activity;
import android.app.Notification;
import android.app.NotificationManager;
import android.os.PowerManager;
import android.os.PowerManager.WakeLock;

import java.util.HashMap;

@Kroll.module(parentModule=AndroidModule.class)
public class NotificationManagerModule extends KrollModule
{
	private static final String TAG = "TiNotification";
	protected static final int PENDING_INTENT_FOR_ACTIVITY = 0;
	protected static final int PENDING_INTENT_FOR_SERVICE = 1;
	protected static final int PENDING_INTENT_FOR_BROADCAST = 2;
	protected static final int PENDING_INTENT_MAX_VALUE = PENDING_INTENT_FOR_SERVICE;

	@Kroll.constant public static final int DEFAULT_ALL = Notification.DEFAULT_ALL;
	@Kroll.constant public static final int DEFAULT_LIGHTS = Notification.DEFAULT_LIGHTS;
	@Kroll.constant public static final int DEFAULT_SOUND = Notification.DEFAULT_SOUND;
	@Kroll.constant public static final int DEFAULT_VIBRATE = Notification.DEFAULT_VIBRATE;
	@Kroll.constant public static final int FLAG_AUTO_CANCEL = Notification.FLAG_AUTO_CANCEL;
	@Kroll.constant public static final int FLAG_INSISTENT = Notification.FLAG_INSISTENT;
	@Kroll.constant public static final int FLAG_NO_CLEAR = Notification.FLAG_NO_CLEAR;
	@Kroll.constant public static final int FLAG_ONGOING_EVENT = Notification.FLAG_ONGOING_EVENT;
	@Kroll.constant public static final int FLAG_ONLY_ALERT_ONCE = Notification.FLAG_ONLY_ALERT_ONCE;
	@Kroll.constant public static final int FLAG_SHOW_LIGHTS = Notification.FLAG_SHOW_LIGHTS;
	@SuppressWarnings("deprecation")
	@Kroll.constant public static final int STREAM_DEFAULT = Notification.STREAM_DEFAULT;


	public NotificationManagerModule()
	{
		super();
	}

	// Kept for compatibility with 1.5.x
	public NotificationProxy createNotification(Object[] args)
	{
		NotificationProxy notification = new NotificationProxy();
		notification.handleCreationArgs(this, args);
		return notification;
	}

	private NotificationManager getManager()
	{
		return (NotificationManager) TiApplication.getInstance().getSystemService(Activity.NOTIFICATION_SERVICE);
	}

	@Kroll.method
	public void cancel(int id)
	{
		getManager().cancel(id);
	}

	@Kroll.method
	public void cancelAll()
	{
		getManager().cancelAll();
	}

	@Kroll.method
	public void notify(int id, NotificationProxy notificationProxy)
	{
		getManager().notify(id, notificationProxy.buildNotification());

		HashMap wakeParams = notificationProxy.getWakeParams();
		if (wakeParams != null) {
			int wakeTime = TiConvert.toInt(wakeParams.get("time"), 3000);
			int wakeFlags = TiConvert.toInt(wakeParams.get("flags"), (PowerManager.FULL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE));
			PowerManager pm = (PowerManager) TiApplication.getInstance().getSystemService(TiApplication.getInstance().getApplicationContext().POWER_SERVICE);
			if (pm != null && !pm.isScreenOn()) {
				try {
					WakeLock wl = pm.newWakeLock(wakeFlags, "TiWakeLock");
					wl.acquire(wakeTime);
				} catch (IllegalArgumentException e) {
					Log.e(TAG, e.getMessage());
				}
			}
		}
	}

	@Override
	public String getApiName()
	{
		return "Ti.Android.NotificationManager";
	}
}

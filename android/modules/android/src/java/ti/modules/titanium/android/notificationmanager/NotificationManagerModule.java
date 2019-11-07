/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2017 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.android.notificationmanager;

import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;

import android.Manifest;
import android.annotation.TargetApi;
import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.PowerManager;
import android.os.PowerManager.WakeLock;
import android.support.v4.app.NotificationManagerCompat;

import ti.modules.titanium.android.AndroidModule;

@Kroll.module(parentModule = AndroidModule.class)
public class NotificationManagerModule extends KrollModule
{
	private static final String TAG = "TiNotification";
	protected static final int PENDING_INTENT_FOR_ACTIVITY = 0;
	protected static final int PENDING_INTENT_FOR_SERVICE = 1;
	protected static final int PENDING_INTENT_FOR_BROADCAST = 2;
	protected static final int PENDING_INTENT_MAX_VALUE = PENDING_INTENT_FOR_SERVICE;

	private static NotificationManager notificationManager = null;
	private static NotificationChannel defaultChannel = null;

	public static final String DEFAULT_CHANNEL_ID = "ti_default_channel";

	@Kroll.constant
	public static final int DEFAULT_ALL = Notification.DEFAULT_ALL;
	@Kroll.constant
	public static final int DEFAULT_LIGHTS = Notification.DEFAULT_LIGHTS;
	@Kroll.constant
	public static final int DEFAULT_SOUND = Notification.DEFAULT_SOUND;
	@Kroll.constant
	public static final int DEFAULT_VIBRATE = Notification.DEFAULT_VIBRATE;
	@Kroll.constant
	public static final int FLAG_AUTO_CANCEL = Notification.FLAG_AUTO_CANCEL;
	@Kroll.constant
	public static final int FLAG_INSISTENT = Notification.FLAG_INSISTENT;
	@Kroll.constant
	public static final int FLAG_NO_CLEAR = Notification.FLAG_NO_CLEAR;
	@Kroll.constant
	public static final int FLAG_ONGOING_EVENT = Notification.FLAG_ONGOING_EVENT;
	@Kroll.constant
	public static final int FLAG_ONLY_ALERT_ONCE = Notification.FLAG_ONLY_ALERT_ONCE;
	@Kroll.constant
	public static final int FLAG_SHOW_LIGHTS = Notification.FLAG_SHOW_LIGHTS;
	@SuppressWarnings("deprecation")
	@Kroll.constant
	public static final int STREAM_DEFAULT = Notification.STREAM_DEFAULT;

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

	public static NotificationManager getManager()
	{
		if (notificationManager == null) {
			notificationManager =
				(NotificationManager) TiApplication.getInstance().getSystemService(Activity.NOTIFICATION_SERVICE);
		}
		return notificationManager;
	}

	public static boolean useDefaultChannel()
	{
		// use default channel if we are targeting API 26+
		boolean useDefaultChannel =
			Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
			&& TiApplication.getInstance().getApplicationInfo().targetSdkVersion >= Build.VERSION_CODES.O;

		// setup default channel it it does not exist
		if (useDefaultChannel && defaultChannel == null) {
			defaultChannel =
				new NotificationChannel(DEFAULT_CHANNEL_ID, "miscellaneous", NotificationManager.IMPORTANCE_DEFAULT);
			getManager().createNotificationChannel(defaultChannel);
			Log.w(
				TAG,
				"Falling back to default notification channel.\nIt is highly advised to create your own notification channel using Ti.Android.NotificationManager.createNotificationChannel()");
		}

		return useDefaultChannel;
	}

	@TargetApi(26)
	@Kroll.method
	public NotificationChannelProxy createNotificationChannel(Object[] args)
	{
		NotificationChannelProxy notificationChannelProxy = null;
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
			notificationChannelProxy = new NotificationChannelProxy();
			notificationChannelProxy.handleCreationArgs(this, args);
			getManager().createNotificationChannel(notificationChannelProxy.getNotificationChannel());
		}
		return notificationChannelProxy;
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
		Notification notification = notificationProxy.buildNotification();

		// targeting Android O or above? create default channel
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && notification.getChannelId() == DEFAULT_CHANNEL_ID) {
			useDefaultChannel();
		}

		getManager().notify(id, notification);

		HashMap wakeParams = notificationProxy.getWakeParams();
		if (wakeParams != null) {
			int wakeTime = TiConvert.toInt(wakeParams.get("time"), 3000);
			int wakeFlags = TiConvert.toInt(
				wakeParams.get("flags"),
				(PowerManager.FULL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE));
			TiApplication app = TiApplication.getInstance();
			if (app.checkCallingOrSelfPermission(Manifest.permission.WAKE_LOCK) == PackageManager.PERMISSION_GRANTED) {
				PowerManager pm = (PowerManager) app.getSystemService(TiApplication.POWER_SERVICE);
				if (pm != null && !pm.isScreenOn()) {
					try {
						WakeLock wl = pm.newWakeLock(wakeFlags, "TiWakeLock");
						wl.acquire(wakeTime);
					} catch (Exception e) {
						Log.e(TAG, e.getMessage());
					}
				}
			}
		}
	}

	@Kroll.method
	public boolean areNotificationsEnabled()
	{
		return NotificationManagerCompat.from(TiApplication.getInstance()).areNotificationsEnabled();
	}

	@Override
	public String getApiName()
	{
		return "Ti.Android.NotificationManager";
	}
}

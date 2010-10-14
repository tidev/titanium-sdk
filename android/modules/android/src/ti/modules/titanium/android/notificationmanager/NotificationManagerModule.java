/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.android.notificationmanager;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;

import ti.modules.titanium.android.PendingIntentProxy;
import android.app.Activity;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationManager;

public class NotificationManagerModule extends TiModule
{
	private static final String LCAT = "TiAndroid";

	protected static final int PENDING_INTENT_FOR_ACTIVITY = 0;
	protected static final int PENDING_INTENT_FOR_SERVICE = 1;
	protected static final int PENDING_INTENT_FOR_BROADCAST = 2;
	protected static final int PENDING_INTENT_MAX_VALUE = PENDING_INTENT_FOR_SERVICE;
	
	private static TiDict constants;


	public NotificationManagerModule(TiContext tiContext) {
		super(tiContext);
	}


	@Override
	public TiDict getConstants()
	{
		if (constants == null) {
			constants = new TiDict();

			constants.put("DEFAULT_ALL", Notification.DEFAULT_ALL);
			constants.put("DEFAULT_LIGHTS", Notification.DEFAULT_LIGHTS);
			constants.put("DEFAULT_SOUND", Notification.DEFAULT_SOUND);
			constants.put("DEFAULT_VIBRATE", Notification.DEFAULT_VIBRATE);
			constants.put("FLAG_AUTO_CANCEL", Notification.FLAG_AUTO_CANCEL);
			constants.put("FLAG_INSISTENT", Notification.FLAG_INSISTENT);
			constants.put("FLAG_NO_CLEAR", Notification.FLAG_NO_CLEAR);
			constants.put("FLAG_ONGOING_EVENT", Notification.FLAG_ONGOING_EVENT);
			constants.put("FLAG_ONLY_ALERT_ONCE", Notification.FLAG_ONLY_ALERT_ONCE);
			constants.put("FLAG_SHOW_LIGHTS", Notification.FLAG_SHOW_LIGHTS);
			constants.put("STREAM_DEFAULT", Notification.STREAM_DEFAULT);		
		}

		return constants;
	}

	private NotificationManager getManager() {
		return (NotificationManager) getTiContext().getActivity().getApplicationContext().getSystemService(Activity.NOTIFICATION_SERVICE);
	}
	
	public void cancel(int id) {
		getManager().cancel(id);
	}
	
	public void cancelAll() {
		getManager().cancelAll();
	}
	
	public void notify(int id, NotificationProxy notificationProxy) {
		getManager().notify(id, notificationProxy.getNotification());
	}	
}

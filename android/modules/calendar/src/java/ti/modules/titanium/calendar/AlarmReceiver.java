/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.calendar;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class AlarmReceiver extends BroadcastReceiver
{
	@Override
	public void onReceive(Context context, Intent intent)
	{
	    NotificationManager manger = (NotificationManager) context
	            .getSystemService(context.NOTIFICATION_SERVICE);

		Intent mainIntent = new Intent("ti.intent.action.calendar.ALARM");

	    Notification notification = new Notification(0x7f020000,
	            "", System.currentTimeMillis());
	    PendingIntent contentIntent = PendingIntent.getActivity(context, 0,
	            mainIntent, 0);
	//TEST
		notification.setLatestEventInfo(context,"Payment Reminder","Send me to jhaynie@appcelerator.com",contentIntent);
	    manger.notify(1, notification);
	}
}


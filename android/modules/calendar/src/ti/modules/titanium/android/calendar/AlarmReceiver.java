package ti.modules.titanium.android.calendar;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiProxy;

import android.app.AlarmManager;
import android.app.Activity;
import android.app.PendingIntent;
import android.app.Notification;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.BroadcastReceiver;
import android.widget.Toast;
import android.graphics.drawable.Drawable;
import org.appcelerator.titanium.util.TiFileHelper;

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
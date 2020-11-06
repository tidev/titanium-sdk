/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.calendar;

import java.util.ArrayList;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;

@Kroll.proxy(parentModule = CalendarModule.class)
public class ReminderProxy extends KrollProxy
{

	public static final int METHOD_DEFAULT = 0;
	public static final int METHOD_ALERT = 1;
	public static final int METHOD_EMAIL = 2;
	public static final int METHOD_SMS = 3;

	protected String id;
	protected int minutes, method;

	public ReminderProxy()
	{
		super();
	}

	public static String getRemindersUri()
	{
		return CalendarProxy.getBaseCalendarUri() + "/reminders";
	}

	public static ArrayList<ReminderProxy> getRemindersForEvent(EventProxy event)
	{
		ArrayList<ReminderProxy> reminders = new ArrayList<ReminderProxy>();
		if (!CalendarProxy.hasCalendarPermissions()) {
			return reminders;
		}
		ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();
		Uri uri = Uri.parse(getRemindersUri());

		Cursor reminderCursor = contentResolver.query(uri, new String[] { "_id", "minutes", "method" }, "event_id = ?",
													  new String[] { event.getId() }, null);

		while (reminderCursor.moveToNext()) {
			ReminderProxy reminder = new ReminderProxy();
			reminder.id = reminderCursor.getString(0);
			reminder.minutes = reminderCursor.getInt(1);
			reminder.method = reminderCursor.getInt(2);

			reminders.add(reminder);
		}

		reminderCursor.close();

		return reminders;
	}

	public static ReminderProxy createReminder(EventProxy event, int minutes, int method)
	{
		if (!CalendarProxy.hasCalendarPermissions()) {
			return null;
		}
		ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();
		ContentValues eventValues = new ContentValues();

		eventValues.put("minutes", minutes);
		eventValues.put("method", method);
		eventValues.put("event_id", event.getId());

		Uri reminderUri = contentResolver.insert(Uri.parse(getRemindersUri()), eventValues);
		Log.d("TiEvents",
			  "created reminder with uri: " + reminderUri + ", minutes: " + minutes + ", method: " + method
				  + ", event_id: " + event.getId(),
			  Log.DEBUG_MODE);

		String eventId = reminderUri.getLastPathSegment();
		ReminderProxy reminder = new ReminderProxy();
		reminder.id = eventId;
		reminder.minutes = minutes;
		reminder.method = method;

		return reminder;
	}

	@Kroll.method
	@Kroll.getProperty
	public String getId()
	{
		return id;
	}

	@Kroll.method
	@Kroll.getProperty
	public int getMinutes()
	{
		return minutes;
	}

	@Kroll.method
	@Kroll.getProperty
	public int getMethod()
	{
		return method;
	}

	@Override
	public String getApiName()
	{
		return "Ti.Calendar.Reminder";
	}
}

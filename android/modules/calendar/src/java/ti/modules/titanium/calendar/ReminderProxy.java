/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.calendar;

import java.util.ArrayList;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiContext;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;

@Kroll.proxy(parentModule=CalendarModule.class)
public class ReminderProxy extends KrollProxy {

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

	public ReminderProxy(TiContext context)
	{
		this();
	}

	public static String getRemindersUri()
	{
		return CalendarProxy.getBaseCalendarUri() + "/reminders";
	}

	public static ArrayList<ReminderProxy> getRemindersForEvent(EventProxy event)
	{
		ArrayList<ReminderProxy> reminders = new ArrayList<ReminderProxy>();
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

	public static ArrayList<ReminderProxy> getRemindersForEvent(TiContext context, EventProxy event)
	{
		return getRemindersForEvent(event);
	}

	public static ReminderProxy createReminder(EventProxy event, int minutes, int method)
	{
		ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();
		ContentValues eventValues = new ContentValues();

		eventValues.put("minutes", minutes);
		eventValues.put("method", method);
		eventValues.put("event_id", event.getId());

		Uri reminderUri = contentResolver.insert(Uri.parse(getRemindersUri()), eventValues);
		Log.d("TiEvents", "created reminder with uri: " + reminderUri + ", minutes: " + minutes + ", method: " + method
			+ ", event_id: " + event.getId(), Log.DEBUG_MODE);

		String eventId = reminderUri.getLastPathSegment();
		ReminderProxy reminder = new ReminderProxy();
		reminder.id = eventId;
		reminder.minutes = minutes;
		reminder.method = method;

		return reminder;
	}

	public static ReminderProxy createReminder(TiContext context, EventProxy event, int minutes, int method)
	{
		return createReminder(event, minutes, method);
	}

	@Kroll.getProperty @Kroll.method
	public String getId()
	{
		return id;
	}

	@Kroll.getProperty @Kroll.method
	public int getMinutes()
	{
		return minutes;
	}

	@Kroll.getProperty @Kroll.method
	public int getMethod()
	{
		return method;
	}
}

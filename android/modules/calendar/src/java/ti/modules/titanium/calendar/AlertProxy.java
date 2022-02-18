/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.calendar;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;

@Kroll.proxy(parentModule = CalendarModule.class)
public class AlertProxy extends KrollProxy
{
	public static final int STATE_SCHEDULED = 0;
	public static final int STATE_FIRED = 1;
	public static final int STATE_DISMISSED = 2;

	protected String id, eventId;
	protected Date begin, end;
	protected Date alarmTime;
	protected int state, minutes;

	public AlertProxy()
	{
		super();
	}

	public static String getAlertsUri()
	{
		return CalendarProxy.getBaseCalendarUri() + "/calendar_alerts";
	}

	public static String getAlertsInstanceUri()
	{
		return CalendarProxy.getBaseCalendarUri() + "/calendar_alerts/by_instance";
	}

	public static ArrayList<AlertProxy> queryAlerts(String query, String[] queryArgs, String orderBy)
	{
		ArrayList<AlertProxy> alerts = new ArrayList<>();
		if (!CalendarProxy.hasCalendarPermissions()) {
			return alerts;
		}
		ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();

		Cursor cursor =
			contentResolver.query(Uri.parse(getAlertsUri()),
								  new String[] { "_id", "event_id", "begin", "end", "alarmTime", "state", "minutes" },
								  query, queryArgs, orderBy);

		if (cursor != null) {
			while (cursor.moveToNext()) {
				AlertProxy alert = new AlertProxy();
				alert.id = cursor.getString(0);
				alert.eventId = cursor.getString(1);
				alert.begin = new Date(cursor.getLong(2));
				alert.end = new Date(cursor.getLong(3));
				alert.alarmTime = new Date(cursor.getLong(4));
				alert.state = cursor.getInt(5);
				alert.minutes = cursor.getInt(6);
				alerts.add(alert);
			}

			cursor.close();
		}

		return alerts;
	}

	public static ArrayList<AlertProxy> getAlertsForEvent(EventProxy event)
	{
		return queryAlerts("event_id = ?", new String[] { event.getId() }, "alarmTime ASC,begin ASC,title ASC");
	}

	public static AlertProxy createAlert(EventProxy event, int minutes)
	{
		if (!CalendarProxy.hasCalendarPermissions()) {
			return null;
		}
		ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();
		ContentValues values = new ContentValues();

		Calendar alarmTime = Calendar.getInstance();
		alarmTime.setTime(event.getBegin());
		alarmTime.add(Calendar.MINUTE, -minutes);

		values.put("event_id", event.getId());
		values.put("begin", event.getBegin().getTime());
		values.put("end", event.getEnd().getTime());
		values.put("alarmTime", alarmTime.getTimeInMillis());
		values.put("state", STATE_SCHEDULED);
		values.put("minutes", minutes);
		values.put("creationTime", System.currentTimeMillis());
		values.put("receivedTime", 0);
		values.put("notifyTime", 0);

		Uri alertUri = contentResolver.insert(Uri.parse(getAlertsUri()), values);
		String alertId = alertUri.getLastPathSegment();

		AlertProxy alert = new AlertProxy();
		alert.id = alertId;
		alert.begin = event.getBegin();
		alert.end = event.getEnd();
		alert.alarmTime = alarmTime.getTime();
		alert.state = STATE_SCHEDULED;
		alert.minutes = minutes;
		// FIXME this needs to be implemented alert.registerAlertIntent();
		return alert;
	}

	protected static final String EVENT_REMINDER_ACTION = "android.intent.action.EVENT_REMINDER";

	@Kroll.getProperty
	public String getId()
	{
		return id;
	}

	@Kroll.getProperty
	public String getEventId()
	{
		return eventId;
	}

	@Kroll.getProperty
	public Date getBegin()
	{
		return begin;
	}

	@Kroll.getProperty
	public Date getEnd()
	{
		return end;
	}

	@Kroll.getProperty
	public Date getAlarmTime()
	{
		return alarmTime;
	}

	@Kroll.getProperty
	public int getState()
	{
		return state;
	}

	@Kroll.getProperty
	public int getMinutes()
	{
		return minutes;
	}

	@Override
	public String getApiName()
	{
		return "Ti.Calendar.Alert";
	}
}

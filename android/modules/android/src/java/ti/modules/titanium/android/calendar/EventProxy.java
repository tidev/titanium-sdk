/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.android.calendar;

import java.util.ArrayList;
import java.util.Date;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiConvert;

import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.CalendarContract.Events;
import android.provider.CalendarContract.Instances;

// Columns and value constants taken from android.provider.Calendar in the android source base
@Deprecated
@Kroll.proxy(parentModule=CalendarModule.class)
public class EventProxy extends KrollProxy {
	public static final String TAG = "TiEvent";

	public static final int STATUS_TENTATIVE = 0;
	public static final int STATUS_CONFIRMED = 1;
	public static final int STATUS_CANCELED = 2;

	public static final int VISIBILITY_DEFAULT = 0;
	public static final int VISIBILITY_CONFIDENTIAL = 1;
	public static final int VISIBILITY_PRIVATE = 2;
	public static final int VISIBILITY_PUBLIC = 3;

	protected String id, title, description, location;
	protected Date begin, end;
	protected boolean allDay, hasAlarm = true, hasExtendedProperties = true;
	protected int status, visibility;
	protected KrollDict extendedProperties = new KrollDict();

	protected String recurrenceRule, recurrenceDate, recurrenceExceptionRule, recurrenceExceptionDate;
	protected Date lastDate;

	public EventProxy()
	{
		super();
	}

	public EventProxy(TiContext context)
	{
		this();
	}

	public static String getEventsUri()
	{
		return CalendarProxy.getBaseCalendarUri() + "/events";
	}

	public static String getInstancesWhenUri()
	{
		return CalendarProxy.getBaseCalendarUri() + "/instances/when";
	}

	public static String getExtendedPropertiesUri()
	{
		return CalendarProxy.getBaseCalendarUri() + "/extendedproperties";
	}

	public static ArrayList<EventProxy> queryEvents(String query, String[] queryArgs)
	{
		return queryEvents(Uri.parse(getEventsUri()), query, queryArgs, "dtstart ASC");
	}

	public static ArrayList<EventProxy> queryEvents(TiContext context, String query, String[] queryArgs)
	{
		return queryEvents(query, queryArgs);
	}

	public static ArrayList<EventProxy> queryEventsBetweenDates(long date1, long date2, String query, String[] queryArgs)
	{
		ArrayList<EventProxy> events = new ArrayList<EventProxy>();
		ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();

		Uri.Builder builder = Uri.parse(getInstancesWhenUri()).buildUpon();

		ContentUris.appendId(builder, date1);
		ContentUris.appendId(builder, date2);

		String visibility = "";
		if (Build.VERSION.SDK_INT >= 14) {
			visibility = Instances.ACCESS_LEVEL;
		} else {
			visibility = "visibility";
		}

		Cursor eventCursor = contentResolver.query(builder.build(), new String[] { "event_id", "title", "description",
			"eventLocation", "begin", "end", "allDay", "hasAlarm", "eventStatus", visibility }, query, queryArgs,
			"startDay ASC, startMinute ASC");

		if (eventCursor == null) {
			Log.w(TAG, "Unable to get any results when pulling events by date range");

			return events;
		}

		while (eventCursor.moveToNext()) {
			EventProxy event = new EventProxy();
			event.id = eventCursor.getString(0);
			event.title = eventCursor.getString(1);
			event.description = eventCursor.getString(2);
			event.location = eventCursor.getString(3);
			event.begin = new Date(eventCursor.getLong(4));
			event.end = new Date(eventCursor.getLong(5));
			event.allDay = !eventCursor.getString(6).equals("0");
			event.hasAlarm = !eventCursor.getString(7).equals("0");
			event.status = eventCursor.getInt(8);
			event.visibility = eventCursor.getInt(9);

			events.add(event);
		}

		eventCursor.close();

		return events;
	}

	public static ArrayList<EventProxy> queryEventsBetweenDates(TiContext context, long date1, long date2, String query,
		String[] queryArgs)
	{
		return queryEventsBetweenDates(date1, date2, query, queryArgs);
	}

	public static ArrayList<EventProxy> queryEvents(Uri uri, String query, String[] queryArgs, String orderBy)
	{
		ArrayList<EventProxy> events = new ArrayList<EventProxy>();
		ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();

		String visibility = "";
		if (Build.VERSION.SDK_INT >= 14) {
			visibility = Instances.ACCESS_LEVEL;
		} else {
			visibility = "visibility";
		}

		Cursor eventCursor = contentResolver.query(uri, new String[] { "_id", "title", "description", "eventLocation",
			"dtstart", "dtend", "allDay", "hasAlarm", "eventStatus", visibility, "hasExtendedProperties" }, query,
			queryArgs, orderBy);

		while (eventCursor.moveToNext()) {
			EventProxy event = new EventProxy();
			event.id = eventCursor.getString(0);
			event.title = eventCursor.getString(1);
			event.description = eventCursor.getString(2);
			event.location = eventCursor.getString(3);
			event.begin = new Date(eventCursor.getLong(4));
			event.end = new Date(eventCursor.getLong(5));
			event.allDay = !eventCursor.getString(6).equals("0");
			event.hasAlarm = !eventCursor.getString(7).equals("0");
			event.status = eventCursor.getInt(8);
			event.visibility = eventCursor.getInt(9);
			event.hasExtendedProperties = !eventCursor.getString(10).equals("0");

			events.add(event);
		}
		eventCursor.close();
		return events;
	}

	public static ArrayList<EventProxy> queryEvents(TiContext context, Uri uri, String query, String[] queryArgs,
		String orderBy)
	{
		return queryEvents(uri, query, queryArgs, orderBy);
	}

	public static EventProxy createEvent(CalendarProxy calendar, KrollDict data)
	{
		ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();
		EventProxy event = new EventProxy();

		ContentValues eventValues = new ContentValues();
		eventValues.put("hasAlarm", 1);
		eventValues.put("hasExtendedProperties", 1);

		if (!data.containsKey("title")) {
			Log.e(TAG, "Title was not created, no title found for event");
			return null;
		}

		event.title = TiConvert.toString(data, "title");
		eventValues.put("title", event.title);
		eventValues.put("calendar_id", calendar.getId());

		// ICS requires eventTimeZone field when inserting new event
		if (Build.VERSION.SDK_INT >= 14) {
			eventValues.put(Events.EVENT_TIMEZONE, new Date().toString());
		}

		if (data.containsKey(TiC.PROPERTY_LOCATION)) {
			event.location = TiConvert.toString(data, TiC.PROPERTY_LOCATION);
			eventValues.put(CalendarModule.EVENT_LOCATION, event.location);
		}
		if (data.containsKey("description")) {
			event.description = TiConvert.toString(data, "description");
			eventValues.put("description", event.description);
		}
		if (data.containsKey("begin")) {
			event.begin = TiConvert.toDate(data, "begin");
			if (event.begin != null) {
				eventValues.put("dtstart", event.begin.getTime());
			}
		}
		if (data.containsKey("end")) {
			event.end = TiConvert.toDate(data, "end");
			if (event.end != null) {
				eventValues.put("dtend", event.end.getTime());
			}
		}
		if (data.containsKey("allDay")) {
			event.allDay = TiConvert.toBoolean(data, "allDay");
			eventValues.put("allDay", event.allDay ? 1 : 0);
		}

		if (data.containsKey("hasExtendedProperties")) {
			event.hasExtendedProperties = TiConvert.toBoolean(data, "hasExtendedProperties");
			eventValues.put("hasExtendedProperties", event.hasExtendedProperties ? 1 : 0);
		}

		if (data.containsKey("hasAlarm")) {
			event.hasAlarm = TiConvert.toBoolean(data, "hasAlarm");
			eventValues.put("hasAlarm", event.hasAlarm ? 1 : 0);
		}

		Uri eventUri = contentResolver.insert(Uri.parse(CalendarProxy.getBaseCalendarUri() + "/events"), eventValues);
		Log.d("TiEvents", "created event with uri: " + eventUri, Log.DEBUG_MODE);

		String eventId = eventUri.getLastPathSegment();
		event.id = eventId;

		return event;
	}

	public static EventProxy createEvent(TiContext context, CalendarProxy calendar, KrollDict data)
	{
		return createEvent(calendar, data);
	}

	public static ArrayList<EventProxy> queryEventsBetweenDates(long date1, long date2, CalendarProxy calendar)
	{
		if (Build.VERSION.SDK_INT >= 11) {
			return queryEventsBetweenDates(date1, date2, null, null);
		} else {
			return queryEventsBetweenDates(date1, date2, "Calendars._id=" + calendar.getId(), null);
		}
	}

	public static ArrayList<EventProxy> queryEventsBetweenDates(TiContext context, long date1, long date2, CalendarProxy calendar)
	{
		return queryEventsBetweenDates(date1, date2, calendar);
	}

	@Kroll.method @Kroll.getProperty
	public ReminderProxy[] getReminders() {
		ArrayList<ReminderProxy> reminders = ReminderProxy.getRemindersForEvent(this);
		return reminders.toArray(new ReminderProxy[reminders.size()]);
	}

	@Kroll.method
	public ReminderProxy createReminder(KrollDict data)
	{
		int minutes = TiConvert.toInt(data, "minutes");
		int method = ReminderProxy.METHOD_DEFAULT;
		if (data.containsKey("method")) {
			method = TiConvert.toInt(data, "method");
		}

		return ReminderProxy.createReminder(this, minutes, method);
	}

	@Kroll.method @Kroll.getProperty
	public AlertProxy[] getAlerts()
	{
		ArrayList<AlertProxy> alerts = AlertProxy.getAlertsForEvent(this);
		return alerts.toArray(new AlertProxy[alerts.size()]);
	}

	@Kroll.method
	public AlertProxy createAlert(KrollDict data)
	{
		int minutes = TiConvert.toInt(data, "minutes");
		return AlertProxy.createAlert(this, minutes);
	}

	@Kroll.getProperty @Kroll.method
	public String getId()
	{
		return id;
	}

	@Kroll.getProperty @Kroll.method
	public String getTitle()
	{
		return title;
	}

	@Kroll.getProperty @Kroll.method
	public String getDescription()
	{
		return description;
	}

	@Kroll.getProperty @Kroll.method
	public String getLocation()
	{
		return location;
	}

	@Kroll.getProperty @Kroll.method
	public Date getBegin()
	{
		return begin;
	}

	@Kroll.getProperty @Kroll.method
	public Date getEnd() {
		return end;
	}

	@Kroll.getProperty @Kroll.method
	public boolean getAllDay() {
		return allDay;
	}

	@Kroll.getProperty @Kroll.method
	public boolean getHasAlarm() {
		return hasAlarm;
	}
	
	@Kroll.getProperty @Kroll.method
	public boolean getHasExtendedProperties() {
		return hasExtendedProperties;
	}
	
	@Kroll.getProperty @Kroll.method
	public int getStatus() {
		return status;
	}

	@Kroll.getProperty @Kroll.method
	public int getVisibility() {
		return visibility;
	}

	@Kroll.getProperty @Kroll.method
	public String getRecurrenceRule() {
		return recurrenceRule;
	}

	@Kroll.getProperty @Kroll.method
	public String getRecurrenceDate() {
		return recurrenceDate;
	}

	@Kroll.getProperty @Kroll.method
	public String getRecurrenceExceptionRule() {
		return recurrenceExceptionRule;
	}

	@Kroll.getProperty @Kroll.method
	public String getRecurrenceExceptionDate() {
		return recurrenceExceptionDate;
	}

	@Kroll.getProperty @Kroll.method
	public Date getLastDate() {
		return lastDate;
	}

	@Kroll.getProperty @Kroll.method
	public KrollDict getExtendedProperties() {
		KrollDict extendedProperties = new KrollDict();
		ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();
		Cursor extPropsCursor = contentResolver.query(
			Uri.parse(getExtendedPropertiesUri()),
			new String[] { "name", "value" }, "event_id = ?", new String[] { getId() }, null);
		
		while (extPropsCursor.moveToNext()) {
			String name = extPropsCursor.getString(0);
			String value = extPropsCursor.getString(1);
			extendedProperties.put(name, value);
		}
		extPropsCursor.close();
		return extendedProperties;
	}

	@Kroll.method
	public String getExtendedProperty(String name)
	{
		ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();
		Cursor extPropsCursor = contentResolver.query(Uri.parse(getExtendedPropertiesUri()), new String[] { "value" },
			"event_id = ? and name = ?", new String[] { getId(), name }, null);

		if (extPropsCursor != null && extPropsCursor.getCount() > 0) {
			extPropsCursor.moveToNext();
			String value = extPropsCursor.getString(0);
			extPropsCursor.close();
			return value;
		}

		return null;
	}

	@Kroll.method
	public void setExtendedProperty(String name, String value)
	{
		if (!hasExtendedProperties) {
			hasExtendedProperties = true;
		}
		Log.d("TiEvent", "set extended property: " + name + " = " + value, Log.DEBUG_MODE);

		// we need to update the DB
		ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();
		/*
		 * ContentValues eventValues = new ContentValues();
		 * eventValues.put("hasExtendedProperties", hasExtendedProperties);
		 * contentResolver.update(Uri.parse(getEventsUri()), eventValues, "_id = ?", new String[] { getId() });
		 */

		Uri extPropsUri = Uri.parse(getExtendedPropertiesUri());
		Cursor results = contentResolver.query(extPropsUri, new String[] { "name" }, "name = ? AND event_id = ?",
			new String[] { name, getId() }, null);

		ContentValues values = new ContentValues();
		values.put("name", name);
		values.put("value", value);
		int count = results.getCount();
		results.close();

		if (count == 1) {
			// android won't let us update, so we have to delete+insert
			contentResolver.delete(extPropsUri, "name = ? and event_id = ?", new String[] { name, getId() });
		}

		// insert the record
		values.put("event_id", getId());
		contentResolver.insert(extPropsUri, values);
	}
}

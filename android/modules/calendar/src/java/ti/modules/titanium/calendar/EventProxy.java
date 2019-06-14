/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.calendar;

import java.util.ArrayList;
import java.util.Date;

import android.provider.CalendarContract;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
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
@Kroll.proxy(parentModule = CalendarModule.class, propertyAccessors = { TiC.PROPERTY_RECURRENCE_RULES })
public class EventProxy extends KrollProxy
{

	public static final String TAG = "EventProxy";

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

	protected String recurrenceDate, recurrenceExceptionRule, recurrenceExceptionDate;
	protected Date lastDate;

	public EventProxy()
	{
		super();
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

	public static ArrayList<EventProxy> queryEventsBetweenDates(long date1, long date2, String query,
																String[] queryArgs)
	{
		ArrayList<EventProxy> events = new ArrayList<EventProxy>();
		if (!CalendarProxy.hasCalendarPermissions()) {
			return events;
		}
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

		Cursor eventCursor = contentResolver.query(builder.build(),
												   new String[] { "event_id", "title", "description", "eventLocation",
																  "begin", "end", "allDay", "hasAlarm", "eventStatus",
																  visibility, Events.RRULE, Events.CALENDAR_ID },
												   query, queryArgs, "startDay ASC, startMinute ASC");

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
			// Guarding against Cursor implementations which would throw an exception
			// instead of returning null if no recurrence rule is added to the event
			String recurrenceRule = null;
			try {
				recurrenceRule = eventCursor.getString(10);
			} catch (Exception e) {
				Log.w(TAG, "Trying to get a recurrence rule for an event without one.");
				e.printStackTrace();
			}
			event.setRecurrenceRules(recurrenceRule, eventCursor.getInt(11));
			events.add(event);
		}

		eventCursor.close();

		return events;
	}

	@Kroll.method
	public void save()
	{
		// Currently only saving added recurrenceRules.
		String ruleToSave =
			((RecurrenceRuleProxy) ((Object[]) getProperty(TiC.PROPERTY_RECURRENCE_RULES))[0]).generateRRULEString();
		ContentValues contentValues = new ContentValues();
		contentValues.put(Events.RRULE, ruleToSave);
		ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();
		try {
			contentResolver.update(Events.CONTENT_URI, contentValues, Events._ID + "=?", new String[] { id });
		} catch (IllegalArgumentException e) {
			Log.e(TAG, "Invalid event recurrence rule.");
		}
	}

	public static ArrayList<EventProxy> queryEvents(Uri uri, String query, String[] queryArgs, String orderBy)
	{
		ArrayList<EventProxy> events = new ArrayList<EventProxy>();
		if (!CalendarProxy.hasCalendarPermissions()) {
			return events;
		}
		ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();

		String visibility = "";
		if (Build.VERSION.SDK_INT >= 14) {
			visibility = Instances.ACCESS_LEVEL;
		} else {
			visibility = "visibility";
		}

		Cursor eventCursor = contentResolver.query(
			uri,
			new String[] { "_id", "title", "description", "eventLocation", "dtstart", "dtend", "allDay", "hasAlarm",
						   "eventStatus", visibility, Events.RRULE, Events.CALENDAR_ID, "hasExtendedProperties" },
			query, queryArgs, orderBy);

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
			event.hasExtendedProperties = !eventCursor.getString(12).equals("0");
			// Guarding against Cursor implementations which would throw an exception
			// instead of returning null if no recurrence rule is added to the event
			String recurrenceRule = null;
			try {
				recurrenceRule = eventCursor.getString(10);
			} catch (Exception e) {
				Log.w(TAG, "Trying to get a recurrence rule for an event without one.");
				e.printStackTrace();
			}
			event.setRecurrenceRules(recurrenceRule, eventCursor.getInt(11));
			events.add(event);
		}
		eventCursor.close();
		return events;
	}

	public static EventProxy createEvent(CalendarProxy calendar, KrollDict data)
	{
		ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();
		if (!CalendarProxy.hasCalendarPermissions()) {
			return null;
		}
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

	public static ArrayList<EventProxy> queryEventsBetweenDates(long date1, long date2, CalendarProxy calendar)
	{
		if (Build.VERSION.SDK_INT >= 11) {
			return queryEventsBetweenDates(date1, date2, "calendar_id=" + calendar.getId(), null);
		} else {
			return queryEventsBetweenDates(date1, date2, "Calendars._id=" + calendar.getId(), null);
		}
	}

	private Object setValueFromCursorForColumn(Cursor cursor, String columnName, Object defaultValue)
	{
		int columnIndex = cursor.getColumnIndex(columnName);
		if (columnIndex < 0) {
			//there is no such column
			Log.w(TAG, "No column with name '" + columnName + "' found. Setting a default value.");
		} else {
			try {
				if (defaultValue instanceof String) {
					return cursor.getString(columnIndex);
				} else if (defaultValue instanceof Integer) {
					return cursor.getInt(columnIndex);
				}
			} catch (Exception e) {
				Log.w(TAG, "Value of column '" + columnName
							   + "' type does not match required type. Setting a default value.");
				e.printStackTrace();
			}
		}
		return defaultValue;
	}

	private AttendeeProxy[] getAttendeeProxies()
	{
		AttendeeProxy[] result;
		final String[] attendeeProjection = new String[] { CalendarContract.Attendees._ID,
														   CalendarContract.Attendees.EVENT_ID,
														   CalendarContract.Attendees.ATTENDEE_NAME,
														   CalendarContract.Attendees.ATTENDEE_EMAIL,
														   CalendarContract.Attendees.ATTENDEE_TYPE,
														   CalendarContract.Attendees.ATTENDEE_RELATIONSHIP,
														   CalendarContract.Attendees.ATTENDEE_STATUS };
		final String query = "(" + CalendarContract.Attendees.EVENT_ID + " = ?)";
		final String[] args = new String[] { id };
		ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();
		final Cursor cursor =
			contentResolver.query(CalendarContract.Attendees.CONTENT_URI, attendeeProjection, query, args, null);
		int index = 0;
		if (cursor != null) {
			result = new AttendeeProxy[cursor.getCount()];
			while (cursor.moveToNext()) {
				//safely create parameters for Attendee
				String attendeeEmail =
					setValueFromCursorForColumn(cursor, CalendarContract.Attendees.ATTENDEE_EMAIL, "").toString();
				String attendeeName =
					setValueFromCursorForColumn(cursor, CalendarContract.Attendees.ATTENDEE_NAME, "").toString();
				int attendeeType = (Integer) setValueFromCursorForColumn(
					cursor, CalendarContract.Attendees.ATTENDEE_TYPE, CalendarModule.ATTENDEE_STATUS_NONE);
				int attendeeStatus = (Integer) setValueFromCursorForColumn(
					cursor, CalendarContract.Attendees.ATTENDEE_STATUS, CalendarModule.ATTENDEE_STATUS_NONE);
				int attendeeRelationship = (Integer) setValueFromCursorForColumn(
					cursor, CalendarContract.Attendees.ATTENDEE_RELATIONSHIP, CalendarModule.RELATIONSHIP_NONE);
				//create a proxy instance
				AttendeeProxy proxyForRow =
					new AttendeeProxy(attendeeEmail, attendeeName, attendeeType, attendeeStatus, attendeeRelationship);
				//add the proxy to the result array
				result[index++] = proxyForRow;
			}
		} else {
			result = new AttendeeProxy[0];
		}
		return result;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public ReminderProxy[] getReminders()
	// clang-format on
	{
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

	@Kroll.method
	RecurrenceRuleProxy createRecurrenceRule(KrollDict data)
	{
		return new RecurrenceRuleProxy(data);
	}

	// clang-format off
	@Kroll.method
  @Kroll.getProperty
	public AlertProxy[] getAlerts()
	// clang-format on
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

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getId()
	// clang-format on
	{
		return id;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getTitle()
	// clang-format on
	{
		return title;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getDescription()
	// clang-format on
	{
		return description;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getLocation()
	// clang-format on
	{
		return location;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public Date getBegin()
	// clang-format on
	{
		return begin;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public Date getEnd()
	// clang-format on
	{
		return end;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public boolean getAllDay()
	// clang-format on
	{
		return allDay;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public AttendeeProxy[] getAttendees()
	// clang-format on
	{
		return getAttendeeProxies();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public boolean getHasAlarm()
	// clang-format on
	{
		return hasAlarm;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public boolean getHasExtendedProperties()
	// clang-format on
	{
		return hasExtendedProperties;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getStatus()
	// clang-format on
	{
		return status;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getVisibility()
	// clang-format on
	{
		return visibility;
	}

	public void setRecurrenceRules(String rrule, int calendarID)
	{
		RecurrenceRuleProxy[] result = new RecurrenceRuleProxy[] {};
		if (rrule != null) {
			result = new RecurrenceRuleProxy[] { new RecurrenceRuleProxy(rrule, calendarID, begin) };
		}
		setProperty(TiC.PROPERTY_RECURRENCE_RULES, result);
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getRecurrenceDate()
	// clang-format on
	{
		return recurrenceDate;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getRecurrenceExceptionRule()
	// clang-format on
	{
		return recurrenceExceptionRule;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getRecurrenceExceptionDate()
	// clang-format on
	{
		return recurrenceExceptionDate;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public Date getLastDate()
	// clang-format on
	{
		return lastDate;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public KrollDict getExtendedProperties()
	// clang-format on
	{
		KrollDict extendedProperties = new KrollDict();
		if (!CalendarProxy.hasCalendarPermissions()) {
			return extendedProperties;
		}
		ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();
		Cursor extPropsCursor =
			contentResolver.query(Uri.parse(getExtendedPropertiesUri()), new String[] { "name", "value" },
								  "event_id = ?", new String[] { getId() }, null);

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
		if (!CalendarProxy.hasCalendarPermissions()) {
			return null;
		}
		ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();
		Cursor extPropsCursor =
			contentResolver.query(Uri.parse(getExtendedPropertiesUri()), new String[] { "value" },
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
		if (!CalendarProxy.hasCalendarPermissions()) {
			return;
		}
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

	@Override
	public String getApiName()
	{
		return "Ti.Calendar.Event";
	}
}

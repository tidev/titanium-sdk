/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2018 by Appcelerator, Inc. All Rights Reserved.
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
import android.text.format.DateUtils;

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

	protected String id, title, description, location, rrule;
	protected Date begin, end;
	protected Long duration;
	protected boolean allDay, hasAlarm = false, hasExtendedProperties = true, isInstance;
	protected int status, visibility;
	protected String calendarID;
	protected KrollDict extendedProperties = new KrollDict();

	protected String recurrenceDate, recurrenceExceptionRule, recurrenceExceptionDate;
	protected Date lastDate;

	public EventProxy()
	{
		super();
	}

	public EventProxy(TiContext context)
	{
		this();
	}

	private static long RFC2445ToMilliseconds(String str)
	{
		if (str == null || str.isEmpty())
			throw new IllegalArgumentException("Null or empty RFC string");

		int sign = 1;
		int weeks = 0;
		int days = 0;
		int hours = 0;
		int minutes = 0;
		int seconds = 0;

		int len = str.length();
		int index = 0;
		char c;

		c = str.charAt(0);

		if (c == '-') {
			sign = -1;
			index++;
		}

		else if (c == '+')
			index++;

		if (len < index)
			return 0;

		c = str.charAt(index);

		if (c != 'P')
			throw new IllegalArgumentException("Duration.parse(str='" + str + "') expected 'P' at index=" + index);

		index++;
		c = str.charAt(index);
		if (c == 'T')
			index++;

		int n = 0;
		for (; index < len; index++) {
			c = str.charAt(index);

			if (c >= '0' && c <= '9') {
				n *= 10;
				n += ((int) (c - '0'));
			}

			else if (c == 'W') {
				weeks = n;
				n = 0;
			}

			else if (c == 'H') {
				hours = n;
				n = 0;
			}

			else if (c == 'M') {
				minutes = n;
				n = 0;
			}

			else if (c == 'S') {
				seconds = n;
				n = 0;
			}

			else if (c == 'D') {
				days = n;
				n = 0;
			}

			else if (c == 'T') {
			} else
				throw new IllegalArgumentException("Duration.parse(str='" + str + "') unexpected char '" + c
												   + "' at index=" + index);
		}

		long factor = 1000 * sign;
		long result =
			factor
			* ((7 * 24 * 60 * 60 * weeks) + (24 * 60 * 60 * days) + (60 * 60 * hours) + (60 * minutes) + seconds);

		return result;
	}

	public static String getExtendedPropertiesUri()
	{
		return CalendarProxy.getBaseCalendarUri() + "/extendedproperties";
	}

	public static ArrayList<EventProxy> queryEvents(String query, String[] queryArgs)
	{
		return queryEvents(Events.CONTENT_URI, query, queryArgs, "dtstart ASC");
	}

	public static ArrayList<EventProxy> queryEvents(TiContext context, String query, String[] queryArgs)
	{
		return queryEvents(query, queryArgs);
	}

	public static ArrayList<EventProxy> queryEventsBetweenDates(long date1, long date2, String query,
																String[] queryArgs)
	{
		ArrayList<EventProxy> events = new ArrayList<EventProxy>();
		if (!CalendarProxy.hasCalendarPermissions()) {
			return events;
		}
		ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();

		Uri.Builder builder = Instances.CONTENT_URI.buildUpon();

		ContentUris.appendId(builder, date1);
		ContentUris.appendId(builder, date2);

		Uri builderBuilded = builder.build();

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
			event.duration = event.end.getTime() - event.begin.getTime();
			event.allDay = !eventCursor.getString(6).equals("0");
			event.hasAlarm = !eventCursor.getString(7).equals("0");
			event.status = eventCursor.getInt(8);
			event.visibility = eventCursor.getInt(9);
			event.rrule = eventCursor.getString(10);
			event.calendarID = eventCursor.getString(11);
			event.isInstance = true;

			events.add(event);
		}

		eventCursor.close();

		return events;
	}

	public static ArrayList<EventProxy> queryEventsBetweenDates(TiContext context, long date1, long date2, String query,
																String[] queryArgs)
	{
		return queryEventsBetweenDates(date1, date2, query, queryArgs);

		@Kroll.method
		public void save()
		{
			// Currently only saving added recurrenceRules.
			String ruleToSave = ((RecurrenceRuleProxy) ((Object[]) getProperty(TiC.PROPERTY_RECURRENCE_RULES))[0])
									.generateRRULEString();
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

			Cursor eventCursor = contentResolver.query(
				uri,
				new String[] { "_id", "title", "description", "eventLocation", "dtstart", "dtend", "allDay", "hasAlarm",
							   "eventStatus", visibility, "hasExtendedProperties" },
				query, queryArgs, orderBy);

			while (eventCursor.moveToNext()) {
				EventProxy event = new EventProxy();
				event.id = eventCursor.getString(0);
				event.title = eventCursor.getString(1);
				event.description = eventCursor.getString(2);
				event.location = eventCursor.getString(3);
				event.begin = new Date(eventCursor.getLong(4));
				event.end = new Date(eventCursor.getLong(5));
				event.allDay = !eventCursor.getString(7).equals("0");
				event.hasAlarm = !eventCursor.getString(8).equals("0");
				event.status = eventCursor.getInt(9);
				event.visibility = eventCursor.getInt(10);
				event.hasExtendedProperties = !eventCursor.getString(11).equals("0");
				event.rrule = eventCursor.getString(12);
				event.calendarID = eventCursor.getString(13);
				event.isInstance = uri == Instances.CONTENT_URI;

				if (eventCursor.getString(6) != null) {
					event.duration = RFC2445ToMilliseconds(eventCursor.getString(6));
				} else {
					event.duration = event.end.getTime() - event.begin.getTime();
				}

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
			EventProxy event = new EventProxy();

			event.calendarID = calendar.getId();

			if (data.containsKey("title")) {
				event.setTitle(TiConvert.toString(data, "title"));
			}
			if (data.containsKey(TiC.PROPERTY_LOCATION)) {
				event.setLocation(TiConvert.toString(data, TiC.PROPERTY_LOCATION));
			}
			if (data.containsKey("description")) {
				event.setDescription(TiConvert.toString(data, "description"));
			}
			if (data.containsKey("begin")) {
				event.setBegin(TiConvert.toDate(data, "begin"));
			}
			if (data.containsKey("end")) {
				event.setEnd(TiConvert.toDate(data, "end"));
			}
			if (data.containsKey("allDay")) {
				event.setAllDay(TiConvert.toBoolean(data, "allDay"));
			}
			if (data.containsKey("rrule")) {
				event.setRrule(TiConvert.toString(data, "rrule"));
			}
			if (data.containsKey("hasExtendedProperties")) {
				event.hasExtendedProperties = TiConvert.toBoolean(data, "hasExtendedProperties");
			}
			if (data.containsKey("hasAlarm")) {
				event.hasAlarm = TiConvert.toBoolean(data, "hasAlarm");
			}

			return event;
		}

		public static EventProxy createEvent(TiContext context, CalendarProxy calendar, KrollDict data)
		{
			return createEvent(calendar, data);
		}

		@Kroll.method
		public boolean save()
		{
			ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();
			if (!CalendarProxy.hasCalendarPermissions()) {
				Log.e(TAG, "Missing calendar permissions");
				return false;
			}

			ContentValues eventValues = new ContentValues();
			eventValues.put("hasAlarm", 0);
			eventValues.put("hasExtendedProperties", 1);

			Date start = begin;
			Date finish = end;

			if (isInstance == true) {
				ArrayList<EventProxy> events = queryEvents("_id = ?", new String[] { "" + id });
				if (events.size() > 0) {
					start = events.get(0).begin;
					finish = events.get(0).end;
				}
			}

			if (title == null) {
				Log.e(TAG, "Title was not created, no title found for event");
				return false;
			}

			if (calendarID == null) {
				Log.e(TAG, "Calendar ID was not created, no calendarID found for event");
				return false;
			}

			eventValues.put("title", title);
			eventValues.put("calendar_id", calendarID);

			// ICS requires eventTimeZone field when inserting new event
			eventValues.put(Events.EVENT_TIMEZONE, new Date().toString());

			if (location != null) {
				eventValues.put(CalendarModule.EVENT_LOCATION, location);
			}
			if (description != null) {
				eventValues.put("description", description);
			}
			if (start != null) {
				eventValues.put("dtstart", start.getTime());
			} else {
				Log.e(TAG, "Begin date was not created, no begin found for event");
				return false;
			}
			if (rrule != null) {
				eventValues.put("rrule", rrule);

				if (allDay == true) {
					Double days = Math.ceil(((duration + DateUtils.DAY_IN_MILLIS - 1) / DateUtils.DAY_IN_MILLIS));

					eventValues.put("duration", "P" + days.intValue() + "D");
				} else {
					Double seconds = Math.ceil((duration / DateUtils.SECOND_IN_MILLIS));

					eventValues.put("duration", "PT" + seconds.intValue() + "S");
				}
				eventValues.putNull("dtend");
			} else {
				eventValues.put("dtend", finish != null ? finish.getTime() : start.getTime());
				eventValues.putNull("duration");

				eventValues.put("allDay", allDay ? 1 : 0);
			}

			eventValues.put("hasExtendedProperties", hasExtendedProperties ? 1 : 0);

			eventValues.put("hasAlarm", hasAlarm ? 1 : 0);

			Uri eventUri = null;

			if (id != null) {
				eventUri = ContentUris.withAppendedId(Events.CONTENT_URI, Long.parseLong(id));
				int updatedRows = contentResolver.update(eventUri, eventValues, null, null);

				if (updatedRows <= 0) {
					eventUri = null;
				}
			} else {
				eventUri = contentResolver.insert(Events.CONTENT_URI, eventValues);
			}

			if (eventUri != null) {
				String eventId = eventUri.getLastPathSegment();

				if (eventId != null) {
					id = eventId;
				} else {
					Log.e(TAG, "Event not created.");
					return false;
				}
			} else {
				Log.e(TAG, "Event not created.");
				return false;
			}

			return true;
		}

		public static ArrayList<EventProxy> queryEventsBetweenDates(long date1, long date2, CalendarProxy calendar)
		{
			return queryEventsBetweenDates(date1, date2, "calendar_id = ?", new String[] { calendar.getId() });
		}

		public static ArrayList<EventProxy> queryEventsBetweenDates(TiContext context, long date1, long date2,
																	CalendarProxy calendar)
		{
			return queryEventsBetweenDates(date1, date2, calendar);
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
					AttendeeProxy proxyForRow = new AttendeeProxy(attendeeEmail, attendeeName, attendeeType,
																  attendeeStatus, attendeeRelationship);
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
	@Kroll.setProperty
	public void setTitle(String newTitle)
		// clang-format on
		{
			title = newTitle;
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
	@Kroll.setProperty
	public void setDescription(String newDescription)
		// clang-format on
		{
			description = newDescription;
		}

		// clang-format off
	@Kroll.method
	@Kroll.setProperty
  public String getLocation()
		// clang-format on
		{
			return location;
		}

		// clang-format off
	@Kroll.method
	@Kroll.setProperty
  public void setLocation(String newLocation)
		// clang-format on
		{
			location = newLocation;
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
	@Kroll.setProperty
  public void setBegin(Date newBegin)
		// clang-format on
		{
			begin = newBegin;

			setDuration();
		}

		// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public Date getEnd()
		// clang-format on
		{
			if (rrule != null) {
				return new Date(begin.getTime() + duration);
			} else {
				return end;
			}
		}

		// clang-format off
	@Kroll.method
	@Kroll.setProperty
 	public void setEnd(Date newEnd)
		// clang-format on
		{
			end = newEnd;

			setDuration();
		}

		private void setDuration()
		{
			Date start = new Date();
			Date finish = new Date();

			if (begin != null) {
				start = begin;
			}

			if (end != null) {
				finish = end;
			} else {
				finish = start;
			}

			duration = finish.getTime() - start.getTime();
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
	@Kroll.setProperty
  public void setAllDay(boolean newAllDay)
		// clang-format on
		{
			allDay = newAllDay;
		}

		// clang-format off
	@Kroll.method
	@Kroll.getProperty
  public AttendeeProxy[] getAttendees() {
			// clang-format on
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
	public String getCalendarID()
		// clang-format on
		{
			return calendarID;
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
  public String getRrule()
		// clang-format on
		{
			return rrule;
		}

		// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setRrule(String newRrule)
		// clang-format on
		{
			rrule = newRrule;
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

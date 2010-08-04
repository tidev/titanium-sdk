package ti.modules.titanium.android.calendar;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConvert;

import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;

// Columns and value constants taken from android.provider.Calendar in the android source base
public class EventProxy extends TiProxy {
	
	public static final int STATUS_TENTATIVE = 0;
	public static final int STATUS_CONFIRMED = 1;
	public static final int STATUS_CANCELED = 2;
	
	public static final int VISIBILITY_DEFAULT = 0;
	public static final int VISIBILITY_CONFIDENTIAL = 1;
	public static final int VISIBILITY_PRIVATE = 2;
	public static final int VISIBILITY_PUBLIC = 3;
	
	protected String id, title, description, location;
	protected Date begin, end;
	protected boolean allDay, hasAlarm, hasExtendedProperties;
	protected int status, visibility;
	protected TiDict extendedProperties = new TiDict();
	
	protected String recurrenceRule, recurrenceDate, recurrenceExceptionRule, recurrenceExceptionDate;
	protected Date lastDate;
	
	public EventProxy(TiContext context) {
		super(context);
	}
	
	public static String getEventsUri() {
		return CalendarProxy.getBaseCalendarUri() + "/events";
	}
	
	public static String getInstancesWhenUri() {
		return CalendarProxy.getBaseCalendarUri() + "/instances/when";
	}
	
	public static ArrayList<EventProxy> queryEvents(TiContext context, String query, String[] queryArgs) {
		return queryEvents(context, Uri.parse(getEventsUri()), query, queryArgs, "dtstart ASC");
	}
	
	public static ArrayList<EventProxy> queryEventsBetweenDates(TiContext context, long date1, long date2, String query, String[] queryArgs) {
		ArrayList<EventProxy> events = new ArrayList<EventProxy>();
		ContentResolver contentResolver = context.getActivity().getContentResolver();
		
		Uri.Builder builder = Uri.parse(getInstancesWhenUri()).buildUpon();
		ContentUris.appendId(builder, date1);
		ContentUris.appendId(builder, date2);
		
		Cursor eventCursor = contentResolver.query(builder.build(),
			new String[] { "event_id", "title", "description", "eventLocation", "begin", "end", "allDay", "hasAlarm", "eventStatus", "visibility"},
			query, queryArgs, "startDay ASC, startMinute ASC");
		
		while (eventCursor.moveToNext()) {
			EventProxy event = new EventProxy(context);
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
		return events;
	}
	
	public static ArrayList<EventProxy> queryEvents(TiContext context, Uri uri, String query, String[] queryArgs, String orderBy) {
		ArrayList<EventProxy> events = new ArrayList<EventProxy>();
		ContentResolver contentResolver = context.getActivity().getContentResolver();
		Cursor eventCursor = contentResolver.query(uri,
			new String[] { "_id", "title", "description", "eventLocation", "dtstart", "dtend", "allDay", "hasAlarm", "eventStatus", "visibility", "hasExtendedProperties"},
			query, queryArgs, orderBy);
		
		while (eventCursor.moveToNext()) {
			EventProxy event = new EventProxy(context);
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
			if (event.hasExtendedProperties) {
				Cursor extPropsCursor = contentResolver.query(
					Uri.parse(CalendarProxy.getBaseCalendarUri() + " /extendedproperties"),
					new String[] { "name", "value" }, "event_id = ?", new String[] { event.id }, null);
				
				while (extPropsCursor.moveToNext()) {
					String name = extPropsCursor.getString(0);
					String value = extPropsCursor.getString(1);
					event.extendedProperties.put(name, value);
				}
			}
			
			events.add(event);
		}
		return events;
	}
	
	public static EventProxy createEvent(TiContext context, CalendarProxy calendar, String title, String description, Date begin, Date end, boolean allDay) {
		ContentResolver contentResolver = context.getActivity().getContentResolver();
		ContentValues eventValues = new ContentValues();
		
		eventValues.put("title", title);
		eventValues.put("description", description);
		eventValues.put("dtstart", begin.getTime());
		eventValues.put("dtend", end.getTime());
		eventValues.put("calendar_id", calendar.getId());
		eventValues.put("hasAlarm", 1);
		
		if (allDay) {
			eventValues.put("allDay", 1);
		}
		
		Uri eventUri = contentResolver.insert(Uri.parse(CalendarProxy.getBaseCalendarUri()+"/events"), eventValues);
		Log.d("TiEvents", "created event with uri: " + eventUri);
		
		String eventId = eventUri.getLastPathSegment();
		EventProxy event = new EventProxy(context);
		event.id = eventId;
		event.title = title;
		event.description = description;
		event.begin = begin;
		event.end = end;
		event.allDay = allDay;
		
		return event;
	}
	
	public static ArrayList<EventProxy> queryEventsBetweenDates(TiContext context, long date1, long date2, CalendarProxy calendar) {
		return queryEventsBetweenDates(context, date1, date2, "Calendars._id="+calendar.getId(), null);
	}

	public ReminderProxy[] getReminders() {
		ArrayList<ReminderProxy> reminders = ReminderProxy.getRemindersForEvent(getTiContext(), this);
		return reminders.toArray(new ReminderProxy[reminders.size()]);
	}
	
	public ReminderProxy createReminder(TiDict data) {
		int minutes = TiConvert.toInt(data, "minutes");
		int method = ReminderProxy.METHOD_DEFAULT;
		if (data.containsKey("method")) {
			method = TiConvert.toInt(data, "method");
		}
		
		return ReminderProxy.createReminder(getTiContext(), this, minutes, method);
	}
	
	public AlertProxy[] getAlerts() {
		ArrayList<AlertProxy> alerts = AlertProxy.getAlertsForEvent(getTiContext(), this);
		return alerts.toArray(new AlertProxy[alerts.size()]);
	}
	
	public AlertProxy createAlert(TiDict data) {
		int minutes = TiConvert.toInt(data, "minutes");
		return AlertProxy.createAlert(getTiContext(), this, minutes);
	}
	
	public String getId() {
		return id;
	}

	public String getTitle() {
		return title;
	}

	public String getDescription() {
		return description;
	}

	public String getLocation() {
		return location;
	}

	public Date getBegin() {
		return begin;
	}

	public Date getEnd() {
		return end;
	}

	public boolean getAllDay() {
		return allDay;
	}

	public boolean getHasAlarm() {
		return hasAlarm;
	}
	
	public boolean getHasExtendedProperties() {
		return hasExtendedProperties;
	}
	
	
	public int getStatus() {
		return status;
	}

	public int getVisibility() {
		return visibility;
	}

	public String getRecurrenceRule() {
		return recurrenceRule;
	}

	public String getRecurrenceDate() {
		return recurrenceDate;
	}

	public String getRecurrenceExceptionRule() {
		return recurrenceExceptionRule;
	}

	public String getRecurrenceExceptionDate() {
		return recurrenceExceptionDate;
	}

	public Date getLastDate() {
		return lastDate;
	}
	
	public TiDict getExtendedProperties() {
		return extendedProperties;
	}
}

package ti.modules.titanium.android.calendar;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiProxy;

import android.content.ContentResolver;
import android.content.ContentUris;
import android.database.Cursor;
import android.net.Uri;
import android.text.format.DateUtils;

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
	protected boolean allDay, hasAlarm;
	protected int status, visibility;
	
	protected String recurrenceRule, recurrenceDate, recurrenceExceptionRule, recurrenceExceptionDate;
	protected Date lastDate;
	
	public EventProxy(TiContext context) {
		super(context);
	}

	public static ArrayList<EventProxy> queryEventsBetweenDates(TiContext context, long date1, long date2, String query, String[] queryArgs) {
		ArrayList<EventProxy> events = new ArrayList<EventProxy>();
		ContentResolver contentResolver = context.getActivity().getContentResolver();
		Uri.Builder builder = Uri.parse(CalendarProxy.getBaseCalendarUri()+"/instances/when").buildUpon();
		ContentUris.appendId(builder, date1);
		ContentUris.appendId(builder, date2);
		 
		Cursor eventCursor = contentResolver.query(builder.build(),
			new String[] { "_id", "title", "description", "eventLocation", "begin", "end", "allDay", "hasAlarm", "eventStatus", "visibility"},
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
	
	public static ArrayList<EventProxy> queryEventsBetweenDates(TiContext context, long date1, long date2, CalendarProxy calendar) {
		return queryEventsBetweenDates(context, date1, date2, "Calendars._id="+calendar.getId(), null);
	}

	public ReminderProxy[] getReminders() {
		ArrayList<ReminderProxy> reminders = ReminderProxy.getRemindersForEvent(getTiContext(), this);
		return reminders.toArray(new ReminderProxy[reminders.size()]);
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
}

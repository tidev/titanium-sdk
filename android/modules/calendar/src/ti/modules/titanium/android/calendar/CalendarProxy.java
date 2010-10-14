package ti.modules.titanium.android.calendar;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;

import android.content.ContentResolver;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.text.format.DateUtils;

public class CalendarProxy extends TiProxy {
	
	protected String id, name;
	protected boolean selected, hidden;
	protected int accessLevel;
	
	public static final int NO_ACCESS = 0;
	public static final int FREEBUSY_ACCESS = 100;
	public static final int READ_ACCESS = 200;
	public static final int RESPOND_ACCESS = 300;
	public static final int OVERRIDE_ACCESS = 400;
	public static final int CONTRIBUTOR_ACCESS = 500;
	public static final int EDITOR_ACCESS = 600;
	public static final int OWNER_ACCESS = 700;
	public static final int ROOT_ACCESS = 800;
	
	public CalendarProxy(TiContext context, String id, String name, boolean selected, boolean hidden, int accessLevel) {
		super(context);
		
		this.id = id;
		this.name = name;
		this.selected = selected;
		this.hidden = hidden;
		this.accessLevel = accessLevel;
	}

	public static String getBaseCalendarUri() {
		if (Build.VERSION.SDK_INT >= 8) {
			return "content://com.android.calendar";
		}
		
		return "content://calendar";
	}

	public static ArrayList<CalendarProxy> queryCalendars(TiContext context, String query, String[] queryArgs) {
		ArrayList<CalendarProxy> calendars = new ArrayList<CalendarProxy>();
		ContentResolver contentResolver = context.getActivity().getContentResolver();
		
		Cursor cursor = contentResolver.query(Uri.parse(getBaseCalendarUri() + "/calendars"),
			new String[] { "_id", "displayName", "selected", "hidden", "access_level" }, query, queryArgs, null);
		
		// calendars can be null
		if (cursor!=null)
		{
			while (cursor.moveToNext()) {
				String id = cursor.getString(0);
				String name = cursor.getString(1);
				boolean selected = !cursor.getString(2).equals("0");
				boolean hidden = !cursor.getString(3).equals("0");
				int accessLevel = cursor.getInt(4);
				
				calendars.add(new CalendarProxy(context, id, name, selected, hidden, accessLevel));
			}
		}
		
		return calendars;
	}
	
	public EventProxy[] getEventsInYear(int year) {
		Calendar jan1 = Calendar.getInstance();
		jan1.clear();
		jan1.set(year, 0, 1);
		
		long date1 = jan1.getTimeInMillis();
		long date2 = date1 + DateUtils.YEAR_IN_MILLIS;
		ArrayList<EventProxy> events = EventProxy.queryEventsBetweenDates(getTiContext(), date1, date2, this);
		return events.toArray(new EventProxy[events.size()]);
	}
	
	public EventProxy[] getEventsInMonth(int year, int month) {
		Calendar firstOfTheMonth = Calendar.getInstance();
		firstOfTheMonth.clear();
		firstOfTheMonth.set(year, month, 1);
		Calendar lastOfTheMonth = Calendar.getInstance();
		lastOfTheMonth.clear();
		lastOfTheMonth.set(year, month, 1, 23, 59, 59);
		
		int lastDay = lastOfTheMonth.getActualMaximum(Calendar.DAY_OF_MONTH);
		lastOfTheMonth.set(Calendar.DAY_OF_MONTH, lastDay);
		
		long date1 = firstOfTheMonth.getTimeInMillis();
		long date2 = lastOfTheMonth.getTimeInMillis();
		
		ArrayList<EventProxy> events = EventProxy.queryEventsBetweenDates(getTiContext(), date1, date2, this);
		return events.toArray(new EventProxy[events.size()]);
	}
	
	public EventProxy[] getEventsInDate(int year, int month, int day) {
		Calendar beginningOfDay = Calendar.getInstance();
		beginningOfDay.clear();
		beginningOfDay.set(year, month, day, 0, 0, 0);
		Calendar endOfDay = Calendar.getInstance();
		endOfDay.clear();
		endOfDay.set(year, month, day, 23, 59, 59);
		
		long date1 = beginningOfDay.getTimeInMillis();
		long date2 = endOfDay.getTimeInMillis();
		
		ArrayList<EventProxy> events = EventProxy.queryEventsBetweenDates(getTiContext(), date1, date2, this);
		return events.toArray(new EventProxy[events.size()]);
	}
	
	public EventProxy[] getEventsBetweenDates(Date date1, Date date2) {
		ArrayList<EventProxy> events = EventProxy.queryEventsBetweenDates(getTiContext(), date1.getTime(), date2.getTime(), this);
		return events.toArray(new EventProxy[events.size()]);
	}
	
	public EventProxy getEventById(int id) {
		ArrayList<EventProxy> events = EventProxy.queryEvents(getTiContext(), "_id = ?", new String[] { ""+id }, this);
		if (events.size() > 0) {
			return events.get(0);
		} else return null;
	}
	
	public EventProxy createEvent(TiDict data) {
		return EventProxy.createEvent(getTiContext(), this, data);
	}
	
	public String getName() {
		return name;
	}
	
	public String getId() {
		return id;
	}
	
	public boolean getSelected() {
		return selected;
	}
	
	public boolean getHidden() {
		return hidden;
	}
	
	public int getAccessLevel() {
		return accessLevel;
	}
	
	public String getAccessLevelString() {
		switch (accessLevel) {
			case NO_ACCESS: return "NO_ACCESS";
			case FREEBUSY_ACCESS: return "FREEBUSY_ACCESS";
			case READ_ACCESS: return "READ_ACCESS";
			case RESPOND_ACCESS: return "RESPOND_ACCESS";
			case OVERRIDE_ACCESS: return "OVERRIDE_ACCESS";
			case CONTRIBUTOR_ACCESS: return "CONTRIBUTOR_ACCESS";
			case EDITOR_ACCESS: return "EDITOR_ACCESS";
			case OWNER_ACCESS: return "OWNER_ACCESS";
			case ROOT_ACCESS: return "ROOT_ACCESS";
		}
		return "Couldn't find access level";
	}
}

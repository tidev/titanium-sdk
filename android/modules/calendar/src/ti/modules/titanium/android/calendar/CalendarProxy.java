package ti.modules.titanium.android.calendar;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.util.TiConvert;

import android.content.ContentResolver;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.text.format.DateUtils;

public class CalendarProxy extends TiProxy {

	protected String id, name;
	protected boolean selected, hidden;
	
	public CalendarProxy(TiContext context, String id, String name, boolean selected, boolean hidden) {
		super(context);
		
		this.id = id;
		this.name = name;
		this.selected = selected;
		this.hidden = hidden;
	}

	public static String getBaseCalendarUri() {
		if (Build.VERSION.RELEASE.contains("2.2")) {
			return "content://com.android.calendar";
		}
		
		return "content://calendar";
	}

	public static ArrayList<CalendarProxy> queryCalendars(TiContext context, String query, String[] queryArgs) {
		ArrayList<CalendarProxy> calendars = new ArrayList<CalendarProxy>();
		ContentResolver contentResolver = context.getActivity().getContentResolver();
		
		Cursor cursor = contentResolver.query(Uri.parse(getBaseCalendarUri() + "/calendars"),
			new String[] { "_id", "displayName", "selected", "hidden" }, query, queryArgs, null);
		
		while (cursor.moveToNext()) {
			String id = cursor.getString(0);
			String name = cursor.getString(1);
			boolean selected = !cursor.getString(2).equals("0");
			boolean hidden = !cursor.getString(3).equals("0");
			
			calendars.add(new CalendarProxy(context, id, name, selected, hidden));
		}
		
		return calendars;
	}
	
	public EventProxy[] getEventsInYear(int year) {
		Calendar jan1 = Calendar.getInstance();
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
	
	public EventProxy createEvent(TiDict data) {
		String title = TiConvert.toString(data, "title");
		String description = null;
		Date begin = null, end = null;
		boolean allDay = false;
		
		if (data.containsKey("description")) {
			description = TiConvert.toString(data, "description");
		}
		if (data.containsKey("begin")) {
			begin = TiConvert.toDate(data, "begin");
		}
		if (data.containsKey("end")) {
			end = TiConvert.toDate(data, "end");
		}
		if (data.containsKey("allDay")) {
			allDay = TiConvert.toBoolean(data, "allDay");
		}
		
		return EventProxy.createEvent(getTiContext(), this,
			title, description, begin, end, allDay);
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
}

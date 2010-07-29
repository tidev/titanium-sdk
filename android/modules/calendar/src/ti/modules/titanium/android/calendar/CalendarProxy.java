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
	
	public EventProxy[] getEventsInYear(int year) {
		ContentResolver contentResolver = getTiContext().getActivity().getContentResolver();
		ArrayList<EventProxy> events = new ArrayList<EventProxy>();
		Uri.Builder builder = Uri.parse(CalendarModule.getBaseCalendarUri()+"/instances/when").buildUpon();
		Calendar jan1 = Calendar.getInstance();
		jan1.set(year, 0, 1);
		
		long jan1Time = jan1.getTimeInMillis();
		ContentUris.appendId(builder, jan1Time);
		ContentUris.appendId(builder, jan1Time + DateUtils.YEAR_IN_MILLIS);
		 
		Cursor eventCursor = contentResolver.query(builder.build(),
				new String[] { "title", "begin", "end", "allDay"}, "Calendars._id=" + id,
				null, "startDay ASC, startMinute ASC");
		 
		while (eventCursor.moveToNext()) {
			String title = eventCursor.getString(0);
			Date begin = new Date(eventCursor.getLong(1));
			Date end = new Date(eventCursor.getLong(2));
			boolean allDay = !eventCursor.getString(3).equals("0");
			events.add(new EventProxy(getTiContext(), title, begin, end, allDay));
		}
		
		return events.toArray(new EventProxy[events.size()]);
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

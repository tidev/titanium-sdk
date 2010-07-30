package ti.modules.titanium.android.calendar;

import java.util.ArrayList;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiModule;

import android.content.ContentResolver;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;

public class CalendarModule extends TiModule {

	public CalendarModule(TiContext context) {
		super(context);
	}
	
	public static String getBaseCalendarUri() {
		if (Build.VERSION.RELEASE.contains("2.2")) {
			return "content://com.android.calendar";
		}
		
		return "content://calendar";
	}
	
	protected ArrayList<CalendarProxy> queryCalendars(String query, String[] queryArgs) {
		ArrayList<CalendarProxy> calendars = new ArrayList<CalendarProxy>();
		ContentResolver contentResolver = getTiContext().getActivity().getContentResolver();
		
		Cursor cursor = contentResolver.query(Uri.parse(getBaseCalendarUri() + "/calendars"),
			new String[] { "_id", "displayName", "selected", "hidden" }, query, queryArgs, null);
		
		while (cursor.moveToNext()) {
			String id = cursor.getString(0);
			String name = cursor.getString(1);
			boolean selected = !cursor.getString(2).equals("0");
			boolean hidden = !cursor.getString(3).equals("0");
			
			calendars.add(new CalendarProxy(getTiContext(), id, name, selected, hidden));
		}
		
		return calendars;
	}
	
	public CalendarProxy[] getAllCalendars() {
		ArrayList<CalendarProxy> calendars = queryCalendars(null, null);
		return calendars.toArray(new CalendarProxy[calendars.size()]);
	}
	
	public CalendarProxy[] getSelectableCalendars() {
		// selectable calendars are "selected" && !"hidden"
		ArrayList<CalendarProxy> calendars = queryCalendars("Calendars.selected = ? AND Calendars.hidden = ?", new String[] { "1", "0" });
		return calendars.toArray(new CalendarProxy[calendars.size()]);
	}
}

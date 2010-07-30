package ti.modules.titanium.android.calendar;

import java.util.ArrayList;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;

public class CalendarModule extends TiModule {
	protected static TiDict constants;
	
	public CalendarModule(TiContext context) {
		super(context);
	}
	
	@Override
	public TiDict getConstants() {
		if (constants == null) {
			constants = new TiDict();
			constants.put("STATUS_TENTATIVE", EventProxy.STATUS_TENTATIVE);
			constants.put("STATUS_CONFIRMED", EventProxy.STATUS_CONFIRMED);
			constants.put("STATUS_CANCELED", EventProxy.STATUS_CANCELED);
			constants.put("VISIBILITY_DEFAULT", EventProxy.VISIBILITY_DEFAULT);
			constants.put("VISIBILITY_CONFIDENTIAL", EventProxy.VISIBILITY_CONFIDENTIAL);
			constants.put("VISIBILITY_PRIVATE", EventProxy.VISIBILITY_PRIVATE);
			constants.put("VISIBILITY_PUBLIC", EventProxy.VISIBILITY_PUBLIC);
		}
		return constants;
	}
	
	public CalendarProxy[] getAllCalendars() {
		ArrayList<CalendarProxy> calendars = CalendarProxy.queryCalendars(getTiContext(), null, null);
		return calendars.toArray(new CalendarProxy[calendars.size()]);
	}
	
	public CalendarProxy[] getSelectableCalendars() {
		// selectable calendars are "selected" && !"hidden"
		ArrayList<CalendarProxy> calendars = CalendarProxy.queryCalendars(getTiContext(),
			"Calendars.selected = ? AND Calendars.hidden = ?", new String[] { "1", "0" });
		return calendars.toArray(new CalendarProxy[calendars.size()]);
	}
	
	public CalendarProxy getCalendarById(int id) {
		ArrayList<CalendarProxy> calendars = CalendarProxy.queryCalendars(getTiContext(),
			"Calendars._id = ?", new String[] { ""+id });
		
		if (calendars.size() > 0) {
			return calendars.get(0);
		} else {
			return null;
		}
	}
}

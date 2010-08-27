package ti.modules.titanium.android.calendar;

import java.util.ArrayList;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiContext;

public class CalendarModule extends TiModule {
	protected static KrollDict constants;
	
	public CalendarModule(TiContext context) {
		super(context);
	}
	
	@Override
	public KrollDict getConstants() {
		if (constants == null) {
			constants = new KrollDict();
			constants.put("STATUS_TENTATIVE", EventProxy.STATUS_TENTATIVE);
			constants.put("STATUS_CONFIRMED", EventProxy.STATUS_CONFIRMED);
			constants.put("STATUS_CANCELED", EventProxy.STATUS_CANCELED);
			
			constants.put("VISIBILITY_DEFAULT", EventProxy.VISIBILITY_DEFAULT);
			constants.put("VISIBILITY_CONFIDENTIAL", EventProxy.VISIBILITY_CONFIDENTIAL);
			constants.put("VISIBILITY_PRIVATE", EventProxy.VISIBILITY_PRIVATE);
			constants.put("VISIBILITY_PUBLIC", EventProxy.VISIBILITY_PUBLIC);
			
			constants.put("METHOD_ALERT", ReminderProxy.METHOD_ALERT);
			constants.put("METHOD_DEFAULT", ReminderProxy.METHOD_DEFAULT);
			constants.put("METHOD_EMAIL", ReminderProxy.METHOD_EMAIL);
			constants.put("METHOD_SMS", ReminderProxy.METHOD_SMS);
			
			constants.put("STATE_DISMISSED", AlertProxy.STATE_DISMISSED);
			constants.put("STATE_FIERD", AlertProxy.STATE_FIRED);
			constants.put("STATE_SCHEDULED", AlertProxy.STATE_SCHEDULED);
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
	
	public AlertProxy[] getAllAlerts() {
		ArrayList<AlertProxy> alerts = AlertProxy.queryAlerts(getTiContext(), null, null, null);
		return alerts.toArray(new AlertProxy[alerts.size()]);
	}
}

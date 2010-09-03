package ti.modules.titanium.android.calendar;

import java.util.ArrayList;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;

@Kroll.module
public class CalendarModule extends KrollModule {
	@Kroll.constant public static final int STATUS_TENTATIVE = EventProxy.STATUS_TENTATIVE;
	@Kroll.constant public static final int STATUS_CONFIRMED = EventProxy.STATUS_CONFIRMED;
	@Kroll.constant public static final int STATUS_CANCELED = EventProxy.STATUS_CANCELED;
	
	@Kroll.constant public static final int VISIBILITY_DEFAULT = EventProxy.VISIBILITY_DEFAULT;
	@Kroll.constant public static final int VISIBILITY_CONFIDENTIAL = EventProxy.VISIBILITY_CONFIDENTIAL;
	@Kroll.constant public static final int VISIBILITY_PRIVATE = EventProxy.VISIBILITY_PRIVATE;
	@Kroll.constant public static final int VISIBILITY_PUBLIC = EventProxy.VISIBILITY_PUBLIC;
	
	@Kroll.constant public static final int METHOD_ALERT = ReminderProxy.METHOD_ALERT;
	@Kroll.constant public static final int METHOD_DEFAULT = ReminderProxy.METHOD_DEFAULT;
	@Kroll.constant public static final int METHOD_EMAIL = ReminderProxy.METHOD_EMAIL;
	@Kroll.constant public static final int METHOD_SMS = ReminderProxy.METHOD_SMS;
	
	@Kroll.constant public static final int STATE_DISMISSED = AlertProxy.STATE_DISMISSED;
	@Kroll.constant public static final int STATE_FIERD = AlertProxy.STATE_FIRED;
	@Kroll.constant public static final int STATE_SCHEDULED = AlertProxy.STATE_SCHEDULED;
	
	public CalendarModule(TiContext context) {
		super(context);
	}
	
	@Kroll.getProperty @Kroll.method
	public CalendarProxy[] getAllCalendars() {
		ArrayList<CalendarProxy> calendars = CalendarProxy.queryCalendars(getTiContext(), null, null);
		return calendars.toArray(new CalendarProxy[calendars.size()]);
	}
	
	@Kroll.getProperty @Kroll.method
	public CalendarProxy[] getSelectableCalendars() {
		// selectable calendars are "selected" && !"hidden"
		ArrayList<CalendarProxy> calendars = CalendarProxy.queryCalendars(getTiContext(),
			"Calendars.selected = ? AND Calendars.hidden = ?", new String[] { "1", "0" });
		return calendars.toArray(new CalendarProxy[calendars.size()]);
	}
	
	@Kroll.method
	public CalendarProxy getCalendarById(int id) {
		ArrayList<CalendarProxy> calendars = CalendarProxy.queryCalendars(getTiContext(),
			"Calendars._id = ?", new String[] { ""+id });
		
		if (calendars.size() > 0) {
			return calendars.get(0);
		} else {
			return null;
		}
	}
	
	@Kroll.getProperty @Kroll.method
	public AlertProxy[] getAllAlerts() {
		ArrayList<AlertProxy> alerts = AlertProxy.queryAlerts(getTiContext(), null, null, null);
		return alerts.toArray(new AlertProxy[alerts.size()]);
	}
}

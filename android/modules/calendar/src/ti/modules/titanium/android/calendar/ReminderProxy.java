package ti.modules.titanium.android.calendar;

import java.util.ArrayList;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiProxy;

import android.content.ContentResolver;
import android.database.Cursor;
import android.net.Uri;

public class ReminderProxy extends TiProxy {

	public static final int METHOD_DEFAULT = 0;
	public static final int METHOD_ALERT = 1;
	public static final int METHOD_EMAIL = 2;
	public static final int METHOD_SMS = 3;
	
	protected int minutes, method;
	
	public ReminderProxy(TiContext context) {
		super(context);
	}
	
	public static ArrayList<ReminderProxy> getRemindersForEvent(TiContext context, EventProxy event) {
		ArrayList<ReminderProxy> reminders = new ArrayList<ReminderProxy>();
		ContentResolver contentResolver = context.getActivity().getContentResolver();
		Uri uri = Uri.parse(CalendarProxy.getBaseCalendarUri()+"/reminders");
		 
		Cursor reminderCursor = contentResolver.query(uri,
			new String[] { "minutes", "method" },
			"event_id = ?", new String[] { event.getId() }, null);
		
		while (reminderCursor.moveToNext()) {
			ReminderProxy reminder = new ReminderProxy(context);
			reminder.minutes = reminderCursor.getInt(0);
			reminder.method = reminderCursor.getInt(1);
			
			reminders.add(reminder);
		}
		return reminders;
	}
	
	public int getMinutes() {
		return minutes;
	}
	
	public int getMethod() {
		return method;
	}
}

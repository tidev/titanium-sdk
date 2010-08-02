package ti.modules.titanium.android.calendar;

import java.util.ArrayList;
import java.util.Date;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.util.Log;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;

public class ReminderProxy extends TiProxy {

	public static final int METHOD_DEFAULT = 0;
	public static final int METHOD_ALERT = 1;
	public static final int METHOD_EMAIL = 2;
	public static final int METHOD_SMS = 3;
	
	protected String id;
	protected int minutes, method;
	
	public ReminderProxy(TiContext context) {
		super(context);
	}
	
	public static ArrayList<ReminderProxy> getRemindersForEvent(TiContext context, EventProxy event) {
		ArrayList<ReminderProxy> reminders = new ArrayList<ReminderProxy>();
		ContentResolver contentResolver = context.getActivity().getContentResolver();
		Uri uri = Uri.parse(CalendarProxy.getBaseCalendarUri()+"/reminders");
		 
		Cursor reminderCursor = contentResolver.query(uri,
			new String[] { "_id", "minutes", "method" },
			"event_id = ?", new String[] { event.getId() }, null);
		
		while (reminderCursor.moveToNext()) {
			ReminderProxy reminder = new ReminderProxy(context);
			reminder.id = reminderCursor.getString(0);
			reminder.minutes = reminderCursor.getInt(1);
			reminder.method = reminderCursor.getInt(2);
			
			reminders.add(reminder);
		}
		return reminders;
	}
	
	public static ReminderProxy createReminder(TiContext context, EventProxy event, int minutes, int method) {
		ContentResolver contentResolver = context.getActivity().getContentResolver();
		ContentValues eventValues = new ContentValues();
		
		eventValues.put("minutes", minutes);
		eventValues.put("method", method);
		eventValues.put("event_id", event.getId());
		
		Uri reminderUri = contentResolver.insert(Uri.parse(CalendarProxy.getBaseCalendarUri()+"/reminders"), eventValues);
		Log.d("TiEvents", "created reminder with uri: " + reminderUri);
		
		String eventId = reminderUri.getLastPathSegment();
		ReminderProxy reminder = new ReminderProxy(context);
		reminder.id = eventId;
		reminder.minutes = minutes;
		reminder.method = method;
		
		return reminder;
	}
	
	public String getId() {
		return id;
	}
	
	public int getMinutes() {
		return minutes;
	}
	
	public int getMethod() {
		return method;
	}
}

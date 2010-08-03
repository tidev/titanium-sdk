package ti.modules.titanium.android.calendar;

import java.util.ArrayList;
import java.util.Date;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiProxy;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;

public class AlertProxy extends TiProxy {

	public static final int STATE_SCHEDULED = 0;
	public static final int STATE_FIRED = 1;
	public static final int STATE_DISMISSED = 2;
	
	protected String id;
	protected Date begin, end;
	protected Date alarmTime, creationTime, receivedTime, notifyTime;
	protected int state, minutes;
	
	public AlertProxy(TiContext context) {
		super(context);
	}
	
	public static String getAlertsUri() {
		return CalendarProxy.getBaseCalendarUri() + "/calendar_alerts";
	}
	
	public static String getAlertsInstanceUri() {
		return CalendarProxy.getBaseCalendarUri() + "/calendar_alerts/by_instance";
	}
	
	public static ArrayList<AlertProxy> queryAlerts(TiContext context, String query, String queryArgs[], String orderBy) {
		ArrayList<AlertProxy> alerts = new ArrayList<AlertProxy>();
		ContentResolver contentResolver = context.getActivity().getContentResolver();
		
		Cursor cursor = contentResolver.query(Uri.parse(getAlertsUri()),
			new String[] { "_id", "begin", "end", "alarmTime", "creationTime", "receivedTime", "notifyTime", "state", "minutes"},
			query, queryArgs, orderBy);
		
		while (cursor.moveToNext()) {
			AlertProxy alert = new AlertProxy(context);
			alert.id = cursor.getString(0);
			alert.begin = new Date(cursor.getLong(1));
			alert.end = new Date(cursor.getLong(2));
			alert.alarmTime = new Date(cursor.getLong(3));
			alert.creationTime = new Date(cursor.getLong(4));
			alert.receivedTime = new Date(cursor.getLong(5));
			alert.notifyTime = new Date(cursor.getLong(6));
			alert.state = cursor.getInt(7);
			alert.minutes = cursor.getInt(8);
			alerts.add(alert);
		}
		
		return alerts;
	}
	
	public static ArrayList<AlertProxy> getAlertsForEvent(TiContext context, EventProxy event) {
		return queryAlerts(context, "Events._id = ?", new String[] { event.getId() }, "alarmTime ASC,begin ASC,title ASC");
	}
	
	public static AlertProxy createAlert(TiContext context, EventProxy event, Date begin, Date end, Date alarmTime, int minutes) {
		ContentResolver contentResolver = context.getActivity().getContentResolver();
		ContentValues values = new ContentValues();
		values.put("event_id", event.getId());
		values.put("begin", begin.getTime());
		values.put("end", end.getTime());
		values.put("alarmTime", alarmTime.getTime());
		
		long creationTime = System.currentTimeMillis();
		values.put("creationTime", creationTime);
		values.put("receivedTime", 0);
		values.put("notifyTime", 0);
		values.put("state", STATE_SCHEDULED);
		values.put("minutes", minutes);
		
		Uri alertUri = contentResolver.insert(Uri.parse(getAlertsUri()), values);
		String alertId = alertUri.getLastPathSegment();
		
		AlertProxy alert = new AlertProxy(context);
		alert.id = alertId;
		alert.begin = begin;
		alert.end = end;
		alert.alarmTime = alarmTime;
		alert.minutes = minutes;
		alert.creationTime = new Date(creationTime);
		alert.state = STATE_SCHEDULED;
		
		return alert;
	}

	public String getId() {
		return id;
	}

	public Date getBegin() {
		return begin;
	}

	public Date getEnd() {
		return end;
	}

	public Date getAlarmTime() {
		return alarmTime;
	}

	public Date getCreationTime() {
		return creationTime;
	}

	public Date getReceivedTime() {
		return receivedTime;
	}

	public Date getNotifyTime() {
		return notifyTime;
	}

	public int getState() {
		return state;
	}

	public int getMinutes() {
		return minutes;
	}
	
	
}

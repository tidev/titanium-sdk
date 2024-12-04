/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.calendar;

import static ti.modules.titanium.calendar.EventProxy.getEventsUri;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.CalendarContract;
import android.text.format.DateUtils;
import android.content.ContentProviderOperation;
import android.content.ContentProviderResult;
import android.content.OperationApplicationException;
import android.os.RemoteException;

@Kroll.proxy(parentModule = CalendarModule.class)
public class CalendarProxy extends KrollProxy
{
	protected String id, name;
	private static final String TAG = "Calendar";
	protected boolean selected, hidden;
	private static final long MAX_DATE_RANGE = 2 * DateUtils.YEAR_IN_MILLIS - 3 * DateUtils.DAY_IN_MILLIS;

	public CalendarProxy(String id, String name, boolean selected, boolean hidden)
	{
		super();

		this.id = id;
		this.name = name;
		this.selected = selected;
		this.hidden = hidden;
	}

	public static String getBaseCalendarUri()
	{
		return "content://com.android.calendar";
	}

	public static ArrayList<CalendarProxy> queryCalendars(String query, String[] queryArgs)
	{
		ArrayList<CalendarProxy> calendars = new ArrayList<>();
		if (!hasCalendarPermissions()) {
			return calendars;
		}

		Cursor cursor = null;
		try {
			ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();
			cursor = contentResolver.query(
				Uri.parse(getBaseCalendarUri() + "/calendars"),
				new String[] { "_id", "calendar_displayName", "visible" },
				query,
				queryArgs,
				null);
			if (cursor != null) {
				while (cursor.moveToNext()) {
					String id = cursor.getString(0);
					String name = cursor.getString(1);
					boolean selected = !cursor.getString(2).equals("0");
					boolean hidden = false;
					calendars.add(new CalendarProxy(id, name, selected, hidden));
				}
			}
		} finally {
			if (cursor != null) {
				cursor.close();
			}
		}

		return calendars;
	}

	public static boolean hasCalendarPermissions()
	{
		if (Build.VERSION.SDK_INT < 23) {
			return true;
		}
		Activity currentActivity = TiApplication.getAppCurrentActivity();
		if (currentActivity != null
			&& currentActivity.checkSelfPermission("android.permission.READ_CALENDAR")
				   == PackageManager.PERMISSION_GRANTED
			&& currentActivity.checkSelfPermission("android.permission.WRITE_CALENDAR")
				   == PackageManager.PERMISSION_GRANTED) {
			return true;
		}
		Log.w(TAG, "Calendar permissions are missing");
		return false;
	}

	@Kroll.method
	public EventProxy[] getEventsInYear(int year)
	{
		String warningMessage
			= "getEventsInYear(year) has been deprecated in 7.0.0 in favor of getEventsBetweenDates(date1, date2) "
			+ "to avoid platform-differences of the month-index between iOS and Android";
		Log.w(TAG, warningMessage);

		Calendar jan1 = Calendar.getInstance();
		jan1.clear();
		jan1.set(year, 0, 1);

		long date1 = jan1.getTimeInMillis();
		long date2 = date1 + DateUtils.YEAR_IN_MILLIS;
		ArrayList<EventProxy> events = EventProxy.queryEventsBetweenDates(date1, date2, this);
		return events.toArray(new EventProxy[0]);
	}

	@Kroll.method
	public EventProxy[] getEventsInMonth(int year, int month)
	{
		String warningMessage
			= "getEventsInMonth(year, month) has been deprecated in 7.0.0 in favor of "
			+ "getEventsBetweenDates(date1, date2) to avoid platform-differences of the month-index "
			+ "between iOS and Android";
		Log.w(TAG, warningMessage);

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

		ArrayList<EventProxy> events = EventProxy.queryEventsBetweenDates(date1, date2, this);
		return events.toArray(new EventProxy[0]);
	}

	@Kroll.method
	public EventProxy[] getEventsInDate(int year, int month, int day)
	{
		Calendar beginningOfDay = Calendar.getInstance();
		beginningOfDay.clear();
		beginningOfDay.set(year, month, day, 0, 0, 0);
		Calendar endOfDay = Calendar.getInstance();
		endOfDay.clear();
		endOfDay.set(year, month, day, 23, 59, 59);

		long date1 = beginningOfDay.getTimeInMillis();
		long date2 = endOfDay.getTimeInMillis();

		ArrayList<EventProxy> events = EventProxy.queryEventsBetweenDates(date1, date2, this);
		return events.toArray(new EventProxy[0]);
	}

	@Kroll.method
	public EventProxy[] getEventsBetweenDates(Date date1, Date date2)
	{
		long start = date1.getTime();
		long end = date2.getTime();
		ArrayList<EventProxy> events = new ArrayList<>();

		// A workaround for TIMOB-8439
		while (end - start > MAX_DATE_RANGE) {
			events.addAll(EventProxy.queryEventsBetweenDates(start, start + MAX_DATE_RANGE, this));
			start += MAX_DATE_RANGE;
		}

		events.addAll(EventProxy.queryEventsBetweenDates(start, end, this));

		return events.toArray(new EventProxy[0]);
	}

	@Kroll.method
	public EventProxy getEventById(int id)
	{
		ArrayList<EventProxy> events = EventProxy.queryEvents("_id = ?", new String[] { "" + id });
		if (events.size() > 0) {
			return events.get(0);
		} else
			return null;
	}

	@Kroll.method
	public EventProxy[] getEventsById(Object args)
	{
		ArrayList<EventProxy> events = new ArrayList<>();

		if (args instanceof Object[] eventIds && eventIds.length > 0) {
			String query = CalendarUtils.prepareQuerySelection("_id", eventIds.length);
			String[] queryArgs = CalendarUtils.prepareQueryArguments(eventIds);

			events.addAll(EventProxy.queryEvents(query, queryArgs));
		}

		return events.toArray(new EventProxy[0]);
	}

	@Kroll.method
	public EventProxy createEvent(KrollDict data)
	{
		return EventProxy.createEvent(this, data);
	}

	@Kroll.method
	public EventProxy[] createEvents(Object data)
	{
		// Validate arguments to be an array.
		if (!(data instanceof Object[] dataList && dataList.length > 0)) {
			Log.e(TAG, "Argument expected to be an array.");
			return null;
		}

		// Check for permissions.
		ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();
		if (!hasCalendarPermissions()) {
			Log.e(TAG, "Calendar permissions are missing.");
			return null;
		}

		ArrayList<ContentProviderOperation> operations = new ArrayList<>();
		ArrayList<EventProxy> eventProxies = new ArrayList<>();
		Map<Integer, Integer> proxyResultIndexMapping = new HashMap<>();

		for (int i = 0, firstIndex = 0; i < dataList.length; i++) {
			KrollDict krollDict = new KrollDict((HashMap) dataList[i]);

			EventProxy eventProxy = new EventProxy();
			ContentValues contentValues = CalendarUtils.createContentValues(this, krollDict, eventProxy);

			// We cannot pass null data to ContentProviderOperation.
			// Necessary to keep track of non-null items later.
			if (contentValues == null) {
				eventProxies.add(null);
				Log.e(TAG, "Title was not created, no title found for event");
				continue;
			}

			ContentProviderOperation.Builder builder = ContentProviderOperation
				.newInsert(CalendarContract.Events.CONTENT_URI)
				.withValues(contentValues);

			operations.add(builder.build());
			eventProxies.add(eventProxy);

			proxyResultIndexMapping.put(i, firstIndex);
			firstIndex++;
		}

		try {
			// Execute the batch operation
			ContentProviderResult[] results = contentResolver.applyBatch(
				getEventsUri().getAuthority(),
				operations
			);

			// Find non-null proxies and map their IDs
			for (int proxyIndex : proxyResultIndexMapping.keySet()) {
				int proxyIndexInResults = proxyResultIndexMapping.get(proxyIndex);
				Uri eventUri = results[proxyIndexInResults].uri;

				if (eventUri != null) {
					// Set event id to proxy.
					eventProxies.get(proxyIndex).id = eventUri.getLastPathSegment();
				} else {
					// Event failed to get a proper URI path, should set to null in this case too.
					eventProxies.set(proxyIndex, null);
				}
			}

			return eventProxies.toArray(new EventProxy[0]);

		} catch (RemoteException | OperationApplicationException e) {
			Log.e(TAG, "Batch insert operation failed: " + e.getMessage());
			return null;
		}
	}

	@Kroll.method
	public int deleteEvents(Object args)
	{
		int deletedCount = 0;

		// Validate arguments to be an array.
		if (!(args instanceof Object[] eventIds && eventIds.length > 0)) {
			Log.e(TAG, "Argument expected to be an array.");
			return deletedCount;
		}

		// Check for permissions.
		ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();
		if (!CalendarProxy.hasCalendarPermissions()) {
			Log.e(TAG, "Calendar permissions are missing.");
			return deletedCount;
		}

		String query = CalendarUtils.prepareQuerySelection("_id", eventIds.length);
		String[] queryArgs = CalendarUtils.prepareQueryArguments(eventIds);

		ArrayList<ContentProviderOperation> operations = new ArrayList<>();
		ContentProviderOperation.Builder builder = ContentProviderOperation
			.newDelete(CalendarContract.Events.CONTENT_URI)
				.withSelection(query, queryArgs);

		operations.add(builder.build());

		try {
			// Execute the batch operation
			ContentProviderResult[] results = contentResolver.applyBatch(
				getEventsUri().getAuthority(),
				operations
			);

			if (results.length > 0 && results[0].count != null) {
				deletedCount = results[0].count;
			}

		} catch (RemoteException | OperationApplicationException e) {
			Log.e(TAG, "Batch deletion failed: " + e.getMessage());
		}

		return deletedCount;
	}

	@Kroll.getProperty
	public String getName()
	{
		return name;
	}

	@Kroll.getProperty
	public String getId()
	{
		return id;
	}

	@Kroll.getProperty
	public boolean getSelected()
	{
		return selected;
	}

	@Kroll.getProperty
	public boolean getHidden()
	{
		return hidden;
	}

	@Override
	public String getApiName()
	{
		return "Ti.Calendar.Calendar";
	}
}

/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.calendar;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiConvert;

import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.CalendarContract;
import android.provider.CalendarContract.Calendars;
import android.text.format.DateUtils;

@Kroll.proxy(parentModule=CalendarModule.class)
public class CalendarProxy extends KrollProxy {

	public static final int ACCESS_NONE = Calendars.CAL_ACCESS_NONE;
	public static final int ACCESS_FREEBUSY = Calendars.CAL_ACCESS_FREEBUSY;
	public static final int ACCESS_READ = Calendars.CAL_ACCESS_READ;
	public static final int ACCESS_RESPOND = Calendars.CAL_ACCESS_RESPOND;
	public static final int ACCESS_OVERRIDE = Calendars.CAL_ACCESS_OVERRIDE;
	public static final int ACCESS_CONTRIBUTOR = Calendars.CAL_ACCESS_CONTRIBUTOR;
	public static final int ACCESS_EDITOR = Calendars.CAL_ACCESS_EDITOR;
	public static final int ACCESS_OWNER = Calendars.CAL_ACCESS_OWNER;
	public static final int ACCESS_ROOT = Calendars.CAL_ACCESS_ROOT;
	
	protected String id, name, accountName, accountType;
	protected boolean selected, hidden;
	private static final long MAX_DATE_RANGE = 2 * DateUtils.YEAR_IN_MILLIS - 3 * DateUtils.DAY_IN_MILLIS;

	public CalendarProxy(String id, String name, boolean selected, boolean hidden, String accountName, String accountType)
	{
		super();

		this.id = id;
		this.name = name;
		this.selected = selected;
		this.hidden = hidden;
		this.accountName = accountName;
		this.accountType = accountType;
	}

	public CalendarProxy(TiContext context, String id, String name, boolean selected, boolean hidden, String accountName, String accountType)
	{
		this(id, name, selected, hidden, accountName, accountType);
	}

	public static String getBaseCalendarUri()
	{
		if (Build.VERSION.SDK_INT >= 8) { // FROYO, 2.2
			return "content://com.android.calendar";
		}

		return "content://calendar";
	}

	public static ArrayList<CalendarProxy> queryCalendars(String query, String[] queryArgs)
	{
		ArrayList<CalendarProxy> calendars = new ArrayList<CalendarProxy>();
		ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();

		Cursor cursor = null;
		if (Build.VERSION.SDK_INT >= 14) { // ICE_CREAM_SANDWICH, 4.0
			cursor = contentResolver.query(Uri.parse(getBaseCalendarUri() + "/calendars"),
				new String[] { "_id", "calendar_displayName", "visible", "account_name", "account_type"}, query, queryArgs, null);
		}
		else if (Build.VERSION.SDK_INT >= 11) { // HONEYCOMB, 3.0
			cursor = contentResolver.query(Uri.parse(getBaseCalendarUri() + "/calendars"),
				new String[] { "_id", "displayName", "selected"}, query, queryArgs, null);
		}
		else {
			cursor = contentResolver.query(Uri.parse(getBaseCalendarUri() + "/calendars"),
				new String[] { "_id", "displayName", "selected", "hidden" }, query, queryArgs, null);
		}

		// calendars can be null
		if (cursor!=null)
		{
			while (cursor.moveToNext()) {
				String id = cursor.getString(0);
				String name = cursor.getString(1);
				boolean selected = !cursor.getString(2).equals("0");
				// For API level >= 11 (3.0), there is no column "hidden".
				boolean hidden = false;
				String accountName = "";
				String accountType = "";
				if (Build.VERSION.SDK_INT >= 14) {
					accountName = cursor.getString(3);
					accountType = cursor.getString(4);	
				}else if (Build.VERSION.SDK_INT < 11) {
					hidden = !cursor.getString(3).equals("0");
				}

				calendars.add(new CalendarProxy(id, name, selected, hidden, accountName, accountType));
			}
		}

		return calendars;
	}

	public static ArrayList<CalendarProxy> queryCalendars(TiContext context, String query, String[] queryArgs)
	{
		return queryCalendars(query, queryArgs);
	}

	@Kroll.method
	public EventProxy[] getEventsInYear(int year)
	{
		Calendar jan1 = Calendar.getInstance();
		jan1.clear();
		jan1.set(year, 0, 1);

		long date1 = jan1.getTimeInMillis();
		long date2 = date1 + DateUtils.YEAR_IN_MILLIS;
		ArrayList<EventProxy> events = EventProxy.queryEventsBetweenDates(date1, date2, this);
		return events.toArray(new EventProxy[events.size()]);
	}

	@Kroll.method
	public EventProxy[] getEventsInMonth(int year, int month)
	{
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
		return events.toArray(new EventProxy[events.size()]);
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
		return events.toArray(new EventProxy[events.size()]);
	}

	@Kroll.method
	public EventProxy[] getEventsBetweenDates(Date date1, Date date2)
	{
		long start = date1.getTime();
		long end = date2.getTime();
		ArrayList<EventProxy> events = new ArrayList<EventProxy>();

		// A workaround for TIMOB-8439
		while (end - start > MAX_DATE_RANGE) {
			events.addAll(EventProxy.queryEventsBetweenDates(start, start + MAX_DATE_RANGE, this));
			start += MAX_DATE_RANGE;
		}

		events.addAll(EventProxy.queryEventsBetweenDates(start, end, this));

		return events.toArray(new EventProxy[events.size()]);
	}

	@Kroll.method
	public EventProxy getEventById(int id)
	{
		ArrayList<EventProxy> events = EventProxy.queryEvents("_id = ?", new String[] { ""+id });
		if (events.size() > 0) {
			return events.get(0);
		} else return null;
	}

	public static CalendarProxy createCalendar(KrollDict data)
	{
		if (!data.containsKey("accountName") || !data.containsKey(TiC.PROPERTY_NAME)) {
			Log.e("TiCalendar", "Required fields are missing");
			return null;
		}

		ContentValues values = new ContentValues();
		values.put(Calendars.ACCOUNT_NAME, TiConvert.toString(data, "accountName"));
		values.put(Calendars.ACCOUNT_TYPE, CalendarContract.ACCOUNT_TYPE_LOCAL);
		values.put(Calendars.NAME, TiConvert.toString(data, TiC.PROPERTY_NAME));
		values.put(Calendars.CALENDAR_DISPLAY_NAME, TiConvert.toString(data, TiC.PROPERTY_NAME));
		values.put(Calendars.CALENDAR_ACCESS_LEVEL, TiConvert.toInt(data.get("accessLevel"), ACCESS_OWNER));
		values.put(Calendars.VISIBLE, TiConvert.toInt(data.get(TiC.PROPERTY_VISIBLE), 1));
		values.put(Calendars.SYNC_EVENTS, TiConvert.toInt(data.get("syncEvents"), 1));
		if(data.containsKey(TiC.PROPERTY_COLOR)){
			values.put(Calendars.CALENDAR_COLOR, TiConvert.toColor(data.getString(TiC.PROPERTY_COLOR)));
		}
		
		Uri calendarUri = TiApplication.getInstance().getContentResolver().insert(Uri.parse(getBaseCalendarUri() + "/calendars").buildUpon()
	        	.appendQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER, "true")
	        	.appendQueryParameter(Calendars.ACCOUNT_NAME, TiConvert.toString(data, "accountName"))
	        	.appendQueryParameter(Calendars.ACCOUNT_TYPE, CalendarContract.ACCOUNT_TYPE_LOCAL).build(), values);
		
		if (calendarUri == null){
			Log.e("TiCalendar", "unable to create calendar");
			return null;
		}
		
		String calendarId = calendarUri.getLastPathSegment();
		ArrayList<CalendarProxy> calendars = CalendarProxy.queryCalendars("Calendars._id = ?", new String[] { "" + calendarId });

		if (calendars.size() > 0) {
			return calendars.get(0);
		} else {
			return null;
		}
	}
	
    @Kroll.method
	public boolean remove()
	{
		return TiApplication.getInstance().getContentResolver().delete(
				ContentUris.withAppendedId(Uri.parse(getBaseCalendarUri() + "/calendars").buildUpon()
	        	.appendQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER, "true")
	        	.appendQueryParameter(Calendars.ACCOUNT_NAME, this.accountName)
	        	.appendQueryParameter(Calendars.ACCOUNT_TYPE, this.accountType).build(), TiConvert.toInt(this.id)), null, null) == 1;
	}
	
	@Kroll.method
	public EventProxy createEvent(KrollDict data)
	{
		return EventProxy.createEvent(this, data);
	}

	@Kroll.getProperty @Kroll.method
	public String getName()
	{
		return name;
	}

	@Kroll.getProperty @Kroll.method
	public String getId()
	{
		return id;
	}

	@Kroll.getProperty @Kroll.method
	public boolean getSelected()
	{
		return selected;
	}

	@Kroll.getProperty @Kroll.method
	public boolean getHidden()
	{
		return hidden;
	}
	
	@Kroll.getProperty @Kroll.method
	public String getAccountName()
	{
		return accountName;
	}
	
	@Kroll.getProperty @Kroll.method
	public String getAccountType()
	{
		return accountType;
	}

	@Override
	public String getApiName()
	{
		return "Ti.Calendar.Calendar";
	}
}


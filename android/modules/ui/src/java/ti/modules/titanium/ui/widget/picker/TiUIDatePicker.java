/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.picker;

import java.util.Calendar;
import java.util.Date;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.util.TiRHelper.ResourceNotFoundException;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.os.Build;
import android.widget.DatePicker;
import android.widget.DatePicker.OnDateChangedListener;

public class TiUIDatePicker extends TiUIView implements OnDateChangedListener
{
	private boolean suppressChangeEvent = false;
	private static final String TAG = "TiUIDatePicker";

	protected Date minDate, maxDate;
	protected int minuteInterval;

	public TiUIDatePicker(TiViewProxy proxy)
	{
		super(proxy);
	}
	public TiUIDatePicker(final TiViewProxy proxy, Activity activity)
	{
		this(proxy);
		Log.d(TAG, "Creating a date picker", Log.DEBUG_MODE);

		CustomDatePicker picker;
		// If it is not API Level 21 (Android 5.0), create picker normally.
		// If not, it will inflate a spinner picker to address a bug.
		if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
			picker = new CustomDatePicker(activity);
		} else {
			// A bug where PickerCalendarDelegate does not send events to the
			// listener on API Level 21 (Android 5.0) for TIMOB-19192
			// https://code.google.com/p/android/issues/detail?id=147657
			// Work around is to use spinner view instead of calendar view in
			// in Android 5.0
			int datePickerSpinner;
			try {
				datePickerSpinner = TiRHelper.getResource("layout.titanium_ui_date_picker_spinner");
			} catch (ResourceNotFoundException e) {
				if (Log.isDebugModeEnabled()) {
					Log.e(TAG, "XML resources could not be found!!!");
				}
				return;
			}
			picker = (CustomDatePicker) activity.getLayoutInflater().inflate(datePickerSpinner, null);
		}
		picker.setProxy(getProxy());
		setNativeView(picker);
	}

	@Override
	public void processProperties(KrollDict d)
	{
		super.processProperties(d);

		boolean valueExistsInProxy = false;
		Calendar calendar = Calendar.getInstance();
		DatePicker picker = (DatePicker) getNativeView();

		if (d.containsKey(TiC.PROPERTY_VALUE)) {
			calendar.setTime((Date) d.get(TiC.PROPERTY_VALUE));
			valueExistsInProxy = true;
		}
		if (d.containsKey(TiC.PROPERTY_MIN_DATE)) {
			this.minDate = TiConvert.toDate(d.get(TiC.PROPERTY_MIN_DATE));
			// Guard for invalid value
			if (this.minDate != null) {
				picker.setMinDate(this.minDate.getTime());
			}
		}
		if (d.containsKey(TiC.PROPERTY_CALENDAR_VIEW_SHOWN)) {
			setCalendarView(TiConvert.toBoolean(d, TiC.PROPERTY_CALENDAR_VIEW_SHOWN));
		}
		if (d.containsKeyAndNotNull(TiC.PROPERTY_MAX_DATE)) {
			this.maxDate = TiConvert.toDate(d.get(TiC.PROPERTY_MAX_DATE));
			// Guard for invalid value
			if (this.maxDate != null) {
				picker.setMaxDate(this.maxDate.getTime());
			}
		}
		if (d.containsKey(TiC.PROPERTY_MINUTE_INTERVAL)) {
			int mi = d.getInt(TiC.PROPERTY_MINUTE_INTERVAL);
			if (mi >= 1 && mi <= 30 && mi % 60 == 0) {
				this.minuteInterval = mi;
			}
		}
		suppressChangeEvent = true;
		picker.init(calendar.get(Calendar.YEAR), calendar.get(Calendar.MONTH), calendar.get(Calendar.DAY_OF_MONTH),
					this);
		suppressChangeEvent = false;

		if (!valueExistsInProxy) {
			proxy.setProperty(TiC.PROPERTY_VALUE, calendar.getTime());
		}

		//iPhone ignores both values if max <= min
		if (minDate != null && maxDate != null) {
			if (maxDate.compareTo(minDate) <= 0) {
				Log.w(TAG, "maxDate is less or equal minDate, ignoring both settings.");
				minDate = null;
				maxDate = null;
			}
		}
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (key.equals(TiC.PROPERTY_VALUE)) {
			Date date = (Date) newValue;
			setValue(date.getTime());
		}
		if (key.equals(TiC.PROPERTY_CALENDAR_VIEW_SHOWN)) {
			setCalendarView(TiConvert.toBoolean(newValue));
		} else if (TiC.PROPERTY_MIN_DATE.equals(key)) {
			this.minDate = TiConvert.toDate(newValue);
			// Guard for invalid value
			if (this.minDate != null) {
				((DatePicker) getNativeView()).setMinDate(this.minDate.getTime());
			}
		} else if (TiC.PROPERTY_MAX_DATE.equals(key)) {
			this.maxDate = TiConvert.toDate(newValue);
			// Guard for invalid value
			if (this.maxDate != null) {
				((DatePicker) getNativeView()).setMaxDate(this.maxDate.getTime());
			}
		}
		super.propertyChanged(key, oldValue, newValue, proxy);
	}

	public void onDateChanged(DatePicker picker, int year, int monthOfYear, int dayOfMonth)
	{
		Calendar targetCalendar = Calendar.getInstance();
		targetCalendar.set(Calendar.YEAR, year);
		targetCalendar.set(Calendar.MONTH, monthOfYear);
		targetCalendar.set(Calendar.DAY_OF_MONTH, dayOfMonth);
		targetCalendar.set(Calendar.HOUR_OF_DAY, 0);
		targetCalendar.set(Calendar.MINUTE, 0);
		targetCalendar.set(Calendar.SECOND, 0);
		targetCalendar.set(Calendar.MILLISECOND, 0);

		if ((null != minDate) && (targetCalendar.getTime().before(minDate))) {
			targetCalendar.setTime(minDate);
			setValue(minDate.getTime(), true);
		}
		if ((null != maxDate) && (targetCalendar.getTime().after(maxDate))) {
			targetCalendar.setTime(maxDate);
			setValue(maxDate.getTime(), true);
		}

		Date newTime = targetCalendar.getTime();
		Object oTime = proxy.getProperty(TiC.PROPERTY_VALUE);
		Date oldTime = null;

		if (oTime instanceof Date) {
			oldTime = (Date) oTime;
		}

		// Due to a native Android bug in 4.x, this callback is called twice, so here
		// we check if the dates are identical, we don't fire "change" event or reset value.
		if (oldTime != null && oldTime.equals(newTime)) {
			return;
		}

		if (!suppressChangeEvent) {
			KrollDict data = new KrollDict();
			data.put(TiC.PROPERTY_VALUE, newTime);
			fireEvent(TiC.EVENT_CHANGE, data);
		}

		proxy.setProperty(TiC.PROPERTY_VALUE, newTime);
	}

	public void setValue(long value)
	{
		setValue(value, false);
	}

	public void setValue(long value, boolean suppressEvent)
	{
		DatePicker picker = (DatePicker) getNativeView();
		Calendar calendar = Calendar.getInstance();
		calendar.setTimeInMillis(value);
		suppressChangeEvent = suppressEvent;
		picker.updateDate(calendar.get(Calendar.YEAR), calendar.get(Calendar.MONTH),
						  calendar.get(Calendar.DAY_OF_MONTH));
		suppressChangeEvent = false;
	}

	public void setCalendarView(boolean value)
	{
		if (Build.VERSION.SDK_INT >= 11) {
			DatePicker picker = (DatePicker) getNativeView();
			picker.setCalendarViewShown(value);
		}
	}
}

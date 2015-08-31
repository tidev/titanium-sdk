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
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.os.Build;
import android.widget.DatePicker;
import android.widget.DatePicker.OnDateChangedListener;

public class TiUIDatePicker extends TiUIView
	implements OnDateChangedListener
{
	private boolean suppressChangeEvent = false;
	private static final String TAG = "TiUIDatePicker";

	protected Date minDate, maxDate;
	protected int minuteInterval;
	protected int currentYear;
	protected int currentMonth;
	protected int currentDayOfMonth;
	
	public TiUIDatePicker(TiViewProxy proxy)
	{
		super(proxy);
	}
	public TiUIDatePicker(final TiViewProxy proxy, Activity activity)
	{
		this(proxy);
		Log.d(TAG, "Creating a date picker", Log.DEBUG_MODE);
		
		DatePicker picker;
		// If it is not API Level 21 (Android 5.0), create picker normally.
		// If not, it will inflate a spinner picker to address a bug.
		if (Build.VERSION.SDK_INT != Build.VERSION_CODES.LOLLIPOP) {
			picker = new DatePicker(activity)
			{
				@Override
				protected void onLayout(boolean changed, int left, int top, int right, int bottom)
				{
					super.onLayout(changed, left, top, right, bottom);
					TiUIHelper.firePostLayoutEvent(proxy);
				}
			};
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
			picker = (DatePicker) activity.getLayoutInflater().inflate(datePickerSpinner, null);
		}
		setNativeView(picker);
	}
	
	@Override
	public void processProperties(KrollDict d) {
		super.processProperties(d);
		
		boolean valueExistsInProxy = false;
		Calendar calendar = Calendar.getInstance();
        DatePicker picker = (DatePicker) getNativeView();

        if (d.containsKey("value")) {
        	calendar.setTime((Date) d.get("value"));
            valueExistsInProxy = true;
        }   
        if (d.containsKey(TiC.PROPERTY_MIN_DATE)) {
        	Calendar minDateCalendar = Calendar.getInstance();
        	minDateCalendar.setTime((Date) d.get(TiC.PROPERTY_MIN_DATE));
        	minDateCalendar.set(Calendar.HOUR_OF_DAY, 0);
        	minDateCalendar.set(Calendar.MINUTE, 0);
        	minDateCalendar.set(Calendar.SECOND, 0);
        	minDateCalendar.set(Calendar.MILLISECOND, 0);

        	this.minDate = minDateCalendar.getTime();
        	picker.setMinDate(minDateCalendar.getTimeInMillis());
        }
        if (d.containsKey(TiC.PROPERTY_CALENDAR_VIEW_SHOWN)) {
        	setCalendarView(TiConvert.toBoolean(d, TiC.PROPERTY_CALENDAR_VIEW_SHOWN));
        }
        if (d.containsKey(TiC.PROPERTY_MAX_DATE)) {
        	Calendar maxDateCalendar = Calendar.getInstance();
        	maxDateCalendar.setTime((Date) d.get(TiC.PROPERTY_MAX_DATE));
        	maxDateCalendar.set(Calendar.HOUR_OF_DAY, 0);
        	maxDateCalendar.set(Calendar.MINUTE, 0);
        	maxDateCalendar.set(Calendar.SECOND, 0);
        	maxDateCalendar.set(Calendar.MILLISECOND, 0);

        	this.maxDate = maxDateCalendar.getTime();
        	picker.setMaxDate(maxDateCalendar.getTimeInMillis());
        }
        if (d.containsKey("minuteInterval")) {
            int mi = d.getInt("minuteInterval");
            if (mi >= 1 && mi <= 30 && mi % 60 == 0) {
                this.minuteInterval = mi; 
            }
        }
        suppressChangeEvent = true;
        currentYear = calendar.get(Calendar.YEAR);
        currentMonth = calendar.get(Calendar.MONTH);
        currentDayOfMonth = calendar.get(Calendar.DAY_OF_MONTH);
        picker.init(currentYear, currentMonth, currentDayOfMonth, this);
        suppressChangeEvent = false;
        
        if (!valueExistsInProxy) {
        	proxy.setProperty("value", calendar.getTime());
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
	public void propertyChanged(String key, Object oldValue, Object newValue,
			KrollProxy proxy)
	{
		if (key.equals("value"))
		{
			Date date = (Date)newValue;
			setValue(date.getTime());
		}
		if (key.equals(TiC.PROPERTY_CALENDAR_VIEW_SHOWN)) {
			setCalendarView(TiConvert.toBoolean(newValue));
		}
		super.propertyChanged(key, oldValue, newValue, proxy);
	}
	
	public void onDateChanged(DatePicker picker, int year, int monthOfYear, int dayOfMonth)
	{
        // TIMOB-19192 There seems to be a bug that calls onDateChanged twice on Android 5.0.X.
        // This checks if the previous date and changed date is the same before firing any changes.
        // If the dates are the same, nothing has changed, hence it is returned.
        if ((picker.getYear() == currentYear)
                && (picker.getMonth() == currentMonth)
                && (picker.getDayOfMonth() == currentDayOfMonth)
                && (Build.VERSION.SDK_INT == Build.VERSION_CODES.LOLLIPOP)) {
            return;
        } else {
            currentYear = picker.getYear();
            currentMonth = picker.getMonth();
            currentDayOfMonth = picker.getDayOfMonth();
        }

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
		if (!suppressChangeEvent) {
			KrollDict data = new KrollDict();
			data.put("value", targetCalendar.getTime());
			fireEvent("change", data);
		}
		proxy.setProperty("value", targetCalendar.getTime());
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
		picker.updateDate(calendar.get(Calendar.YEAR), calendar
				.get(Calendar.MONTH), calendar.get(Calendar.DAY_OF_MONTH));
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

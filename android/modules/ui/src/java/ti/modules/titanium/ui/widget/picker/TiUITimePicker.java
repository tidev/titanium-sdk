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
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.util.TiRHelper.ResourceNotFoundException;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.content.res.Resources;
import android.os.Build;
import android.view.View;
import android.widget.TimePicker;
import android.widget.TimePicker.OnTimeChangedListener;

public class TiUITimePicker extends TiUIView implements OnTimeChangedListener
{
	private static final String TAG = "TiUITimePicker";
	private boolean suppressChangeEvent = false;

	protected Date minDate, maxDate;
	protected int minuteInterval;

	private static int id_am = 0;
	private static int id_pm = 0;

	public TiUITimePicker(TiViewProxy proxy)
	{
		super(proxy);
	}
	public TiUITimePicker(final TiViewProxy proxy, Activity activity)
	{
		this(proxy);
		Log.d(TAG, "Creating a time picker", Log.DEBUG_MODE);

		final TimePicker picker;
		// If it is not API Level 21 (Android 5.0), create picker normally.
		// If not, it will inflate a spinner picker to address a bug.
		if (Build.VERSION.SDK_INT != Build.VERSION_CODES.LOLLIPOP) {
			picker = new TimePicker(activity) {
				@Override
				protected void onLayout(boolean changed, int left, int top, int right, int bottom)
				{
					super.onLayout(changed, left, top, right, bottom);
					TiUIHelper.firePostLayoutEvent(proxy);
				}
			};

			// TIMOB-8430: https://issuetracker.google.com/issues/36931448
			if (Build.VERSION.SDK_INT > Build.VERSION_CODES.LOLLIPOP
				&& Build.VERSION.SDK_INT <= Build.VERSION_CODES.M) {
				Resources resources = TiApplication.getInstance().getResources();
				if (id_am == 0) {
					id_am = resources.getIdentifier("android:id/am_label", "drawable", "android.widget.TimePicker");
				}
				if (id_pm == 0) {
					id_pm = resources.getIdentifier("android:id/pm_label", "drawable", "android.widget.TimePicker");
				}
				View am = (View) picker.findViewById(id_am);
				View pm = (View) picker.findViewById(id_pm);
				View.OnClickListener listener = new View.OnClickListener() {
					@Override
					public void onClick(View v)
					{
						if (Build.VERSION.SDK_INT >= 23) {
							picker.setHour((picker.getHour() + 12) % 24);
						} else {
							picker.setCurrentHour((picker.getCurrentHour() + 12) % 24);
						}
					}
				};
				if (am != null) {
					am.setOnClickListener(listener);
				}
				if (pm != null) {
					pm.setOnClickListener(listener);
				}
			}

		} else {
			// A bug where PickerCalendarDelegate does not send events to the
			// listener on API Level 21 (Android 5.0) for TIMOB-19192
			// https://code.google.com/p/android/issues/detail?id=147657
			// Work around is to use spinner view instead of calendar view in
			// in Android 5.0
			int timePickerSpinner;
			try {
				timePickerSpinner = TiRHelper.getResource("layout.titanium_ui_time_picker_spinner");
			} catch (ResourceNotFoundException e) {
				if (Log.isDebugModeEnabled()) {
					Log.e(TAG, "XML resources could not be found!!!");
				}
				return;
			}
			picker = (TimePicker) activity.getLayoutInflater().inflate(timePickerSpinner, null);
		}
		picker.setIs24HourView(false);
		picker.setOnTimeChangedListener(this);
		setNativeView(picker);
	}

	@Override
	public void processProperties(KrollDict d)
	{
		super.processProperties(d);

		boolean valueExistsInProxy = false;
		Calendar calendar = Calendar.getInstance();

		TimePicker picker = (TimePicker) getNativeView();
		if (d.containsKey("value")) {
			calendar.setTime((Date) d.get("value"));
			valueExistsInProxy = true;
		}
		if (d.containsKey("minDate")) {
			this.minDate = (Date) d.get("minDate");
		}
		if (d.containsKey("maxDate")) {
			this.maxDate = (Date) d.get("maxDate");
		}
		if (d.containsKey("minuteInterval")) {
			int mi = d.getInt("minuteInterval");
			if (mi >= 1 && mi <= 30 && mi % 60 == 0) {
				this.minuteInterval = mi;
			}
		}

		// Undocumented but maybe useful for Android
		boolean is24HourFormat = false;
		if (d.containsKey("format24")) {
			is24HourFormat = d.getBoolean("format24");
		}
		picker.setIs24HourView(is24HourFormat);

		setValue(calendar.getTimeInMillis(), true);

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
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (key.equals("value")) {
			Date date = (Date) newValue;
			setValue(date.getTime());
		} else if (key.equals("format24")) {
			((TimePicker) getNativeView()).setIs24HourView(TiConvert.toBoolean(newValue));
		}
		super.propertyChanged(key, oldValue, newValue, proxy);
	}

	public void setValue(long value)
	{
		setValue(value, false);
	}

	public void setValue(long value, boolean suppressEvent)
	{
		TimePicker picker = (TimePicker) getNativeView();
		Calendar calendar = Calendar.getInstance();
		calendar.setTimeInMillis(value);

		// This causes two events to fire.
		suppressChangeEvent = true;
		picker.setCurrentHour(calendar.get(Calendar.HOUR_OF_DAY));
		suppressChangeEvent = suppressEvent;
		picker.setCurrentMinute(calendar.get(Calendar.MINUTE));
		suppressChangeEvent = false;
	}

	@Override
	public void onTimeChanged(TimePicker view, int hourOfDay, int minute)
	{
		Calendar calendar = Calendar.getInstance();
		calendar.set(Calendar.HOUR_OF_DAY, hourOfDay);
		calendar.set(Calendar.MINUTE, minute);
		proxy.setProperty("value", calendar.getTime());
		if (!suppressChangeEvent) {
			KrollDict data = new KrollDict();
			data.put("value", calendar.getTime());
			fireEvent("change", data);
		}
	}
}

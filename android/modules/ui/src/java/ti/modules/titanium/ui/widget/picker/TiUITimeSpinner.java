/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.picker;

import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;

import kankan.wheel.widget.WheelView;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.content.Context;
import android.widget.LinearLayout;

public class TiUITimeSpinner extends TiUIView
		implements WheelView.OnItemSelectedListener
{
	private WheelView hoursWheel;
	private WheelView minutesWheel;
	private WheelView amPmWheel;
	private boolean suppressChangeEvent = false;
	private boolean ignoreItemSelection = false;
	private static final String TAG = "TiUITimeSpinner";
	
	private Calendar calendar = Calendar.getInstance();
	
	public TiUITimeSpinner(TiViewProxy proxy)
	{
		super(proxy);
	}
	public TiUITimeSpinner(TiViewProxy proxy, Activity activity)
	{
		this(proxy);
		createNativeView(activity);
	}
	
	private FormatNumericWheelAdapter makeHoursAdapter(boolean format24) {
		DecimalFormat formatter = new DecimalFormat("00");
		return new FormatNumericWheelAdapter(
				format24 ? 0 : 1,
				format24 ? 23 : 12,
				formatter, 6);
	}

	private WheelView makeAmPmWheel(Context context, int textSize)
	{
		ArrayList<Object> amPmRows = new ArrayList<Object>();
		amPmRows.add(" am ");
		amPmRows.add(" pm ");
		WheelView view = new WheelView(context);
		view.setAdapter(new TextWheelAdapter(amPmRows));
		view.setTextSize(textSize);
		view.setItemSelectedListener(this);
		return view;
	}
	private void createNativeView(Activity activity)
	{
		boolean format24 = true;
		if ( proxy.hasProperty( "format24")  ) {
			format24 = TiConvert.toBoolean( proxy.getProperty(  "format24" ) );
		}

		int minuteInterval = 1;
		if (proxy.hasProperty(TiC.PROPERTY_MINUTE_INTERVAL)) {
			int dirtyMinuteInterval = TiConvert.toInt(proxy.getProperty(TiC.PROPERTY_MINUTE_INTERVAL));
			if((dirtyMinuteInterval > 0) && (dirtyMinuteInterval <= 30) && (60 % dirtyMinuteInterval == 0)  ){
				minuteInterval = dirtyMinuteInterval;
			} else {
				Log.w(TAG, "Clearing invalid minuteInterval property value of " + dirtyMinuteInterval);
				proxy.setProperty(TiC.PROPERTY_MINUTE_INTERVAL, null);
			}
		}
		
		DecimalFormat formatter = new DecimalFormat("00");
		FormatNumericWheelAdapter hours = makeHoursAdapter(format24);
		FormatNumericWheelAdapter minutes = new FormatNumericWheelAdapter(0, 59, formatter, 6, minuteInterval);
		hoursWheel = new WheelView(activity);
		minutesWheel = new WheelView(activity);
		hoursWheel.setTextSize(20);
		minutesWheel.setTextSize(hoursWheel.getTextSize());
		hoursWheel.setAdapter(hours);
		minutesWheel.setAdapter(minutes);
		hoursWheel.setItemSelectedListener(this);
		minutesWheel.setItemSelectedListener(this);

		amPmWheel = null;
		
		if ( !format24 ) {
			amPmWheel = makeAmPmWheel(activity, hoursWheel.getTextSize());
		}

		LinearLayout layout = new LinearLayout(activity);
		layout.setOrientation(LinearLayout.HORIZONTAL);
		layout.addView(hoursWheel);
		layout.addView(minutesWheel);
		if ( !format24 ) {
			layout.addView(amPmWheel);
		}
		
		setNativeView(layout);
	}

	@Override
	public void processProperties(KrollDict d) {
		super.processProperties(d);
		
		boolean valueExistsInProxy = false;

		if (d.containsKey(TiC.PROPERTY_VALUE)) {
			calendar.setTime((Date)d.get(TiC.PROPERTY_VALUE));
			valueExistsInProxy = true;
		}

		setValue(calendar.getTimeInMillis() , true);

		if (!valueExistsInProxy) {
			proxy.setProperty(TiC.PROPERTY_VALUE, calendar.getTime());
		}

	}
	
	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue,
			KrollProxy proxy)
	{
		if (key.equals(TiC.PROPERTY_VALUE)) {
			Date date = (Date)newValue;
			setValue(date.getTime());
		} else if (key.equals("format24")) {
			boolean is24HourFormat = TiConvert.toBoolean( newValue );
			ignoreItemSelection = true;
			suppressChangeEvent = true;
			hoursWheel.setAdapter(makeHoursAdapter(is24HourFormat));
			LinearLayout vg = (LinearLayout)nativeView;
			if (is24HourFormat && vg.indexOfChild(amPmWheel) >= 0) {
				vg.removeView(amPmWheel);
			} else if (!is24HourFormat && vg.getChildCount() < 3) {
				amPmWheel = makeAmPmWheel(hoursWheel.getContext(), hoursWheel.getTextSize());
				vg.addView(amPmWheel);
			}
			setValue(calendar.getTimeInMillis() , true); // updates the time display
			ignoreItemSelection = false;
			suppressChangeEvent = false;
		} else if (key.equals(TiC.PROPERTY_MINUTE_INTERVAL)) {
			int interval = TiConvert.toInt(newValue);
			if((interval > 0) && (interval <= 30) && (60 % interval == 0)  ){
				FormatNumericWheelAdapter adapter = (FormatNumericWheelAdapter) minutesWheel.getAdapter();
				adapter.setStepValue(interval);
				minutesWheel.setAdapter(adapter); // forces the wheel to re-do its items listing
			} else {
				// Reject it
				Log.w(TAG, "Ignoring illegal minuteInterval value: " + interval);
				proxy.setProperty(TiC.PROPERTY_MINUTE_INTERVAL, oldValue, false);
			}
		}
		super.propertyChanged(key, oldValue, newValue, proxy);
	}
	
	public void setValue(long value)
	{
		setValue(value, false);
	}
	
	public void setValue(long value, boolean suppressEvent)
	{
		boolean format24 = true;
		if (proxy.hasProperty("format24")) {
			format24 = TiConvert.toBoolean(proxy.getProperty("format24"));
		}
		calendar.setTimeInMillis(value);
		
		suppressChangeEvent = true;
		ignoreItemSelection = true;
		
		if ( !format24 ) {
			int hour = calendar.get(Calendar.HOUR);
			if (hour == 0) {
				hoursWheel.setCurrentItem(11); // 12
			} else {
				hoursWheel.setCurrentItem(hour - 1); // i.e., the visible "1" on the wheel is index 0.
			}
			if (calendar.get(Calendar.HOUR_OF_DAY) <= 11) {
				amPmWheel.setCurrentItem(0);
			} else {
				amPmWheel.setCurrentItem(1);
			}
		} else {
			hoursWheel.setCurrentItem(calendar.get(Calendar.HOUR_OF_DAY));
		}
		
		suppressChangeEvent = suppressEvent;
		ignoreItemSelection = false;
		minutesWheel.setCurrentItem( ((FormatNumericWheelAdapter) minutesWheel.getAdapter()).getIndex(calendar.get(Calendar.MINUTE)));
		suppressChangeEvent = false;
	}
	
	@Override
	public void onItemSelected(WheelView view, int index)
	{
		if (ignoreItemSelection) {
			return;
		}
		boolean format24 = true;
		if (proxy.hasProperty("format24")) {
			format24 = TiConvert.toBoolean(proxy.getProperty("format24"));
		}
		calendar.set(Calendar.MINUTE, ((FormatNumericWheelAdapter) minutesWheel.getAdapter()).getValue(minutesWheel.getCurrentItem()));
		if ( !format24 ) {
			int hourOfDay = 0;
			if (hoursWheel.getCurrentItem() == 11) { // "12" on the dial
				if (amPmWheel.getCurrentItem() == 0) { // "am"
					hourOfDay = 0;
				} else {
					hourOfDay = 12;
				}
			} else {
				hourOfDay = 1 + (12 * amPmWheel.getCurrentItem()) + hoursWheel.getCurrentItem();
			}
			calendar.set(Calendar.HOUR_OF_DAY, hourOfDay);
		} else {
			calendar.set(Calendar.HOUR_OF_DAY, hoursWheel.getCurrentItem());
		}
		Date dateval = calendar.getTime();
		proxy.setProperty("value", dateval);
		if (!suppressChangeEvent) {
			KrollDict data = new KrollDict();
			data.put("value", dateval);
			proxy.fireEvent("change", data);
		}
	}

}

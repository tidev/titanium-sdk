/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.picker;

import java.text.DecimalFormat;
import java.util.Calendar;
import java.util.Date;

import kankan.wheel.widget.WheelView;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.widget.LinearLayout;

public class TiUITimeSpinner extends TiUIView
		implements WheelView.OnItemSelectedListener
{
	private WheelView hoursWheel;
	private WheelView minutesWheel;
	private boolean suppressChangeEvent = false;
	private boolean ignoreItemSelection = false;
	private static final String LCAT = "TiUITimeSpinner";
	
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
	
	private void createNativeView(Activity activity)
	{
		DecimalFormat formatter = new DecimalFormat("00");
		FormatNumericWheelAdapter hours = new FormatNumericWheelAdapter(0, 23, formatter, 8);
		
		int minuteInterval = 1;
		if (proxy.hasProperty(TiC.PROPERTY_MINUTE_INTERVAL)) {
			int dirtyMinuteInterval = TiConvert.toInt(proxy.getProperty(TiC.PROPERTY_MINUTE_INTERVAL));
			if((dirtyMinuteInterval > 0) && (dirtyMinuteInterval <= 30) && (60 % dirtyMinuteInterval == 0)  ){
				minuteInterval = dirtyMinuteInterval;
			} else {
				Log.w(LCAT, "Clearing invalid minuteInterval property value of " + dirtyMinuteInterval);
				proxy.setProperty(TiC.PROPERTY_MINUTE_INTERVAL, null);
			}
		}		
		
		FormatNumericWheelAdapter minutes = new FormatNumericWheelAdapter(0, 59, formatter, 8, minuteInterval);
		hoursWheel = new WheelView(activity);
		minutesWheel = new WheelView(activity);
		hoursWheel.setTextSize(20);
		minutesWheel.setTextSize(hoursWheel.getTextSize());
		hoursWheel.setAdapter(hours);
		minutesWheel.setAdapter(minutes);
		
    	hoursWheel.setItemSelectedListener(this);
    	minutesWheel.setItemSelectedListener(this);
        
		LinearLayout layout = new LinearLayout(activity);
		layout.setOrientation(LinearLayout.HORIZONTAL);
		layout.addView(hoursWheel);
		layout.addView(minutesWheel);
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
      
        // Undocumented but maybe useful for Android
        boolean is24HourFormat = false;
        if (d.containsKey("format24")) {
        	is24HourFormat = d.getBoolean("format24");
        }
    	// TODO picker.setIs24HourView(is24HourFormat);
        
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
			// TODO ((TimePicker)getNativeView()).setIs24HourView(TiConvert.toBoolean(newValue));
		} else if (key.equals(TiC.PROPERTY_MINUTE_INTERVAL)) {
			int interval = TiConvert.toInt(newValue);
			if((interval > 0) && (interval <= 30) && (60 % interval == 0)  ){
				FormatNumericWheelAdapter adapter = (FormatNumericWheelAdapter) minutesWheel.getAdapter();
				adapter.setStepValue(interval);
				minutesWheel.setAdapter(adapter); // forces the wheel to re-do its items listing
			} else {
				// Reject it
				Log.w(LCAT, "Ignoring illegal minuteInterval value: " + interval);
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
		calendar.setTimeInMillis(value);
		
		suppressChangeEvent = true;
		ignoreItemSelection = true;
		hoursWheel.setCurrentItem(calendar.get(Calendar.HOUR_OF_DAY));
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
		calendar.set(Calendar.MINUTE, ((FormatNumericWheelAdapter) minutesWheel.getAdapter()).getValue(minutesWheel.getCurrentItem()));
		calendar.set(Calendar.HOUR_OF_DAY, hoursWheel.getCurrentItem());
		Date dateval = calendar.getTime();
		proxy.setProperty("value", dateval);
		if (!suppressChangeEvent) {
			KrollDict data = new KrollDict();
			data.put("value", dateval);
			proxy.fireEvent("change", data);
		}
		
	}

}

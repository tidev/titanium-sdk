/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget;

import java.text.DecimalFormat;
import java.text.NumberFormat;
import java.util.Calendar;
import java.util.Date;

import kankan.wheel.widget.NumericWheelAdapter;
import kankan.wheel.widget.WheelView;

import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.view.TiUIView;

import android.widget.LinearLayout;

public class TiUITimeSpinner extends TiUIView
		implements WheelView.OnItemSelectedListener
{
	public static final String LCAT = "TiUITimeSpinner";
	public static final boolean DBG = TiConfig.LOGD;
	private WheelView hoursWheel;
	private WheelView minutesWheel;
	private boolean suppressChangeEvent = false;
	private boolean ignoreItemSelection = false;
	
	private Calendar calendar = Calendar.getInstance();
	
	
	public TiUITimeSpinner(TiViewProxy proxy)
	{
		super(proxy);
		createNativeView();
	}
	
	private void createNativeView()
	{
		FormatNumericWheelAdapter hours = new FormatNumericWheelAdapter(0, 23);
		FormatNumericWheelAdapter minutes = new FormatNumericWheelAdapter(0, 59);
		hours.setFormatter(new DecimalFormat("00"));
		minutes.setFormatter(new DecimalFormat("00"));
		hoursWheel = new WheelView(proxy.getContext());
		minutesWheel = new WheelView(proxy.getContext());
		hoursWheel.setAdapter(hours);
		minutesWheel.setAdapter(minutes);
		
    	hoursWheel.setItemSelectedListener(this);
    	minutesWheel.setItemSelectedListener(this);
        
		LinearLayout layout = new LinearLayout(proxy.getContext());
		layout.setOrientation(LinearLayout.HORIZONTAL);
		layout.addView(hoursWheel);
		layout.addView(minutesWheel);
		setNativeView(layout);
		
	}
	
	@Override
	public void processProperties(TiDict d) {
		super.processProperties(d);
		
		boolean valueExistsInProxy = false;
	    
        if (d.containsKey("value")) {
            calendar.setTime((Date)d.get("value"));
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
        	proxy.internalSetDynamicValue("value", calendar.getTime(), false);
        }
      
	}
	
	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue,
			TiProxy proxy)
	{
		if (key.equals("value")) {
			Date date = (Date)newValue;
			setValue(date.getTime());
		} else if (key.equals("format24")) {
			// TODO ((TimePicker)getNativeView()).setIs24HourView(TiConvert.toBoolean(newValue));
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
		minutesWheel.setCurrentItem(calendar.get(Calendar.MINUTE));
		suppressChangeEvent = false;
	}
	
	class FormatNumericWheelAdapter extends NumericWheelAdapter
	{
		private NumberFormat formatter;
		public FormatNumericWheelAdapter(int minValue, int maxValue)
		{
			super(minValue, maxValue);
		}
		public void setFormatter(NumberFormat formatter) {
			this.formatter = formatter;
		}
		@Override
		public String getItem(int index)
		{
			if (formatter == null) {
				return Integer.toString(getMinValue() + index);
			} else {
				return formatter.format(getMinValue() + index);
			}
		}
		@Override
		public int getMaximumLength()
		{
			// HACK just because we want wider columns
			return 8;
		}
		
	}

	@Override
	public void onItemSelected(WheelView view, int index)
	{
		if (ignoreItemSelection) {
			return;
		}
		calendar.set(Calendar.MINUTE, minutesWheel.getCurrentItem());
		calendar.set(Calendar.HOUR_OF_DAY, hoursWheel.getCurrentItem());
		Date dateval = calendar.getTime();
		proxy.internalSetDynamicValue("value", dateval, false);
		if (!suppressChangeEvent) {
			TiDict data = new TiDict();
			data.put("value", dateval);
			proxy.fireEvent("change", data);
		}
		
	}

}

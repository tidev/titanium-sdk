/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.picker;

import java.text.DecimalFormat;
import java.util.Calendar;
import java.util.Date;

import kankan.wheel.widget.WheelView;

import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import android.widget.LinearLayout;

public class TiUIDateSpinner extends TiUIView
		implements WheelView.OnItemSelectedListener
{
	private WheelView monthWheel;
	private WheelView dayWheel;
	private WheelView yearWheel;
	
	private boolean suppressChangeEvent = false;
	private boolean ignoreItemSelection = false;

	private int defaultMaxYear, defaultMinYear;
	private int maxYear, minYear;
	private Date maxDate, minDate;
	
	private Calendar calendar = Calendar.getInstance();
	
	public TiUIDateSpinner(TiViewProxy proxy)
	{
		super(proxy);
		createNativeView();
	}
	
	private void createNativeView()
	{
		defaultMaxYear = calendar.get(Calendar.YEAR) + 100;
		defaultMinYear = calendar.get(Calendar.YEAR) - 100; 
		DecimalFormat formatter = new DecimalFormat("00");
		// TODO minDate/maxDate
		FormatNumericWheelAdapter months = new FormatNumericWheelAdapter(1, 12, formatter, 2);
		FormatNumericWheelAdapter days = new FormatNumericWheelAdapter(1, 31, formatter, 2);
		FormatNumericWheelAdapter years = new FormatNumericWheelAdapter(
				defaultMinYear, defaultMaxYear,	new DecimalFormat("0000"), 4);
		monthWheel = new WheelView(proxy.getContext());
		dayWheel = new WheelView(proxy.getContext());
		yearWheel = new WheelView(proxy.getContext());
		monthWheel.setAdapter(months);
		dayWheel.setAdapter(days);
		yearWheel.setAdapter(years);
		
    	monthWheel.setItemSelectedListener(this);
    	dayWheel.setItemSelectedListener(this);
    	yearWheel.setItemSelectedListener(this);
        
		LinearLayout layout = new LinearLayout(proxy.getContext());
		layout.setOrientation(LinearLayout.HORIZONTAL);
		
		layout.addView(dayWheel);
		layout.addView(monthWheel);
		layout.addView(yearWheel);
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
        
        minYear = defaultMinYear;
        maxYear = defaultMaxYear;
        
        boolean resetYearAdapter = false;
        if (d.containsKey("minDate")) {
        	Calendar c = Calendar.getInstance();
        	minDate = TiConvert.toDate(d, "minDate");
        	c.setTime(minDate);
        	minYear =  c.get(Calendar.YEAR);
        	resetYearAdapter = true;
        }
        if (d.containsKey("maxDate")) {
        	Calendar c = Calendar.getInstance();
        	maxDate = TiConvert.toDate(d, "maxDate");
        	c.setTime(maxDate);
        	maxYear = c.get(Calendar.YEAR);
        	resetYearAdapter = true;
        }
        if (resetYearAdapter && maxYear >= minYear) {
        	yearWheel.setAdapter(new FormatNumericWheelAdapter(
    				minYear, maxYear, new DecimalFormat("0000"), 4));
        }
      
        // TODO: go beyond setting max/min year for max/min date
        
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
		yearWheel.setCurrentItem(calendar.get(Calendar.YEAR) - minYear);
		monthWheel.setCurrentItem(calendar.get(Calendar.MONTH));
		suppressChangeEvent = suppressEvent;
		ignoreItemSelection = false;
		dayWheel.setCurrentItem(calendar.get(Calendar.DAY_OF_MONTH) - 1);
		suppressChangeEvent = false;
	}
	
	@Override
	public void onItemSelected(WheelView view, int index)
	{
		if (ignoreItemSelection) {
			return;
		}
		calendar.set(Calendar.YEAR, yearWheel.getCurrentItem() + minYear);
		calendar.set(Calendar.DAY_OF_MONTH, dayWheel.getCurrentItem() + 1);
		calendar.set(Calendar.MONTH, monthWheel.getCurrentItem());
		Date dateval = calendar.getTime();
		proxy.internalSetDynamicValue("value", dateval, false);
		if (!suppressChangeEvent) {
			TiDict data = new TiDict();
			data.put("value", dateval);
			proxy.fireEvent("change", data);
		}
		
	}

}

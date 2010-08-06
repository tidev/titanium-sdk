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

		monthWheel = new WheelView(proxy.getContext());
		dayWheel = new WheelView(proxy.getContext());
		yearWheel = new WheelView(proxy.getContext());
		
		monthWheel.setTextSize(20);
		dayWheel.setTextSize(monthWheel.getTextSize());
		yearWheel.setTextSize(monthWheel.getTextSize());
		
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
        
        if (d.containsKey("minDate")) {
        	Calendar c = Calendar.getInstance();
        	minDate = TiConvert.toDate(d, "minDate");
        	c.setTime(minDate);
        } else {
        	Calendar c = Calendar.getInstance();
        	c.set(Calendar.YEAR, defaultMinYear);
        	c.set(Calendar.MONTH, 0);
        	c.set(Calendar.DAY_OF_MONTH, 31);
        	minDate = c.getTime();
        }
        if (d.containsKey("maxDate")) {
        	Calendar c = Calendar.getInstance();
        	maxDate = TiConvert.toDate(d, "maxDate");
        	c.setTime(maxDate);
        } else {
        	Calendar c = Calendar.getInstance();
        	c.set(Calendar.YEAR, defaultMaxYear);
        	c.set(Calendar.MONTH, 11);
        	c.set(Calendar.DAY_OF_MONTH, 31);
        	maxDate = c.getTime();
        }
        
        if (maxDate.before(minDate)) {
        	maxDate = minDate;
        }
        
        // If initial value is out-of-bounds, set date to nearest bound
        if (calendar.getTime().after(maxDate)) {
        	calendar.setTime(maxDate);
        } else if (calendar.getTime().before(minDate)) {
        	calendar.setTime(minDate);
        }
        
        ignoreItemSelection = true;
        setAdapters();
        ignoreItemSelection = false;
        
        setValue(calendar.getTimeInMillis() , true);
        
        if (!valueExistsInProxy) {
        	proxy.internalSetDynamicValue("value", calendar.getTime(), false);
        }
      
	}
	
	private void setAdapters()
	{
		setYearAdapter();
		setMonthAdapter();
		setDayAdapter();
		
	}

	private void setYearAdapter()
	{
		int minYear = minDate.getYear() + 1900;
		int maxYear = maxDate.getYear() + 1900;
		yearWheel.setAdapter( new FormatNumericWheelAdapter(minYear, maxYear, new DecimalFormat("0000"), 4) );
	}
	
	private void setMonthAdapter()
	{
		monthWheel.setAdapter( new FormatNumericWheelAdapter(1, 12, new DecimalFormat("00"), 4) );
	}
	
	private void setDayAdapter()
	{
		dayWheel.setAdapter( new FormatNumericWheelAdapter(1, 31, new DecimalFormat("00"), 4));
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
		yearWheel.setCurrentItem(calendar.get(Calendar.YEAR) - (minDate.getYear() + 1900));
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
		calendar.set(Calendar.YEAR, yearWheel.getCurrentItem() + (minDate.getYear() + 1900));
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

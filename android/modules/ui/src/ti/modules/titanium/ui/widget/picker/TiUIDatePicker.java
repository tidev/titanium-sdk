/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.picker;

import java.util.Calendar;
import java.util.Date;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.view.TiUIView;

import android.widget.DatePicker;
import android.widget.DatePicker.OnDateChangedListener;

public class TiUIDatePicker extends TiUIView
	implements OnDateChangedListener
{
	private boolean suppressChangeEvent = false;
	private static final String LCAT = "TiUIDatePicker";
	private static final boolean DBG = TiConfig.LOGD;
	
	protected Date minDate, maxDate;
	protected int minuteInterval;
	
	public TiUIDatePicker(TiViewProxy proxy)
	{
		super(proxy);
		if (DBG) {
			Log.d(LCAT, "Creating a date picker");
		}
		
		DatePicker picker = new DatePicker(proxy.getContext());
		setNativeView(picker);
	}
	
	@Override
	public void processProperties(KrollDict d) {
		super.processProperties(d);
		
		boolean valueExistsInProxy = false;
		
		Calendar calendar = Calendar.getInstance();
	    
        DatePicker picker = (DatePicker) getNativeView();
        if (d.containsKey("value")) {
            calendar.setTime((Date)d.get("value"));
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
        suppressChangeEvent = true;
        picker.init(calendar.get(Calendar.YEAR),
            calendar.get(Calendar.MONTH), calendar.get(Calendar.DAY_OF_MONTH), this);
        suppressChangeEvent = false;
        
        if (!valueExistsInProxy) {
        	proxy.internalSetDynamicValue("value", calendar.getTime(), false);
        }
        
        //iPhone ignores both values if max <= min
        if (minDate != null && maxDate != null) {
            if (maxDate.compareTo(minDate) <= 0) {
                Log.w(LCAT, "maxDate is less or equal minDate, ignoring both settings.");
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
		super.propertyChanged(key, oldValue, newValue, proxy);
	}
	
	public void onDateChanged(DatePicker picker, int year, int monthOfYear, int dayOfMonth)
	{
		Calendar calendar = Calendar.getInstance();
		calendar.set(year, monthOfYear, dayOfMonth);
		if (!suppressChangeEvent) {
			KrollDict data = new KrollDict();
			data.put("value", calendar.getTime());
			proxy.fireEvent("change", data);
		}
		proxy.internalSetDynamicValue("value", calendar.getTime(), false);
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
}

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
import java.util.ArrayList;
import java.util.Arrays;

import kankan.wheel.widget.WheelView;
import kankan.wheel.widget.WheelAdapter;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.widget.LinearLayout;
import android.view.View;
import android.view.ViewGroup;

public class TiUITimeSpinner extends TiUIView
		implements WheelView.OnItemSelectedListener
{
	private WheelView hoursWheel;
	private WheelView minutesWheel;
	private WheelView amPmWheel;
	private boolean suppressChangeEvent = false;
	private boolean ignoreItemSelection = false;
	private static final String LCAT = "TiUITimeSpinner";
	
	private Calendar calendar = Calendar.getInstance();
	
	protected boolean format24 = false;
	
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
        
        WheelAdapter hours = null;
        TextWheelAdapter amPm = null;
        
        if ( proxy.hasProperty( "format24")  ) {
            this.format24 = TiConvert.toBoolean( proxy.getProperty(  "format24" ) );
        }	 
        
        if ( !this.format24 ) {

            ArrayList<Object> rows = new ArrayList<Object>();

            rows.add( 12 );
            for( int i = 1; i<13;i++ ) {
                rows.add( i );
            }

            hours = new TextWheelAdapter( rows );
            ArrayList<Object> amPmRows = new ArrayList<Object>();
            amPmRows.add(" am ");
            amPmRows.add(" pm ");

            amPm = new TextWheelAdapter( amPmRows );
    		
        } else {
            hours = new FormatNumericWheelAdapter(0, 23, formatter, 8);
        }
    
        
		
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
		if ( !this.format24 ) {
		    amPmWheel = new WheelView( activity );
	    	amPmWheel.setTextSize(hoursWheel.getTextSize());
        }
			
		minutesWheel.setTextSize(hoursWheel.getTextSize());
		hoursWheel.setAdapter(hours);
		minutesWheel.setAdapter(minutes);
		
		if ( !this.format24 ) {
		    amPmWheel.setAdapter(amPm);
		    amPmWheel.setItemSelectedListener(this);
		}
		
    	hoursWheel.setItemSelectedListener(this);
    	minutesWheel.setItemSelectedListener(this);
        
        
		LinearLayout layout = new LinearLayout(activity);
		layout.setOrientation(LinearLayout.HORIZONTAL);
		layout.addView(hoursWheel);
		layout.addView(minutesWheel);
		
		if ( !this.format24 ) {
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
      
        // Undocumented but maybe useful for Android
        boolean is24HourFormat = false;
        if (d.containsKey("format24")) {
        	is24HourFormat = d.getBoolean("format24");
        }
    	this.format24 = is24HourFormat;
        
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
		    boolean was24HourFormat = TiConvert.toBoolean( oldValue );
		    
		    if( is24HourFormat && !was24HourFormat ) {
		        //switch to 24 hour format
		        int val = hoursWheel.getCurrentItem();

    		    if( val == 12 ) //correct 12pm for the last item in the wheel
    		        val = 0;
    		    calendar.set(Calendar.HOUR_OF_DAY, val + (12 * amPmWheel.getCurrentItem()) );
		        
		        
		         DecimalFormat formatter = new DecimalFormat("00");
		         FormatNumericWheelAdapter hours = new FormatNumericWheelAdapter(0, 23, formatter, 8);
		         hoursWheel.setAdapter(hours );
		        
    			 View nv = getNativeView();
				 if (nv instanceof ViewGroup) {
					((ViewGroup) nv).removeView(amPmWheel);
					children.remove(amPmWheel);
			     }	
			     
			     hoursWheel.setCurrentItem(calendar.get(Calendar.HOUR_OF_DAY));
		         this.format24 = is24HourFormat;
		    } else if( !is24HourFormat && was24HourFormat ) {
		        //switch to 12 hour format                
                ArrayList<Object> rows = new ArrayList<Object>();

                rows.add( 12 );
                for( int i = 1; i<13;i++ ) {
                   rows.add( i );
                }

                WheelAdapter hours = new TextWheelAdapter( rows );
                hoursWheel.setAdapter(hours);
                
                ArrayList<Object> amPmRows = new ArrayList<Object>();
                amPmRows.add(" am ");
                amPmRows.add(" pm ");

                TextWheelAdapter amPm = new TextWheelAdapter( amPmRows );
              
                amPmWheel = new WheelView( proxy.getTiContext().getActivity() );
                amPmWheel.setTextSize(hoursWheel.getTextSize());
                amPmWheel.setAdapter(amPm);
                amPmWheel.setItemSelectedListener(this);

                View nv = getNativeView();
                if (nv instanceof ViewGroup) {
                    ((ViewGroup) nv).addView(amPmWheel);
                }
                
        		float t = calendar.get(Calendar.HOUR_OF_DAY) / 12;
        		Integer modhour = Math.round( t );
        		amPmWheel.setCurrentItem( modhour );
        		hoursWheel.setCurrentItem(calendar.get(Calendar.HOUR_OF_DAY) % 12 );
        		
		    }
            
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
		
    	if ( !this.format24 ) {
    		hoursWheel.setCurrentItem(calendar.get(Calendar.HOUR_OF_DAY) % 12 );
    		float t = calendar.get(Calendar.HOUR_OF_DAY) / 12;
    		Integer modhour = Math.round( t );
    		amPmWheel.setCurrentItem( modhour );
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
		calendar.set(Calendar.MINUTE, ((FormatNumericWheelAdapter) minutesWheel.getAdapter()).getValue(minutesWheel.getCurrentItem()));
		if ( !this.format24 ) {
		    int val = hoursWheel.getCurrentItem();
		    
		    if( val == 12 ) //correct 12pm for the last item in the wheel
		        val = 0;
		    calendar.set(Calendar.HOUR_OF_DAY, val + (12 * amPmWheel.getCurrentItem()) );
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

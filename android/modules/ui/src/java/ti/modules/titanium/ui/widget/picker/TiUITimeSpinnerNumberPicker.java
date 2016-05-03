/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.picker;

import java.text.DecimalFormat;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

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
import android.widget.NumberPicker;

public class TiUITimeSpinnerNumberPicker extends TiUIView
implements NumberPicker.OnValueChangeListener {

    private NumberPicker hoursWheel;
    private String[] hoursString;
    private NumberPicker minutesWheel;
    private String[] minutesString;
    private NumberPicker amPmWheel;
    private boolean suppressChangeEvent = false;
    private boolean ignoreItemSelection = false;
    private static final String TAG = "TiUITimeSpinnerNumberPicker";
    private Calendar calendar = Calendar.getInstance();

    public TiUITimeSpinnerNumberPicker(TiViewProxy proxy) {
        super(proxy);
    }
    
    public TiUITimeSpinnerNumberPicker(TiViewProxy proxy, Activity activity) {
        this(proxy);
        createNativeView(activity);
    }

    private NumberPicker makeAmPmWheel(Context context) {
        NumberPicker view = new NumberPicker(context);
        String[] amPmRows = {" am "," pm "};
        view.setDescendantFocusability(NumberPicker.FOCUS_BLOCK_DESCENDANTS);
        view.setDisplayedValues(amPmRows);
        view.setMaxValue(amPmRows.length - 1);
        view.setMinValue(0);
        view.setOnValueChangedListener(this);
        return view;
    }
    
    private void createNativeView(Activity activity) {
        boolean format24 = true;
        if (proxy.hasProperty("format24")) {
            format24 = TiConvert.toBoolean(proxy.getProperty("format24"));
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
        hoursWheel = new NumberPicker(activity);
        minutesWheel = new NumberPicker(activity);
        hoursString = generateNumbers(format24 ? 0 : 1, format24 ? 23 : 12, formatter, 6, 1);
        hoursWheel.setDescendantFocusability(NumberPicker.FOCUS_BLOCK_DESCENDANTS);
        hoursWheel.setDisplayedValues(hoursString);
        hoursWheel.setMaxValue(hoursString.length - 1);
        hoursWheel.setMinValue(0);
        minutesString = generateNumbers(0, 59, formatter, 6, minuteInterval);
        minutesWheel.setDescendantFocusability(NumberPicker.FOCUS_BLOCK_DESCENDANTS);
        minutesWheel.setDisplayedValues(minutesString);
        minutesWheel.setMaxValue(minutesString.length - 1);
        minutesWheel.setMinValue(0);
        hoursWheel.setOnValueChangedListener(this);
        minutesWheel.setOnValueChangedListener(this);
        amPmWheel = null;

        if (!format24) {
            amPmWheel = makeAmPmWheel(activity);
        }

        LinearLayout layout = new LinearLayout(activity);
        layout.setOrientation(LinearLayout.HORIZONTAL);
        layout.addView(hoursWheel);
        layout.addView(minutesWheel);
        if (!format24) {
            layout.addView(amPmWheel);
        }

        setNativeView(layout);
    }

    private String[] generateNumbers(int minValue, int maxValue, NumberFormat formatter, int maxCharLength, int stepValue) {
        int itemCount = ( (maxValue - minValue) / stepValue) + 1;
        List<String> list = new ArrayList<String>();
        for (int index = 0 ; index < itemCount; index++) {
            int actualValue = minValue + index * stepValue;
            if (formatter != null) {
                list.add(formatter.format(actualValue));
            } else {
                list.add(Integer.toString(actualValue));
            }
        }
        return list.toArray(new String[0]);
    }

    @Override
    public void processProperties(KrollDict d) {
        super.processProperties(d);

        boolean valueExistsInProxy = false;

        if (d.containsKey(TiC.PROPERTY_VALUE)) {
            calendar.setTime((Date)d.get(TiC.PROPERTY_VALUE));
            valueExistsInProxy = true;
        }

        setValue(calendar.getTimeInMillis());

        if (!valueExistsInProxy) {
            proxy.setProperty(TiC.PROPERTY_VALUE, calendar.getTime());
        }

    }

    @Override
    public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy) {
        if (key.equals(TiC.PROPERTY_VALUE)) {
            Date date = (Date)newValue;
            setValue(date.getTime());
        }

        super.propertyChanged(key, oldValue, newValue, proxy);
    }

    public void setValue(long value) {
        boolean format24 = true;
        if (proxy.hasProperty("format24")) {
            format24 = TiConvert.toBoolean(proxy.getProperty("format24"));
        }
        calendar.setTimeInMillis(value);

        if (!format24) {
            int hour = calendar.get(Calendar.HOUR);
            if (hour == 0) {
                hoursWheel.setValue(11); // 12
            } else {
                hoursWheel.setValue(hour - 1); // i.e., the visible "1" on the wheel is index 0.
            }
            if (calendar.get(Calendar.HOUR_OF_DAY) <= 11) {
                amPmWheel.setValue(0);
            } else {
                amPmWheel.setValue(1);
            }
        } else {
            hoursWheel.setValue(calendar.get(Calendar.HOUR_OF_DAY));
        }

        int found = 0;
        for(int x = 0; x < minutesString.length ; x++) {
            String minToFind = calendar.get(Calendar.MINUTE) + "";
            if (minutesString[x].equalsIgnoreCase(minToFind)) {
                found = x;
            }
        }
        minutesWheel.setValue(found);
    }

    @Override
    public void onValueChange(NumberPicker picker, int oldVal, int newVal) {

        if (ignoreItemSelection) {
            return;
        }
        boolean format24 = true;
        if (proxy.hasProperty("format24")) {
            format24 = TiConvert.toBoolean(proxy.getProperty("format24"));
        }
        calendar.set(Calendar.MINUTE, Integer.valueOf(minutesString[minutesWheel.getValue()]));
        if ( !format24 ) {
            int hourOfDay = 0;
            if (hoursWheel.getValue() == 11) { // "12" on the dial
                if (amPmWheel.getValue() == 0) { // "am"
                    hourOfDay = 0;
                } else {
                    hourOfDay = 12;
                }
            } else {
                hourOfDay = 1 + (12 * amPmWheel.getValue()) + hoursWheel.getValue();
            }
            calendar.set(Calendar.HOUR_OF_DAY, hourOfDay);
        } else {
            calendar.set(Calendar.HOUR_OF_DAY, hoursWheel.getValue());
        }
        Date dateval = calendar.getTime();
        proxy.setProperty(TiC.PROPERTY_VALUE, dateval);
        if (!suppressChangeEvent) {
            KrollDict data = new KrollDict();
            data.put(TiC.PROPERTY_VALUE, dateval);
            fireEvent(TiC.EVENT_CHANGE, data);
        }

    }


}

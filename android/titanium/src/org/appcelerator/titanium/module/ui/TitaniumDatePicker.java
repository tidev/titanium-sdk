/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.module.ui;

import java.util.Calendar;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumDatePicker;
import org.appcelerator.titanium.api.ITitaniumDatePickerConstants;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.ui.datetime.TitaniumDatePickerHelper;
import org.appcelerator.titanium.util.Log;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.os.Message;
import android.widget.DatePicker;
import android.widget.TimePicker;

public class TitaniumDatePicker extends TitaniumBaseNativeControl
	implements ITitaniumDatePicker, ITitaniumDatePickerConstants
{
	private static final String LCAT = "TiDatePicker";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private TitaniumDatePickerHelper helper;

	public TitaniumDatePicker(TitaniumModuleManager tmm)
	{
		super(tmm);
		helper = new TitaniumDatePickerHelper(handler, eventManager);
	}

	@Override
	protected void setLocalOptions(JSONObject o) throws JSONException
	{
		super.setLocalOptions(o);
		helper.processOptions(o);
	}

	@Override
	public void createControl(TitaniumModuleManager tmm)
	{
		helper.initialize();
		Context context = tmm.getAppContext();

		Calendar cal = helper.getCalendar();
		cal.setTimeInMillis(helper.getValue());

		if (helper.getMode() == MODE_DATE) {
			DatePicker dp = new DatePicker(context);
			dp.init(cal.get(Calendar.YEAR), cal.get(Calendar.MONTH), cal.get(Calendar.DAY_OF_MONTH), helper);
			control = dp;
		} else if (helper.getMode() == MODE_TIME) {
			TimePicker tp = new TimePicker(context);
			tp.setCurrentHour(cal.get(Calendar.HOUR_OF_DAY));
			tp.setCurrentMinute(cal.get(Calendar.MINUTE));
			tp.setOnTimeChangedListener(helper);
			control = tp;
		} else {
			Log.w(LCAT, "Mode not supported: " + helper.getMode());
		}
	}

	@Override
	public boolean handleMessage(Message msg)
	{
		boolean handled = helper.handleMessage(msg);

		if (!handled) {
			if (msg.what == MSG_SET_VALUE) {
				if (DBG) {
					Log.d(LCAT, "SET_VALUE Message");
				}
				Calendar cal = helper.getCalendar();
				cal.setTimeInMillis(msg.getData().getLong("VALUE"));

				int mode = helper.getMode();

				if (mode == MODE_DATE) {
					DatePicker dp = (DatePicker) control;
					int year = cal.get(Calendar.YEAR);
					int monthOfYear = cal.get(Calendar.MONTH);
					int dayOfMonth = cal.get(Calendar.DAY_OF_MONTH);
					dp.updateDate(year, monthOfYear, dayOfMonth);
					// Fire by hand because DatePicker isn't calling it's on change, when set.
					helper.onDateChanged(dp, year, monthOfYear, dayOfMonth);
				} else if (mode == MODE_TIME) {
					TimePicker tp = (TimePicker) control;
					tp.setCurrentHour(cal.get(Calendar.HOUR_OF_DAY));
					tp.setCurrentMinute(cal.get(Calendar.MINUTE));
				} else {
					Log.w(LCAT, "setValue not supported in mode: " + mode);
				}

				handled = true;
			} else {
				handled = super.handleMessage(msg);
			}
		}
		return handled;
	}

	public void setValue(long date, String options) {
		helper.setValue(date, options);
	}

}

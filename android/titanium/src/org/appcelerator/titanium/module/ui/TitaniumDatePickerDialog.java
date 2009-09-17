/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.module.ui;

import java.util.Calendar;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumDatePickerConstants;
import org.appcelerator.titanium.api.ITitaniumModalDatePicker;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.ui.datetime.TitaniumDatePickerHelper;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumJSEventManager;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.DatePickerDialog;
import android.app.TimePickerDialog;
import android.content.Context;
import android.os.Handler;
import android.os.Message;
import android.widget.DatePicker;
import android.widget.TimePicker;

public class TitaniumDatePickerDialog implements ITitaniumModalDatePicker,
	ITitaniumDatePickerConstants, Handler.Callback
{
	private static final String LCAT = "TiDateDlg";
	private static boolean DBG = TitaniumConfig.LOGD;

	private static final int MSG_SHOW = 300;
	private static final int MSG_HIDE = 301;
	private static final int MSG_OPEN = 302;

	private TitaniumModuleManager tmm;
	private TitaniumDatePickerHelper helper;
	private Handler handler;
	private TitaniumJSEventManager eventManager;

	private DatePickerDialog dp;
	private TimePickerDialog tp;

	public TitaniumDatePickerDialog(TitaniumModuleManager tmm)
	{
		this.tmm = tmm;
		this.eventManager = new TitaniumJSEventManager(tmm);
		this.handler = new Handler(this);
		this.helper = new TitaniumDatePickerHelper(handler, eventManager, false);
	}

	public void setOptions(String json) {
		try {
			JSONObject o = new JSONObject(json);
			helper.processOptions(o);
		} catch (JSONException e) {
			Log.e(LCAT, "Error while processing options: ", e);
		}
	}

	public void open()
	{
		handler.obtainMessage(MSG_OPEN).sendToTarget();
	}

	public void setValue(long date, String options) {
		helper.setValue(date, options);
	}

	public void hide() {
		handler.obtainMessage(MSG_HIDE).sendToTarget();
	}

	public void show() {
		handler.obtainMessage(MSG_SHOW).sendToTarget();
	}

	public int addEventListener(String eventName, String listener) {
		return eventManager.addListener(eventName, listener);
	}

	public void removeEventListener(String eventName, int listenerId) {
		eventManager.removeListener(eventName, listenerId);
	}

	public boolean handleMessage(Message msg)
	{
		boolean handled = helper.handleMessage(msg);
		if (!handled) {
			switch(msg.what) {
				case MSG_OPEN : {
					helper.initialize();

					Context context = tmm.getActivity(); // Must use for window context

					Calendar cal = helper.getCalendar();
					cal.setTimeInMillis(helper.getValue());

					if (helper.getMode() == MODE_DATE) {
						dp = new DatePickerDialog(context, helper, cal.get(Calendar.YEAR), cal.get(Calendar.MONTH), cal.get(Calendar.DAY_OF_MONTH)) {
							@Override
							public void onDateChanged(final DatePicker view, final int year, final int month, final int day) {
								helper.onDateChanged(view, year, month, day);
								handler.post(new Runnable(){

									public void run() {
										updateTitle(view);
									}});
							}
							public void updateTitle(DatePicker view) {
								Calendar cal = helper.getCalendar();
								cal.setTimeInMillis(helper.getValue());
								super.onDateChanged(view, cal.get(Calendar.YEAR), cal.get(Calendar.MONTH), cal.get(Calendar.DAY_OF_MONTH));
							}
						};
					} else if (helper.getMode() == MODE_TIME) {
						tp = new TimePickerDialog(context,helper, cal.get(Calendar.HOUR_OF_DAY),cal.get(Calendar.MINUTE), false) {

							@Override
							public void onTimeChanged(final TimePicker view, final int hourOfDay, final int minute) {
								helper.onTimeChanged(view, hourOfDay, minute);
								handler.post(new Runnable(){

									public void run() {
										updateTitle(view, hourOfDay, minute);
									}});
							}
							public void updateTitle(TimePicker view, int hourOfDay, int minute) {
								super.onTimeChanged(view, hourOfDay, minute);
							}
						};
					} else {
						Log.w(LCAT, "Mode not supported: " + helper.getMode());
					}

					handled = true;
					break;
				}
				case MSG_SHOW : {
					if (dp != null) {
						dp.show();
					} else if (tp != null) {
						tp.show();
					}
					handled = true;
					break;
				}
				case MSG_HIDE : {
					if (dp != null) {
						dp.hide();
					} else if (tp != null) {
						tp.hide();
					}
					handled = true;
					break;
				}
				case MSG_SET_VALUE : {
					if (DBG) {
						Log.d(LCAT, "SET_VALUE Message");
					}
					Calendar cal = helper.getCalendar();
					cal.setTimeInMillis(msg.getData().getLong("VALUE"));

					int mode = helper.getMode();

					if (mode == MODE_DATE) {
						dp.updateDate(cal.get(Calendar.YEAR), cal.get(Calendar.MONTH), cal.get(Calendar.DAY_OF_MONTH));
					} else if (mode == MODE_TIME) {
						tp.updateTime(cal.get(Calendar.HOUR_OF_DAY), cal.get(Calendar.MINUTE));
					} else {
						Log.w(LCAT, "setValue not supported in mode: " + mode);
					}

					handled = true;
					break;
				}
			}
		}
		return handled;
	}
}

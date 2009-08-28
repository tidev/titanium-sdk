package org.appcelerator.titanium.module.ui;

import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.TimeZone;
import java.util.concurrent.atomic.AtomicBoolean;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumDatePicker;
import org.appcelerator.titanium.util.Log;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.os.Bundle;
import android.os.Message;
import android.widget.DatePicker;
import android.widget.TimePicker;

public class TitaniumDatePicker extends TitaniumBaseNativeControl
	implements ITitaniumDatePicker,
		DatePicker.OnDateChangedListener, TimePicker.OnTimeChangedListener
{
	private static final String LCAT = "TiDatePicker";

	private static final String CHANGE_EVENT = "change";

	private static final int MSG_DATE_CHANGE = 300;
	private static final int MSG_TIME_CHANGE = 301;
	private static final int MSG_SET_VALUE = 302;

	private Long value;
	private Long minDate;
	private Long maxDate;
	private int mode;
	private int minuteInterval;
	private TimeZone utcTimeZone;

	private AtomicBoolean ignoreChange;

	public TitaniumDatePicker(TitaniumModuleManager tmm)
	{
		super(tmm);
		eventManager.supportEvent(CHANGE_EVENT);
		this.mode = MODE_DATE;
		this.minuteInterval = 1;
		this.utcTimeZone = TimeZone.getTimeZone("UTC");
		this.value = getCalendar().getTimeInMillis();
		this.ignoreChange = new AtomicBoolean(false);
	}

	private Calendar getCalendar() {
		return GregorianCalendar.getInstance(utcTimeZone);
	}

	@Override
	protected void setLocalOptions(JSONObject o) throws JSONException {
		super.setLocalOptions(o);

		if (o.has("value")) {
			this.value = o.getLong("value");
		}
		if (o.has("mode")) {
			this.mode = o.getInt("mode");
		}
		if (o.has("minDate")) {
			this.minDate = o.getLong("minDate");
		}
		if (o.has("maxDate")) {
			this.maxDate = o.getLong("maxDate");
		}
		if (o.has("minuteInterval")) {
			int mi = o.getInt("minuteInterval");
			if (mi >= 1 && mi <= 30 && mi % 60 == 0) {
				this.minuteInterval = mi;
			}
		}
	}

	@Override
	public void createControl(TitaniumModuleManager tmm)
	{
		Context context = tmm.getAppContext();
		Calendar cal = getCalendar();

		if (minDate != null) {
			if (value < minDate) {
				value = minDate;
			}
		}
		if (maxDate != null) {
			if (value > maxDate) {
				value = maxDate;
			}
		}

		if (mode == MODE_DATE) {
			DatePicker dp = new DatePicker(context);
			cal.setTimeInMillis(value);
			dp.init(cal.get(Calendar.YEAR), cal.get(Calendar.MONTH), cal.get(Calendar.DAY_OF_MONTH), this);
			control = dp;
		} else if (mode == MODE_TIME) {
			TimePicker tp = new TimePicker(context);
			cal.setTimeInMillis(value);
			tp.setCurrentHour(cal.get(Calendar.HOUR_OF_DAY));
			tp.setCurrentMinute(cal.get(Calendar.MINUTE));
			tp.setOnTimeChangedListener(this);
			control = tp;
		} else {
			Log.w(LCAT, "Mode not supported: " + mode);
		}
	}

	public void onDateChanged(DatePicker view, int year, int monthOfYear, int dayOfMonth)
	{
		if (ignoreChange.get()) {
			return;
		}

		boolean fireEvent = true;

		Calendar cal = getCalendar();
		cal.setTimeInMillis(0);
		cal.set(Calendar.YEAR, year);
		cal.set(Calendar.MONTH, monthOfYear);
		cal.set(Calendar.DAY_OF_MONTH, dayOfMonth);

		long v = cal.getTimeInMillis();

		if (minDate != null) {
			if (v < minDate) {
				ignoreChange.set(true);
				setValue(minDate, null);
				ignoreChange.set(false);
			} else if (v == minDate) {
				//fireEvent = false;
			}
		}
		if (maxDate != null) {
			if(v > maxDate) {
				ignoreChange.set(true);
				setValue(maxDate, null);
				ignoreChange.set(false);
			} else if (v == maxDate) {
				//fireEvent = false;
			}
		}

		if (fireEvent) {
			Message m = handler.obtainMessage(MSG_DATE_CHANGE);
			Bundle b = m.getData();
			b.putInt("YEAR", year);
			b.putInt("MONTH", monthOfYear);
			b.putInt("DAY", dayOfMonth);
			m.sendToTarget();
		}
	}

	public void onTimeChanged(TimePicker view, int hourOfDay, int minute)
	{
		if (ignoreChange.get()) {
			return;
		}
		boolean fireEvent = true;

		Calendar cal = getCalendar();
		cal.setTimeInMillis(0);
		cal.set(Calendar.HOUR_OF_DAY, hourOfDay);
		cal.set(Calendar.MINUTE, minute);

		long v = cal.getTimeInMillis();

		if (minDate != null) {
			if (v < minDate) {
				ignoreChange.set(true);
				setValue(minDate, null);
				ignoreChange.set(false);
			} else if (v == minDate) {
				//fireEvent = false;
			}
		}
		if (maxDate != null) {
			if(v > maxDate) {
				ignoreChange.set(true);
				setValue(maxDate, null);
				ignoreChange.set(false);
			} else if (v == maxDate) {
				//fireEvent = false;
			}
		}

		if (fireEvent) {
			Message m = handler.obtainMessage(MSG_DATE_CHANGE);
			Bundle b = m.getData();
			b.putInt("HOUR", hourOfDay);
			b.putInt("MINUTE", minute);
			m.sendToTarget();
		}
	}

	@Override
	public boolean handleMessage(Message msg)
	{
		boolean handled = false;

		if (msg.what == MSG_DATE_CHANGE || msg.what == MSG_TIME_CHANGE) {
			long d = toDate(msg.getData());
			try {
				JSONObject o = new JSONObject();
				o.put("value", d);
				eventManager.invokeSuccessListeners(CHANGE_EVENT, o.toString());
			} catch (JSONException e) {
				Log.e(LCAT, "Error constructing change event: ", e);
			}
			handled = true;
		} else if (msg.what == MSG_SET_VALUE) {
			Calendar cal = getCalendar();
			cal.setTimeInMillis(msg.getData().getLong("VALUE"));

			if (mode == MODE_DATE) {
				DatePicker dp = (DatePicker) control;
				dp.updateDate(cal.get(Calendar.YEAR), cal.get(Calendar.MONTH), cal.get(Calendar.DAY_OF_MONTH));
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
		return handled;
	}

	private long toDate(Bundle b) {
		Calendar cal = getCalendar();
		cal.setTimeInMillis(0); //

		setField(cal, Calendar.YEAR, "YEAR", b);
		setField(cal, Calendar.MONTH, "MONTH", b);
		setField(cal, Calendar.DAY_OF_MONTH, "DAY", b);
		setField(cal, Calendar.HOUR_OF_DAY, "HOUR", b);
		setField(cal, Calendar.MINUTE, "MINUTE", b);

		return cal.getTimeInMillis();
	}

	private void setField(Calendar cal, int field, String key, Bundle b) {
		int v = b.getInt(key, -1);
		if (v != -1) {
			cal.set(field, v);
		}
	}

	public void setValue(long date, String options) {
		Message m = handler.obtainMessage(MSG_SET_VALUE);
		m.getData().putLong("VALUE", date);
		m.sendToTarget();
	}
}

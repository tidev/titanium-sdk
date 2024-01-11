/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.picker;

import android.os.Build;
import android.view.View;
import android.widget.DatePicker;
import android.widget.DatePicker.OnDateChangedListener;
import android.widget.EditText;
import androidx.annotation.NonNull;
import com.google.android.material.textfield.TextInputLayout;
import java.text.DateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.R;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;
import ti.modules.titanium.ui.PickerProxy;
import ti.modules.titanium.ui.UIModule;

public class TiUIDatePicker extends TiUIView implements OnDateChangedListener
{
	private static final String TAG = "TiUIDatePicker";
	private TiUIDatePicker.DialogCallback dialogCallback;
	private boolean suppressChangeEvent;
	private Date minDate;
	private Date maxDate;

	public TiUIDatePicker(@NonNull PickerProxy proxy)
	{
		super(proxy);
		Log.d(TAG, "Creating a date picker", Log.DEBUG_MODE);

		// Determine if we should use a spinner, calendar view, or text field.
		boolean useTextField = false;
		boolean useSpinner = false;
		if (proxy.hasProperty(TiC.PROPERTY_DATE_PICKER_STYLE)) {
			switch (TiConvert.toInt(proxy.getProperty(TiC.PROPERTY_DATE_PICKER_STYLE))) {
				case UIModule.DATE_PICKER_STYLE_AUTOMATIC:
				case UIModule.DATE_PICKER_STYLE_COMPACT:
					useTextField = true;
					break;
				case UIModule.DATE_PICKER_STYLE_INLINE:
					useSpinner = false;  // Use calendar view.
					break;
				case UIModule.DATE_PICKER_STYLE_WHEELS:
					useSpinner = true;
					break;
				default:
					break;
			}
		}
		if (proxy.hasPropertyAndNotNull(TiC.PROPERTY_USE_SPINNER)) {
			useSpinner = TiConvert.toBoolean(proxy.getProperty(TiC.PROPERTY_USE_SPINNER), useSpinner);
			if (useSpinner) {
				useTextField = false;
			}
		}
		if (proxy.hasPropertyAndNotNull(TiC.PROPERTY_NATIVE_SPINNER)) {
			useSpinner = TiConvert.toBoolean(proxy.getProperty(TiC.PROPERTY_NATIVE_SPINNER), useSpinner);
			if (useSpinner) {
				useTextField = false;
			}
		}
		if (TiConvert.toBoolean(proxy.getProperty(TiC.PROPERTY_CALENDAR_VIEW_SHOWN), false)) {
			useSpinner = false;
			useTextField = false;
		}
		if (!useSpinner && (Build.VERSION.SDK_INT == 21)) {
			// Android 5.0 fails to call onDateChanged() for calendar view. (Android 5.1+ is okay.)
			// See: https://code.google.com/p/android/issues/detail?id=147657
			Log.w(TAG, "Ti.UI.Picker cannot show an inlined calendar view on Android 5.0. Using spinner instead.");
			useSpinner = true;
		}

		// Create the date picker view.
		View view = null;
		if (useTextField) {
			// Attempt to create a text field which will show a date selection dialog when tapped on.
			TextInputLayout textInputLayout = proxy.createTextInputLayout();
			if ((textInputLayout != null) && (textInputLayout.getEditText() != null)) {
				this.dialogCallback = new DialogCallback(this);
				View.OnClickListener clickListener = (View v) -> {
					textInputLayout.requestFocus();
					HashMap<String, Object> options = new HashMap<>();
					options.put(TiC.PROPERTY_CALLBACK, this.dialogCallback);
					proxy.showDatePickerDialog(new Object[] { options });
				};
				textInputLayout.getEditText().setOnClickListener(clickListener);
				textInputLayout.setEndIconOnClickListener(clickListener);
				view = textInputLayout;
			}
		}
		if (view == null) {
			// Create a spinner or calendar view.
			int layoutId;
			if (useSpinner) {
				layoutId = R.layout.titanium_ui_date_picker_spinner;
			} else {
				layoutId = R.layout.titanium_ui_date_picker_calendar;
			}
			DatePicker datePicker = (DatePicker) proxy.getActivity().getLayoutInflater().inflate(layoutId, null);
			view = datePicker;
		}
		view.addOnLayoutChangeListener(new View.OnLayoutChangeListener() {
			@Override
			public void onLayoutChange(
				View v, int left, int top, int right, int bottom,
				int oldLeft, int oldTop, int oldRight, int oldBottom)
			{
				TiUIHelper.firePostLayoutEvent(getProxy());
			}
		});

		setNativeView(view);
	}

	@Override
	public void processProperties(KrollDict d)
	{
		super.processProperties(d);

		DatePicker datePicker = getDatePicker();

		// Apply min/max properties.
		if (d.containsKey(TiC.PROPERTY_MIN_DATE)) {
			this.minDate = createDateWithoutTimeFrom((Date) d.get(TiC.PROPERTY_MIN_DATE));
		}
		if (d.containsKey(TiC.PROPERTY_MAX_DATE)) {
			this.maxDate = createDateWithoutTimeFrom((Date) d.get(TiC.PROPERTY_MAX_DATE));
		}
		if ((this.minDate != null) && (this.maxDate != null) && (this.maxDate.compareTo(this.minDate) <= 0)) {
			Log.w(TAG, "maxDate is less or equal minDate, ignoring both settings.");
			this.minDate = null;
			this.maxDate = null;
		}
		if (datePicker != null) {
			if (this.minDate != null) {
				datePicker.setMinDate(this.minDate.getTime());
			}
			if (this.maxDate != null) {
				datePicker.setMaxDate(this.maxDate.getTime());
			}
		}

		// Fetch date value and display it in the view.
		Calendar calendar = Calendar.getInstance();
		if (d.containsKeyAndNotNull(TiC.PROPERTY_VALUE)) {
			calendar.setTime(TiConvert.toDate(d.get(TiC.PROPERTY_VALUE)));
		}
		if (datePicker != null) {
			this.suppressChangeEvent = true;
			datePicker.init(
				calendar.get(Calendar.YEAR), calendar.get(Calendar.MONTH), calendar.get(Calendar.DAY_OF_MONTH), this);
			this.suppressChangeEvent = false;
		} else {
			setValue(calendar.getTime(), true);
		}

		// Update proxy's "value" property with above time if not assigned.
		if (proxy.getProperty(TiC.PROPERTY_VALUE) == null) {
			proxy.setProperty(TiC.PROPERTY_VALUE, calendar.getTime());
		}
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		// Validate.
		if (key == null) {
			return;
		}

		// Handle property change.
		if (key.equals(TiC.PROPERTY_VALUE)) {
			setValue((Date) newValue);
		} else if (TiC.PROPERTY_MIN_DATE.equals(key)) {
			this.minDate = createDateWithoutTimeFrom((Date) newValue);
			if (getDatePicker() != null) {
				getDatePicker().setMinDate(this.minDate.getTime());
			}
		} else if (TiC.PROPERTY_MAX_DATE.equals(key)) {
			this.maxDate = createDateWithoutTimeFrom((Date) newValue);
			if (getDatePicker() != null) {
				getDatePicker().setMaxDate(this.maxDate.getTime());
			}
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	@Override
	public void onDateChanged(DatePicker picker, int year, int monthOfYear, int dayOfMonth)
	{
		// Store given date without time of day component set to zero.
		Calendar targetCalendar = Calendar.getInstance();
		targetCalendar.set(Calendar.YEAR, year);
		targetCalendar.set(Calendar.MONTH, monthOfYear);
		targetCalendar.set(Calendar.DAY_OF_MONTH, dayOfMonth);
		targetCalendar.set(Calendar.HOUR_OF_DAY, 0);
		targetCalendar.set(Calendar.MINUTE, 0);
		targetCalendar.set(Calendar.SECOND, 0);
		targetCalendar.set(Calendar.MILLISECOND, 0);

		// Apply min/max bounds to selected date. (Should never happen, but better safe than sorry.)
		if ((null != this.minDate) && targetCalendar.getTime().before(this.minDate)) {
			targetCalendar.setTime(this.minDate);
			setValue(this.minDate, true);
		} else if ((null != this.maxDate) && targetCalendar.getTime().after(this.maxDate)) {
			targetCalendar.setTime(this.maxDate);
			setValue(this.maxDate, true);
		}

		// Do not continue if proxy was released.
		if (this.proxy == null) {
			return;
		}

		// Do not continue if date hasn't changed. (We should only fire event if changed.)
		Date newTime = targetCalendar.getTime();
		Date oldTime = TiConvert.toDate(this.proxy.getProperty(TiC.PROPERTY_VALUE));
		if ((oldTime != null) && oldTime.equals(newTime)) {
			return;
		}

		// Update "value" property with selected date.
		this.proxy.setProperty(TiC.PROPERTY_VALUE, newTime);

		// Fire a "change" event.
		if (!this.suppressChangeEvent) {
			KrollDict data = new KrollDict();
			data.put(TiC.PROPERTY_VALUE, newTime);
			fireEvent(TiC.EVENT_CHANGE, data);
		}
	}

	public void setValue(Date value)
	{
		setValue(value, false);
	}

	public void setValue(Date value, boolean suppressEvent)
	{
		// Update DatePicker view if used.
		DatePicker datePicker = getDatePicker();
		if (datePicker != null) {
			Calendar calendar = Calendar.getInstance();
			calendar.setTimeInMillis(value.getTime());
			this.suppressChangeEvent = suppressEvent;
			datePicker.updateDate(
				calendar.get(Calendar.YEAR), calendar.get(Calendar.MONTH), calendar.get(Calendar.DAY_OF_MONTH));
			this.suppressChangeEvent = false;
			return;
		}

		// We're likely using a text field instead. Format date to localized string.
		EditText editText = null;
		View view = getNativeView();
		if (view instanceof TextInputLayout) {
			editText = ((TextInputLayout) view).getEditText();
		} else if (view instanceof EditText) {
			editText = (EditText) view;
		}
		if (editText != null) {
			DateFormat dateFormat = DateFormat.getDateInstance(DateFormat.MEDIUM);
			editText.setText(dateFormat.format(value));
			editText.requestLayout();
		}
	}

	private Date createDateWithoutTimeFrom(Date value)
	{
		if (value == null) {
			return null;
		}

		Calendar calendar = Calendar.getInstance();
		calendar.setTime(value);
		calendar.set(Calendar.HOUR_OF_DAY, 0);
		calendar.set(Calendar.MINUTE, 0);
		calendar.set(Calendar.SECOND, 0);
		calendar.set(Calendar.MILLISECOND, 0);
		return calendar.getTime();
	}

	private DatePicker getDatePicker()
	{
		View view = getNativeView();
		if (view instanceof DatePicker) {
			return (DatePicker) view;
		}
		return null;
	}

	/** Callback to be passed to PickerProxy.showDatePickerDialog() method to acquire selected date. */
	private static class DialogCallback implements KrollFunction
	{
		private TiUIDatePicker picker;

		public DialogCallback(@NonNull TiUIDatePicker picker)
		{
			this.picker = picker;
		}

		@Override
		public Object call(KrollObject krollObject, HashMap args)
		{
			callAsync(krollObject, args);
			return null;
		}

		@Override
		public Object call(KrollObject krollObject, Object[] args)
		{
			callAsync(krollObject, args);
			return null;
		}

		@Override
		public void callAsync(KrollObject krollObject, HashMap args)
		{
			// Validate.
			if (args == null) {
				return;
			}

			// Fetch selected date "value". Property won't be defined if user canceled out.
			Object objectValue = args.get(TiC.PROPERTY_VALUE);
			if (!(objectValue instanceof Date)) {
				return;
			}
			Date dateValue = (Date) objectValue;

			// Make sure selected date does not exceed min/max bounds. (Should never happen.)
			if ((this.picker.minDate != null) && dateValue.before(this.picker.minDate)) {
				dateValue = this.picker.minDate;
			} else if ((this.picker.maxDate != null) && dateValue.after(this.picker.maxDate)) {
				dateValue = this.picker.maxDate;
			}

			// Show selected date in text field.
			this.picker.setValue(dateValue);

			// Fire a "change" event.
			KrollDict data = new KrollDict();
			data.put(TiC.PROPERTY_VALUE, dateValue);
			this.picker.fireEvent(TiC.EVENT_CHANGE, data);
		}

		@Override
		public void callAsync(KrollObject krollObject, Object[] args)
		{
			if ((args != null) && (args.length > 0) && (args[0] instanceof HashMap)) {
				callAsync(krollObject, (HashMap) args[0]);
			}
		}
	}
}

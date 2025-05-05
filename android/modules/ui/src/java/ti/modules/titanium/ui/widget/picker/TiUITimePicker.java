/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.picker;

import android.content.res.Resources;
import android.os.Build;
import android.view.View;
import android.widget.EditText;
import android.widget.TimePicker;
import androidx.annotation.NonNull;
import com.google.android.material.textfield.TextInputLayout;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.R;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;
import ti.modules.titanium.ui.PickerProxy;
import ti.modules.titanium.ui.UIModule;

public class TiUITimePicker extends TiUIView implements TimePicker.OnTimeChangedListener
{
	private static final String TAG = "TiUITimePicker";
	private static int id_am = 0;
	private static int id_pm = 0;
	private TiUITimePicker.DialogCallback dialogCallback;
	private boolean suppressChangeEvent = false;

	public TiUITimePicker(@NonNull PickerProxy proxy)
	{
		super(proxy);
		Log.d(TAG, "Creating a time picker", Log.DEBUG_MODE);

		// Determine if we should use a spinner, clock view, or text field.
		boolean useTextField = false;
		boolean useSpinner = false;
		if (proxy.hasProperty(TiC.PROPERTY_DATE_PICKER_STYLE)) {
			switch (TiConvert.toInt(proxy.getProperty(TiC.PROPERTY_DATE_PICKER_STYLE))) {
				case UIModule.DATE_PICKER_STYLE_AUTOMATIC:
				case UIModule.DATE_PICKER_STYLE_COMPACT:
					useTextField = true;
					break;
				case UIModule.DATE_PICKER_STYLE_INLINE:
					useSpinner = false;  // Use clock view.
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
		if (!useSpinner && (Build.VERSION.SDK_INT == 21)) {
			// Android 5.0 fails to call onTimeChanged() for clock view. (Android 5.1+ is okay.)
			// See: https://code.google.com/p/android/issues/detail?id=147657
			Log.w(TAG, "Ti.UI.Picker cannot show an inlined calendar view on Android 5.0. Using spinner instead.");
			useSpinner = true;
		}

		// Create the time picker view.
		View view = null;
		if (useTextField) {
			// Attempt to create a text field which will show a time selection dialog when tapped on.
			TextInputLayout textInputLayout = proxy.createTextInputLayout();
			if ((textInputLayout != null) && (textInputLayout.getEditText() != null)) {
				this.dialogCallback = new TiUITimePicker.DialogCallback(this);
				View.OnClickListener clickListener = (View v) -> {
					textInputLayout.requestFocus();
					HashMap<String, Object> options = new HashMap<>();
					options.put(TiC.PROPERTY_CALLBACK, this.dialogCallback);
					proxy.showTimePickerDialog(new Object[] { options });
				};
				textInputLayout.getEditText().setOnClickListener(clickListener);
				textInputLayout.setEndIconOnClickListener(clickListener);
				view = textInputLayout;
			}
		}
		if (view == null) {
			// Create a spinner or clock view.
			TimePicker timePicker;
			if (useSpinner) {
				// Create picker with spinners.
				int timePickerSpinner = R.layout.titanium_ui_time_picker_spinner;
				timePicker = (TimePicker) proxy.getActivity().getLayoutInflater().inflate(timePickerSpinner, null);
				timePicker.setDescendantFocusability(TimePicker.FOCUS_BLOCK_DESCENDANTS);
			} else {
				// Create picker with a clock view.
				timePicker = new TimePicker(proxy.getActivity());

				// Work-around Google bug where onTimeChanged() is not called when tapping AM/PM buttons.
				// See: https://issuetracker.google.com/issues/36931448
				if ((Build.VERSION.SDK_INT > 21) && (Build.VERSION.SDK_INT <= 23)) {
					Resources resources = TiApplication.getInstance().getResources();
					if (id_am == 0) {
						id_am = resources.getIdentifier("android:id/am_label", "drawable", "android.widget.TimePicker");
					}
					if (id_pm == 0) {
						id_pm = resources.getIdentifier("android:id/pm_label", "drawable", "android.widget.TimePicker");
					}
					View amView = timePicker.findViewById(id_am);
					View pmView = timePicker.findViewById(id_pm);
					View.OnClickListener listener = (View v) -> {
						if (Build.VERSION.SDK_INT >= 23) {
							timePicker.setHour((timePicker.getHour() + 12) % 24);
						} else {
							timePicker.setCurrentHour((timePicker.getCurrentHour() + 12) % 24);
						}
					};
					if (amView != null) {
						amView.setOnClickListener(listener);
					}
					if (pmView != null) {
						pmView.setOnClickListener(listener);
					}
				}
			}
			timePicker.setIs24HourView(false);
			timePicker.setOnTimeChangedListener(this);
			view = timePicker;
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
	public void processProperties(KrollDict properties)
	{
		super.processProperties(properties);

		// Configure picker for 12 hour or 24 hour format.
		TimePicker timePicker = getTimePicker();
		if (timePicker != null) {
			timePicker.setIs24HourView(TiConvert.toBoolean(properties, TiC.PROPERTY_FORMAT_24, false));
		}

		// Fetch time value and display it in the view.
		Calendar calendar = Calendar.getInstance();
		Date dateValue = TiConvert.toDate(properties.get(TiC.PROPERTY_VALUE));
		if (dateValue != null) {
			calendar.setTime(dateValue);
		}
		setValue(calendar, true);

		// Update proxy's "value" property with above time if not assigned.
		if (proxy.getProperty(TiC.PROPERTY_VALUE) == null) {
			proxy.setProperty(TiC.PROPERTY_VALUE, calendar.getTime());
		}
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (key.equals(TiC.PROPERTY_VALUE)) {
			setValue(TiConvert.toDate(newValue));
		} else if (key.equals(TiC.PROPERTY_FORMAT_24)) {
			TimePicker timePicker = getTimePicker();
			if (timePicker != null) {
				timePicker.setIs24HourView(TiConvert.toBoolean(newValue, false));
			} else if (this.proxy != null) {
				setValue(TiConvert.toDate(this.proxy.getProperty(TiC.PROPERTY_VALUE)));
			}
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	public void setValue(Object value)
	{
		setValue(value, false);
	}

	public void setValue(@NonNull Calendar value)
	{
		setValue(value, false);
	}

	public void setValue(Object value, boolean suppressEvent)
	{
		Calendar calendar = Calendar.getInstance();
		Date newDate = TiConvert.toDate(value);
		if (newDate != null) {
			calendar.setTime(newDate);
		}
		setValue(calendar, suppressEvent);
	}

	public void setValue(@NonNull Calendar value, boolean suppressEvent)
	{
		// Update TimePicker view if used.
		TimePicker timePicker = getTimePicker();
		if (timePicker != null) {
			this.suppressChangeEvent = true;
			timePicker.setCurrentHour(value.get(Calendar.HOUR_OF_DAY));
			this.suppressChangeEvent = suppressEvent;
			timePicker.setCurrentMinute(value.get(Calendar.MINUTE));
			this.suppressChangeEvent = false;
			return;
		}

		// We're likely using a text field instead. Format time to localized string.
		EditText editText = null;
		View view = getNativeView();
		if (view instanceof TextInputLayout) {
			editText = ((TextInputLayout) view).getEditText();
		} else if (view instanceof EditText) {
			editText = (EditText) view;
		}
		if (editText != null) {
			DateFormat dateFormat = null;
			try {
				String datePattern;
				if ((proxy != null) && TiConvert.toBoolean(proxy.getProperty(TiC.PROPERTY_FORMAT_24), false)) {
					datePattern = "HH:mm";
				} else {
					datePattern = "hh:mm a";
				}
				Locale locale = Locale.getDefault();
				datePattern = android.text.format.DateFormat.getBestDateTimePattern(locale, datePattern);
				datePattern = datePattern.replace('b', 'a');
				dateFormat = new SimpleDateFormat(datePattern, locale);
			} catch (Throwable ex) {
				Log.e(TAG, "Failed to generate 'best' date pattern.", ex);
				dateFormat = DateFormat.getTimeInstance(DateFormat.SHORT);
			}
			editText.setText(dateFormat.format(value.getTime()));
			editText.requestLayout();
		}
	}

	@Override
	public void onTimeChanged(TimePicker view, int hourOfDay, int minute)
	{
		// Do not continue if proxy was released.
		if (this.proxy == null) {
			return;
		}

		// Create date object from selected hour and minute values.
		Calendar calendar = Calendar.getInstance();
		calendar.set(Calendar.HOUR_OF_DAY, hourOfDay);
		calendar.set(Calendar.MINUTE, minute);
		calendar.set(Calendar.SECOND, 0);
		calendar.set(Calendar.MILLISECOND, 0);
		Date dateValue = calendar.getTime();

		// Update "value" property with selected time.
		this.proxy.setProperty(TiC.PROPERTY_VALUE, calendar.getTime());

		// Fire a "change" event.
		if (!this.suppressChangeEvent) {
			KrollDict data = new KrollDict();
			data.put(TiC.PROPERTY_VALUE, calendar.getTime());
			fireEvent(TiC.EVENT_CHANGE, data);
		}
	}

	private TimePicker getTimePicker()
	{
		View view = getNativeView();
		if (view instanceof TimePicker) {
			return (TimePicker) view;
		}
		return null;
	}

	/** Callback to be passed to PickerProxy.showTimePickerDialog() method to acquire selected time. */
	private static class DialogCallback implements KrollFunction
	{
		private TiUITimePicker picker;

		public DialogCallback(@NonNull TiUITimePicker picker)
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

			// Fetch selected time "value". Property will be null if user canceled out.
			Object objectValue = args.get(TiC.PROPERTY_VALUE);
			if (!(objectValue instanceof Date)) {
				return;
			}
			Date dateValue = (Date) objectValue;

			// Show selected time in text field.
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

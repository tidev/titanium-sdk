/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.TimeZone;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.R;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.picker.TiUIDatePicker;
import ti.modules.titanium.ui.widget.picker.TiUIPlainDropDownPicker;
import ti.modules.titanium.ui.widget.picker.TiUIPlainPicker;
import ti.modules.titanium.ui.widget.picker.TiUIPlainSpinnerPicker;
import ti.modules.titanium.ui.widget.picker.TiUITimePicker;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.graphics.Color;
import android.text.Editable;
import android.text.InputType;
import android.text.method.BaseKeyListener;
import android.util.Log;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.view.ContextThemeWrapper;

import com.google.android.material.datepicker.CalendarConstraints;
import com.google.android.material.datepicker.CompositeDateValidator;
import com.google.android.material.datepicker.DateValidatorPointBackward;
import com.google.android.material.datepicker.DateValidatorPointForward;
import com.google.android.material.datepicker.MaterialDatePicker;
import com.google.android.material.textfield.MaterialAutoCompleteTextView;
import com.google.android.material.textfield.TextInputLayout;
import com.google.android.material.timepicker.MaterialTimePicker;
import com.google.android.material.timepicker.TimeFormat;

@Kroll.proxy(creatableInModule = UIModule.class,
	propertyAccessors = {
		TiC.PROPERTY_CALENDAR_VIEW_SHOWN,
		TiC.PROPERTY_DATE_PICKER_STYLE,
		TiC.PROPERTY_FONT,
		TiC.PROPERTY_LOCALE,
		TiC.PROPERTY_MIN_DATE,
		TiC.PROPERTY_MAX_DATE,
		TiC.PROPERTY_SELECTION_OPENS,
		TiC.PROPERTY_VALUE
})
public class PickerProxy extends TiViewProxy implements PickerColumnProxy.OnChangedListener
{
	private static final String TAG = "PickerProxy";
	private int type = UIModule.PICKER_TYPE_PLAIN;
	private final ArrayList<PickerColumnProxy> columnList = new ArrayList<>();
	private final ArrayList<Integer> selectedRows = new ArrayList<>();
	private boolean useSpinner = false;
	private boolean canFireColumnEvents = true;

	public PickerProxy()
	{
		super();
		defaultValues.put(TiC.PROPERTY_CALENDAR_VIEW_SHOWN, false);
		defaultValues.put(TiC.PROPERTY_DATE_PICKER_STYLE, UIModule.DATE_PICKER_STYLE_AUTOMATIC);
	}

	@Override
	public void handleCreationDict(KrollDict dict)
	{
		super.handleCreationDict(dict);
		if (dict.containsKey(TiC.PROPERTY_USE_SPINNER)) {
			this.useSpinner = TiConvert.toBoolean(dict, TiC.PROPERTY_USE_SPINNER, this.useSpinner);
		}
		if (dict.containsKey(TiC.PROPERTY_NATIVE_SPINNER)) {
			this.useSpinner = TiConvert.toBoolean(dict, TiC.PROPERTY_NATIVE_SPINNER, this.useSpinner);
		}
		if (hasProperty(TiC.PROPERTY_TYPE)) {
			type = TiConvert.toInt(getProperty(TiC.PROPERTY_TYPE));
		}
		if (dict.containsKey(TiC.PROPERTY_COLUMNS)) {
			setColumns(dict.get(TiC.PROPERTY_COLUMNS));
		}
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		if (type == UIModule.PICKER_TYPE_COUNT_DOWN_TIMER) {
			Log.w(TAG, "Countdown timer not supported in Titanium for Android");
			return null;
		} else if (type == UIModule.PICKER_TYPE_DATE_AND_TIME) {
			Log.w(TAG, "Date+Time timer not supported in Titanium for Android");
			return null;
		} else if (type == UIModule.PICKER_TYPE_PLAIN) {
			if (this.useSpinner) {
				return new TiUIPlainSpinnerPicker(this);
			} else {
				return new TiUIPlainDropDownPicker(this);
			}
		} else if (type == UIModule.PICKER_TYPE_DATE) {
			return new TiUIDatePicker(this);
		} else if (type == UIModule.PICKER_TYPE_TIME) {
			return new TiUITimePicker(this);
		} else {
			Log.w(TAG, "Unknown picker type");
			return null;
		}
	}

	public TextInputLayout createTextInputLayout()
	{
		// Fetch proxy's activity.
		Activity activity = getActivity();
		if (activity == null) {
			activity = TiApplication.getAppRootOrCurrentActivity();
			if (activity == null) {
				return null;
			}
		}

		// Create the TextInputLayout with drop-down arrow and configured border.
		TextInputLayout textInputLayout = null;
		int borderStyle = UIModule.INPUT_BORDERSTYLE_FILLED;
		borderStyle = TiConvert.toInt(getProperty(TiC.PROPERTY_BORDER_STYLE), borderStyle);
		switch (borderStyle) {
			case UIModule.INPUT_BORDERSTYLE_BEZEL:
			case UIModule.INPUT_BORDERSTYLE_LINE:
			case UIModule.INPUT_BORDERSTYLE_ROUNDED:
				textInputLayout = new TextInputLayout(new ContextThemeWrapper(
					activity, R.style.Widget_MaterialComponents_TextInputLayout_OutlinedBox_ExposedDropdownMenu));
				textInputLayout.setBoxBackgroundMode(TextInputLayout.BOX_BACKGROUND_OUTLINE);
				textInputLayout.setBoxBackgroundColor(Color.TRANSPARENT);
				if (borderStyle == UIModule.INPUT_BORDERSTYLE_ROUNDED) {
					float radius = (new TiDimension("5dp", TiDimension.TYPE_LEFT)).getAsPixels(textInputLayout);
					textInputLayout.setBoxCornerRadii(radius, radius, radius, radius);
				} else {
					textInputLayout.setBoxCornerRadii(0, 0, 0, 0);
				}
				break;
			case UIModule.INPUT_BORDERSTYLE_NONE:
			case UIModule.INPUT_BORDERSTYLE_UNDERLINED:
				textInputLayout = new TextInputLayout(new ContextThemeWrapper(
					activity, R.style.Widget_MaterialComponents_TextInputLayout_OutlinedBox_ExposedDropdownMenu));
				textInputLayout.setBoxBackgroundMode(TextInputLayout.BOX_BACKGROUND_NONE);
				break;
			case UIModule.INPUT_BORDERSTYLE_FILLED:
			default:
				textInputLayout = new TextInputLayout(new ContextThemeWrapper(
					activity, R.style.Widget_MaterialComponents_TextInputLayout_FilledBox_ExposedDropdownMenu));
				textInputLayout.setBoxBackgroundMode(TextInputLayout.BOX_BACKGROUND_FILLED);
				break;
		}
		textInputLayout.setHintEnabled(hasProperty(TiC.PROPERTY_HINT_TEXT));
		if (textInputLayout.isHintEnabled()) {
			textInputLayout.setHint(TiConvert.toString(getProperty(TiC.PROPERTY_HINT_TEXT), ""));
		}

		// Add a read-only EditText to the layout.
		MaterialAutoCompleteTextView editText = null;
		if (textInputLayout.getBoxBackgroundMode() != TextInputLayout.BOX_BACKGROUND_NONE) {
			editText = new MaterialAutoCompleteTextView(textInputLayout.getContext());
		} else {
			editText = new MaterialAutoCompleteTextView(activity);
			if (borderStyle == UIModule.INPUT_BORDERSTYLE_NONE) {
				editText.setBackground(null);
			}
		}
		editText.setSingleLine();
		editText.setMaxLines(1);
		editText.setGravity(Gravity.CENTER_VERTICAL | Gravity.START);
		editText.setKeyListener(new BaseKeyListener() {
			@Override
			public int getInputType()
			{
				return InputType.TYPE_NULL;
			}
			@Override
			public boolean backspace(View view, Editable content, int keyCode, KeyEvent event)
			{
				return false;
			}
			@Override
			public boolean forwardDelete(View view, Editable content, int keyCode, KeyEvent event)
			{
				return false;
			}
		});
		editText.setRawInputType(InputType.TYPE_NULL);
		if (textInputLayout.isHintEnabled() == false) {
			// Remove extra padding from top since hint text is disabled.
			editText.setPadding(
				editText.getPaddingLeft(),
				editText.getPaddingBottom(),
				editText.getPaddingRight(),
				editText.getPaddingBottom());
		}
		String[] fontProperties = TiUIHelper.getFontProperties(getProperties());
		if ((fontProperties != null) && (fontProperties.length > 0)) {
			TiUIHelper.styleText(
				editText,
				fontProperties[TiUIHelper.FONT_FAMILY_POSITION],
				fontProperties[TiUIHelper.FONT_SIZE_POSITION],
				fontProperties[TiUIHelper.FONT_WEIGHT_POSITION],
				fontProperties[TiUIHelper.FONT_STYLE_POSITION]);
		}
		textInputLayout.addView(editText, new TextInputLayout.LayoutParams(
			TextInputLayout.LayoutParams.MATCH_PARENT, TextInputLayout.LayoutParams.MATCH_PARENT));

		if (hasPropertyAndNotNull(TiC.PROPERTY_COLOR)) {
			editText.setTextColor(TiConvert.toColor(getProperty(TiC.PROPERTY_COLOR).toString(), activity));
		}

		return textInputLayout;
	}

	@Kroll.getProperty
	public int getType()
	{
		return this.type;
	}

	@Kroll.setProperty
	public void setType(int type)
	{
		if (peekView() != null) {
			Log.e(TAG, "Attempt to change picker type after view has been created.");
			throw new IllegalStateException("You cannot change the picker type after it has been rendered.");
		}
		this.type = type;
	}

	private boolean isPlainPicker()
	{
		return (type == UIModule.PICKER_TYPE_PLAIN);
	}

	@Override
	public void add(Object child)
	{
		// If given a view proxy, then let base class remove.
		if (child instanceof TiViewProxy) {
			remove((TiViewProxy) child);
			return;
		}

		// Do not continue if not a plain picker.
		if (!isPlainPicker()) {
			Log.w(TAG, "Attempt to add to date/time or countdown picker ignored.");
			return;
		}

		if (child instanceof PickerColumnProxy) {
			addColumn((PickerColumnProxy) child);
		} else if (child instanceof PickerRowProxy) {
			getOrCreateFirstColumn().add(child);
		} else if ((child != null) && child.getClass().isArray()) {
			Object[] childArray = (Object[]) child;
			Object firstObject = childArray[0];
			if (firstObject instanceof PickerRowProxy) {
				getOrCreateFirstColumn().add(child);
			} else if (firstObject instanceof PickerColumnProxy) {
				int columnCount = this.columnList.size();
				boolean wasEnabled = this.canFireColumnEvents;
				this.canFireColumnEvents = false;
				for (Object nextObject : childArray) {
					if (nextObject instanceof PickerColumnProxy) {
						addColumn((PickerColumnProxy) nextObject);
					} else {
						Log.w(TAG, "add() was given an invalid object. Must be of type: ");
					}
				}
				this.canFireColumnEvents = wasEnabled;
				if (columnCount != this.columnList.size()) {
					onColumnListChanged();
				}
			}
		} else {
			String errorMessage
				= "add() method was given an invalid object."
				+ " Must be given an array of type 'Ti.UI.PickerColumn' or 'Ti.UI.PickerRow";
			Log.w(TAG, errorMessage);
		}
	}

	private void addColumn(@NonNull PickerColumnProxy column)
	{
		if (this.columnList.contains(column)) {
			return;
		}

		this.columnList.add(column);
		this.selectedRows.add(0);
		column.addListener(this);
		onColumnListChanged();
	}

	@Kroll.method
	public void remove(Object child)
	{
		// If given a view proxy, then let base class remove.
		if (child instanceof TiViewProxy) {
			remove((TiViewProxy) child);
			return;
		}

		// Do not continue if not a column.
		if (!(child instanceof PickerColumnProxy)) {
			Log.w(TAG, "Unable to remove given column. Must be of type: Ti.UI.PickerColumn");
			return;
		}

		// Check exists in picker's collection.
		int index = this.columnList.indexOf(child);
		if (index < 0) {
			return;
		}

		// Remove column from collection and UI.
		this.columnList.remove(index);
		if (index < this.selectedRows.size()) {
			this.selectedRows.remove(index);
		}
		((PickerColumnProxy) child).removeListener(this);
		onColumnListChanged();
	}

	@Override
	public void removeAllChildren()
	{
		// Remove all columns from picker.
		this.selectedRows.clear();
		if (!this.columnList.isEmpty()) {
			boolean wasEnabled = this.canFireColumnEvents;
			this.canFireColumnEvents = false;
			while (!this.columnList.isEmpty()) {
				remove(this.columnList.get(this.columnList.size() - 1));
			}
			this.canFireColumnEvents = wasEnabled;
			onColumnListChanged();
		}

		// Remove all view proxies.
		super.removeAllChildren();
	}

	@Kroll.method
	public void setSelectedRow(int columnIndex, int rowIndex, @Kroll.argument(optional = true) boolean animated)
	{
		// Do not continue if not a plain picker.
		if (!isPlainPicker()) {
			Log.w(TAG, "Selecting row in date/time or countdown picker is not supported.");
			return;
		}

		// Add given selection to collection.
		// Needs to be stored in case view doesn't exist yet or it is recreated after a dark/light theme change.
		if ((columnIndex >= 0) && (columnIndex < this.selectedRows.size())) {
			this.selectedRows.set(columnIndex, rowIndex);
		} else {
			Log.w(TAG, "setSelectedRow() column index is out of range. Given: " + columnIndex);
			return;
		}

		// Set selection in view if available.
		TiUIView view = peekView();
		if (view instanceof TiUIPlainPicker) {
			((TiUIPlainPicker) view).selectRow(columnIndex, rowIndex, animated);
			if (TiConvert.toBoolean(getProperty(TiC.PROPERTY_SELECTION_OPENS), false)) {
				if (view instanceof TiUIPlainDropDownPicker) {
					((TiUIPlainDropDownPicker) view).openPicker();
				}
			}
		}
	}

	@Kroll.method
	public PickerRowProxy getSelectedRow(int columnIndex)
	{
		int rowIndex = getSelectedRowIndex(columnIndex);
		return (rowIndex >= 0) ? getRow(columnIndex, rowIndex) : null;
	}

	public int getSelectedRowIndex(int columnIndex)
	{
		// Do not continue if not a plain picker.
		if (!isPlainPicker()) {
			Log.w(TAG, "Cannot get selected row in date/time or countdown picker.");
			return -1;
		}

		// Validate column index.
		if ((columnIndex < 0) || (columnIndex >= this.selectedRows.size())) {
			return -1;
		}

		// Fetch currently selected row index for given column.
		return this.selectedRows.get(columnIndex);
	}

	@NonNull
	@Kroll.getProperty
	public PickerColumnProxy[] getColumns()
	{
		if (!isPlainPicker()) {
			Log.w(TAG, "Cannot get columns from date/time or countdown picker.");
			return new PickerColumnProxy[0];
		}

		return this.columnList.toArray(new PickerColumnProxy[0]);
	}

	@Kroll.setProperty
	public void setColumns(Object value)
	{
		// Do not continue if not a plain picker.
		if (!isPlainPicker()) {
			Log.w(TAG, "Cannot set columns in date/time or countdown picker.");
			return;
		}

		// Remove all previous columns and add given columns.
		boolean wasEnabled = this.canFireColumnEvents;
		this.canFireColumnEvents = false;
		removeAllChildren();
		add(value);
		this.canFireColumnEvents = wasEnabled;
		onColumnListChanged();
	}

	public PickerColumnProxy getColumn(int index)
	{
		if ((index >= 0) && (index < this.columnList.size())) {
			return this.columnList.get(index);
		}
		return null;
	}

	public int getColumnIndexOf(PickerColumnProxy columnProxy)
	{
		return this.columnList.indexOf(columnProxy);
	}

	public PickerRowProxy getRow(int columnIndex, int rowIndex)
	{
		PickerColumnProxy column = getColumn(columnIndex);
		if (column != null) {
			return column.getRowByIndex(rowIndex);
		}
		return null;
	}

	public PickerColumnProxy getFirstColumn()
	{
		return getColumn(0);
	}

	public PickerColumnProxy getOrCreateFirstColumn()
	{
		PickerColumnProxy column = getColumn(0);
		if (column == null) {
			column = new PickerColumnProxy();
			add(column);
		}
		return column;
	}

	// This is meant to be a kind of "static" method, in the sense that
	// it doesn't use any state except for context.  It's a quick hit way
	// of getting a date dialog up, in other words.
	@SuppressLint("NewApi")
	@Kroll.method
	public void showDatePickerDialog(Object[] args)
	{
		// Fetch top-most activity in app.
		Activity activity = TiApplication.getAppCurrentActivity();
		if (!(activity instanceof AppCompatActivity)) {
			return;
		}
		AppCompatActivity appCompatActivity = ((AppCompatActivity) activity);

		// Fetch optional dictionary of settings from 1st argument.
		HashMap settings;
		if ((args.length > 0) && (args[0] instanceof HashMap)) {
			settings = (HashMap) args[0];
		} else {
			settings = new HashMap();
		}

		// Get the date to be displayed in the dialog. If not assigned, then use today's date.
		Calendar calendar = Calendar.getInstance();
		if (settings.containsKey(TiC.PROPERTY_VALUE)) {
			calendar.setTime(TiConvert.toDate(settings, TiC.PROPERTY_VALUE));
		} else if (hasProperty(TiC.PROPERTY_VALUE)) {
			calendar.setTime(TiConvert.toDate(getProperties(), TiC.PROPERTY_VALUE));
		}

		// Fetch optional callback argument.
		final KrollFunction callback;
		if (settings.containsKey(TiC.PROPERTY_CALLBACK)) {
			Object typeTest = settings.get(TiC.PROPERTY_CALLBACK);
			if (typeTest instanceof KrollFunction) {
				callback = (KrollFunction) typeTest;
			} else {
				callback = null;
			}
		} else {
			callback = null;
		}

		// Used to indicate if a dialog listener has been invoked.
		final AtomicInteger callbackCount = new AtomicInteger(0);

		// Configure main picker settings.
		MaterialDatePicker.Builder<Long> pickerBuilder = MaterialDatePicker.Builder.datePicker();
		pickerBuilder.setInputMode(MaterialDatePicker.INPUT_MODE_CALENDAR);
		if (settings.containsKey(TiC.PROPERTY_TITLE)) {
			pickerBuilder.setTitleText(TiConvert.toString(settings, TiC.PROPERTY_TITLE));
		}

		// Set up min/max date range if configured.
		Date minDate = null;
		if (settings.containsKey(TiC.PROPERTY_MIN_DATE)) {
			minDate = TiConvert.toDate(settings.get(TiC.PROPERTY_MIN_DATE));
		} else if (hasProperty(TiC.PROPERTY_MIN_DATE)) {
			minDate = TiConvert.toDate(getProperty(TiC.PROPERTY_MIN_DATE));
		}
		Date maxDate = null;
		if (settings.containsKey(TiC.PROPERTY_MAX_DATE)) {
			maxDate = TiConvert.toDate(settings.get(TiC.PROPERTY_MAX_DATE));
		} else if (hasProperty(TiC.PROPERTY_MAX_DATE)) {
			maxDate = TiConvert.toDate(getProperty(TiC.PROPERTY_MAX_DATE));
		}
		if ((minDate != null) && (maxDate != null) && !minDate.before(maxDate)) {
			throw new IllegalArgumentException("showDatePickerDialog() property 'minDate' must be less than 'maxDate'");
		}
		if ((minDate != null) || (maxDate != null)) {
			CalendarConstraints.Builder constraintsBuilder = new CalendarConstraints.Builder();
			ArrayList<CalendarConstraints.DateValidator> validatorList = new ArrayList<>();
			if (minDate != null) {
				long unixTime = createDateWithoutTime(minDate).getTime();
				constraintsBuilder.setStart(unixTime);
				validatorList.add(DateValidatorPointForward.from(unixTime));
				if (calendar.getTimeInMillis() < unixTime) {
					calendar.setTimeInMillis(unixTime);
				}
			}
			if (maxDate != null) {
				long unixTime = createDateWithoutTime(maxDate).getTime();
				constraintsBuilder.setEnd(unixTime);
				validatorList.add(DateValidatorPointBackward.before(unixTime));
				if (calendar.getTimeInMillis() > unixTime) {
					calendar.setTimeInMillis(unixTime);
				}
			}
			constraintsBuilder.setValidator(CompositeDateValidator.allOf(validatorList));
			constraintsBuilder.setOpenAt(calendar.getTimeInMillis());
			pickerBuilder.setCalendarConstraints(constraintsBuilder.build());
		}

		// Select date from "value" property or current time.
		// We must do this after applying min/max above (if applicable) to ensure selection is within range.
		pickerBuilder.setSelection(calendar.getTimeInMillis());

		// Create the dialog with above settings and assign it listeners.
		MaterialDatePicker<Long> picker = pickerBuilder.build();
		picker.setCancelable(true);
		if (callback != null) {
			Runnable cancelHandler = () -> {
				// Invoke callback with a cancel event if not done already.
				if (callbackCount.get() == 0) {
					callbackCount.incrementAndGet();
					KrollDict data = new KrollDict();
					data.put(TiC.PROPERTY_CANCEL, true);
					data.put(TiC.PROPERTY_VALUE, null);
					callback.callAsync(getKrollObject(), new Object[] { data });
				}
			};
			picker.addOnPositiveButtonClickListener((unixTime) -> {
				// Flag that the callback was invoked.
				callbackCount.incrementAndGet();

				// Converted selected date from UTC to local time. (Matches iOS' behavior.)
				Calendar utcCalendar = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
				utcCalendar.setTimeInMillis(unixTime);
				Calendar localCalendar = Calendar.getInstance();
				localCalendar.set(Calendar.YEAR, utcCalendar.get(Calendar.YEAR));
				localCalendar.set(Calendar.MONTH, utcCalendar.get(Calendar.MONTH));
				localCalendar.set(Calendar.DAY_OF_MONTH, utcCalendar.get(Calendar.DAY_OF_MONTH));
				localCalendar.set(Calendar.HOUR_OF_DAY, 0);
				localCalendar.set(Calendar.MINUTE, 0);
				localCalendar.set(Calendar.SECOND, 0);
				localCalendar.set(Calendar.MILLISECOND, 0);
				Date value = localCalendar.getTime();

				// Update proxy's "value" property.
				setProperty(TiC.PROPERTY_VALUE, value);

				// Invoke callback providing the selected value.
				KrollDict data = new KrollDict();
				data.put(TiC.PROPERTY_CANCEL, false);
				data.put(TiC.PROPERTY_VALUE, value);
				callback.callAsync(getKrollObject(), new Object[] { data });
			});
			picker.addOnNegativeButtonClickListener((dialog) -> {
				cancelHandler.run();
			});
			picker.addOnCancelListener((dialog) -> {
				cancelHandler.run();
			});
			picker.addOnDismissListener((dialog) -> {
				cancelHandler.run();
			});
		}

		// Show the dialog.
		picker.show(appCompatActivity.getSupportFragmentManager(), picker.toString());
	}

	/**
	 * Trim hour, minute, second and millisecond from the date
	 * @param inDate input date
	 * @return return the trimmed date
	 */
	private static Date createDateWithoutTime(Date inDate)
	{
		if (inDate == null) {
			return null;
		}
		Calendar cal = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
		cal.setTime(inDate);
		cal.set(Calendar.HOUR_OF_DAY, 0);
		cal.set(Calendar.MINUTE, 0);
		cal.set(Calendar.SECOND, 0);
		cal.set(Calendar.MILLISECOND, 0);
		return cal.getTime();
	}

	// This is meant to be a kind of "static" method, in the sense that
	// it doesn't use any state except for context.  It's a quick hit way
	// of getting a date dialog up, in other words.
	@Kroll.method
	public void showTimePickerDialog(Object[] args)
	{
		// Fetch top-most activity in app.
		Activity activity = TiApplication.getAppCurrentActivity();
		if (!(activity instanceof AppCompatActivity)) {
			return;
		}
		AppCompatActivity appCompatActivity = ((AppCompatActivity) activity);

		// Fetch optional dictionary of settings from 1st argument.
		HashMap settings;
		if ((args.length > 0) && (args[0] instanceof HashMap)) {
			settings = (HashMap) args[0];
		} else {
			settings = new HashMap();
		}

		// Get the time to be displayed in the dialog. If not assigned, then use current time.
		Calendar calendar = Calendar.getInstance();
		if (settings.containsKey(TiC.PROPERTY_VALUE)) {
			calendar.setTime(TiConvert.toDate(settings, TiC.PROPERTY_VALUE));
		} else if (hasProperty(TiC.PROPERTY_VALUE)) {
			calendar.setTime(TiConvert.toDate(getProperties(), TiC.PROPERTY_VALUE));
		}
		calendar.set(Calendar.SECOND, 0);
		calendar.set(Calendar.MILLISECOND, 0);

		// Fetch setting for 24-hour/12-hour time.
		boolean is24Hour = false;
		if (settings.containsKey(TiC.PROPERTY_FORMAT_24)) {
			is24Hour = TiConvert.toBoolean(settings, TiC.PROPERTY_FORMAT_24);
		} else if (hasProperty(TiC.PROPERTY_FORMAT_24)) {
			is24Hour = TiConvert.toBoolean(getProperties(), TiC.PROPERTY_FORMAT_24);
		}

		// Fetch optional callback argument.
		final KrollFunction callback;
		if (settings.containsKey(TiC.PROPERTY_CALLBACK)) {
			Object typeTest = settings.get(TiC.PROPERTY_CALLBACK);
			if (typeTest instanceof KrollFunction) {
				callback = (KrollFunction) typeTest;
			} else {
				callback = null;
			}
		} else {
			callback = null;
		}

		// Used to indicate if a dialog listener has been invoked.
		final AtomicInteger callbackCount = new AtomicInteger(0);

		// Configure main picker settings.
		MaterialTimePicker.Builder pickerBuilder = new MaterialTimePicker.Builder();
		pickerBuilder.setHour(calendar.get(Calendar.HOUR_OF_DAY));
		pickerBuilder.setMinute(calendar.get(Calendar.MINUTE));
		pickerBuilder.setInputMode(MaterialTimePicker.INPUT_MODE_CLOCK);
		pickerBuilder.setTimeFormat(is24Hour ? TimeFormat.CLOCK_24H : TimeFormat.CLOCK_12H);
		if (settings.containsKey(TiC.PROPERTY_TITLE)) {
			pickerBuilder.setTitleText(TiConvert.toString(settings, TiC.PROPERTY_TITLE));
		}

		// Create the dialog with above settings and assign it listeners.
		MaterialTimePicker picker = pickerBuilder.build();
		picker.setCancelable(true);
		if (callback != null) {
			Runnable cancelHandler = () -> {
				// Invoke callback with a cancel event if not done already.
				if (callbackCount.get() == 0) {
					callbackCount.incrementAndGet();
					KrollDict data = new KrollDict();
					data.put(TiC.PROPERTY_CANCEL, true);
					data.put(TiC.PROPERTY_VALUE, null);
					callback.callAsync(getKrollObject(), new Object[] { data });
				}
			};
			picker.addOnPositiveButtonClickListener((view) -> {
				// Flag that the callback was invoked.
				callbackCount.incrementAndGet();

				// Fetch selected time and create a date object from it.
				// Note: Use original "calendar" object to preserve the original YYYY/MM/DD.
				calendar.set(Calendar.HOUR_OF_DAY, picker.getHour());
				calendar.set(Calendar.MINUTE, picker.getMinute());
				Date value = calendar.getTime();

				// Update proxy's "value" property.
				setProperty(TiC.PROPERTY_VALUE, value);

				// Invoke callback providing the selected value.
				KrollDict data = new KrollDict();
				data.put(TiC.PROPERTY_CANCEL, false);
				data.put(TiC.PROPERTY_VALUE, value);
				callback.callAsync(getKrollObject(), new Object[] { data });
			});
			picker.addOnNegativeButtonClickListener((dialog) -> {
				cancelHandler.run();
			});
			picker.addOnCancelListener((dialog) -> {
				cancelHandler.run();
			});
			picker.addOnDismissListener((dialog) -> {
				cancelHandler.run();
			});
		}

		// Show the dialog.
		picker.show(appCompatActivity.getSupportFragmentManager(), picker.toString());
	}

	public void fireSelectionChange(int columnIndex, int rowIndex)
	{
		// Update selection collection.
		if ((columnIndex >= 0) && (columnIndex < this.selectedRows.size())) {
			this.selectedRows.set(columnIndex, rowIndex);
		}

		// Fire a "change" event with given selection.
		KrollDict d = new KrollDict();
		d.put("columnIndex", columnIndex);
		d.put("rowIndex", rowIndex);
		d.put("column", getColumn(columnIndex));
		d.put("row", getRow(columnIndex, rowIndex));
		int columnCount = this.columnList.size();
		ArrayList<String> selectedValues = new ArrayList<>(columnCount);
		for (int i = 0; i < columnCount; i++) {
			PickerRowProxy rowInColumn = getSelectedRow(i);
			if (rowInColumn != null) {
				selectedValues.add(rowInColumn.getTitle());
			} else {
				selectedValues.add(null);
			}
		}
		d.put("selectedValue", selectedValues.toArray());
		fireEvent(TiC.EVENT_CHANGE, d);
	}

	public ArrayList<Integer> getSelectedRows()
	{
		return new ArrayList<>(this.selectedRows);
	}

	@Override
	public void onChanged(PickerColumnProxy proxy)
	{
		TiUIView uiView = peekView();
		if (uiView instanceof TiUIPlainPicker) {
			((TiUIPlainPicker) uiView).onColumnChanged(proxy);
		}
	}

	private void onColumnListChanged()
	{
		if (this.canFireColumnEvents) {
			TiUIView uiView = peekView();
			if (uiView instanceof TiUIPlainPicker) {
				((TiUIPlainPicker) uiView).onColumnListChanged();
			}
		}
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.Picker";
	}
}

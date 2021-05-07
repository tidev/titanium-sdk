/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
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
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.PickerColumnProxy.PickerColumnListener;
import ti.modules.titanium.ui.widget.picker.TiUIDatePicker;
import ti.modules.titanium.ui.widget.picker.TiUIDateSpinner;
import ti.modules.titanium.ui.widget.picker.TiUINativePicker;
import ti.modules.titanium.ui.widget.picker.TiUIPicker;
import ti.modules.titanium.ui.widget.picker.TiUISpinner;
import ti.modules.titanium.ui.widget.picker.TiUITimePicker;
import ti.modules.titanium.ui.widget.picker.TiUITimeSpinner;
import ti.modules.titanium.ui.widget.picker.TiUITimeSpinnerNumberPicker;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.util.Log;
import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.datepicker.CalendarConstraints;
import com.google.android.material.datepicker.CompositeDateValidator;
import com.google.android.material.datepicker.DateValidatorPointBackward;
import com.google.android.material.datepicker.DateValidatorPointForward;
import com.google.android.material.datepicker.MaterialDatePicker;
import com.google.android.material.timepicker.MaterialTimePicker;
import com.google.android.material.timepicker.TimeFormat;

@Kroll.proxy(creatableInModule = UIModule.class,
	propertyAccessors = {
		TiC.PROPERTY_LOCALE,
		TiC.PROPERTY_SELECTION_OPENS,
		TiC.PROPERTY_VISIBLE_ITEMS,
		TiC.PROPERTY_VALUE,
		TiC.PROPERTY_CALENDAR_VIEW_SHOWN,
		TiC.PROPERTY_FONT,
		TiC.PROPERTY_MIN_DATE,
		TiC.PROPERTY_MAX_DATE
})
public class PickerProxy extends TiViewProxy implements PickerColumnListener
{
	private int type = UIModule.PICKER_TYPE_PLAIN;
	private ArrayList<Integer> preselectedRows = new ArrayList<Integer>();
	private static final String TAG = "PickerProxy";
	public static final int DEFAULT_VISIBLE_ITEMS_COUNT = 5;
	private boolean useSpinner = false;
	private boolean nativeSpinner = false;
	private int lastSelectedIndex = -1;

	public PickerProxy()
	{
		super();
		defaultValues.put(TiC.PROPERTY_CALENDAR_VIEW_SHOWN, false);
	}

	public void setLastSelectedIndex(int index)
	{
		this.lastSelectedIndex = index;
	}

	public int getLastSelectedIndex()
	{
		return lastSelectedIndex;
	}

	@Override
	public void handleCreationDict(KrollDict dict)
	{
		super.handleCreationDict(dict);
		if (dict.containsKey(TiC.PROPERTY_USE_SPINNER)) {
			useSpinner = TiConvert.toBoolean(dict, TiC.PROPERTY_USE_SPINNER);
			Log.w(TAG, "The useSpinner property is deprecated. Please refer to the documentation for more information");
		}
		if (dict.containsKey(TiC.PROPERTY_NATIVE_SPINNER)) {
			nativeSpinner = TiConvert.toBoolean(dict, TiC.PROPERTY_NATIVE_SPINNER);
		}
		if (hasProperty("type")) {
			type = TiConvert.toInt(getProperty("type"));
		}
		if (dict.containsKey("columns")) {
			setColumns(dict.get("columns"));
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
			return createPlainPicker(activity, useSpinner);
		} else if (type == UIModule.PICKER_TYPE_DATE) {
			if (useSpinner) {
				return createDateSpinner(activity);
			} else {
				return createDatePicker(activity);
			}
		} else if (type == UIModule.PICKER_TYPE_TIME) {
			if (nativeSpinner) {
				return createTimeSpinnerNumberPicker(activity);
			}
			if (useSpinner) {
				return createTimeSpinner(activity);
			} else {
				return createTimePicker(activity);
			}
		} else {
			Log.w(TAG, "Unknown picker type");
			return null;
		}
	}

	private TiUIView createPlainPicker(Activity activity, boolean useSpinner)
	{
		TiUIPicker picker = useSpinner ? new TiUISpinner(this, activity) : new TiUINativePicker(this, activity);
		return picker;
	}

	private TiUIView createDatePicker(Activity activity)
	{
		return new TiUIDatePicker(this, activity);
	}

	private TiUIView createTimePicker(Activity activity)
	{
		return new TiUITimePicker(this, activity);
	}

	private TiUIView createTimeSpinnerNumberPicker(Activity activity)
	{
		return new TiUITimeSpinnerNumberPicker(this, activity);
	}

	private TiUIView createTimeSpinner(Activity activity)
	{
		return new TiUITimeSpinner(this, activity);
	}

	private TiUIView createDateSpinner(Activity activity)
	{
		return new TiUIDateSpinner(this, activity);
	}

	@Kroll.getProperty
	public boolean getUseSpinner()
	{
		Log.w(TAG, "The useSpinner property is deprecated. Please refer to the documentation for more information");
		return useSpinner;
	}

	@Kroll.setProperty
	public void setUseSpinner(boolean value)
	{
		Log.w(TAG, "The useSpinner property is deprecated. Please refer to the documentation for more information");
		if (peekView() != null) {
			Log.w(TAG, "Attempt to change useSpinner property after view has already been created. Ignoring.");
		} else {
			useSpinner = value;
			if (children != null && children.size() > 0) {
				for (TiViewProxy child : children) {
					if (child instanceof PickerColumnProxy) {
						((PickerColumnProxy) child).setUseSpinner(value);
					}
				}
			}
		}
	}

	@Kroll.getProperty
	public int getType()
	{
		return type;
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
	public void remove(TiViewProxy child)
	{
		int index = -1;
		if (children.contains(child)) {
			index = children.indexOf(child);
		}
		super.remove(child);
		if (peekView() instanceof TiUIPicker) {
			((TiUIPicker) peekView()).onColumnRemoved(index);
		}
	}

	@Override
	public void add(Object child)
	{
		if (!isPlainPicker()) {
			Log.w(TAG, "Attempt to add to date/time or countdown picker ignored.");
			return;
		}

		if (child instanceof PickerColumnProxy) {
			PickerColumnProxy column = (PickerColumnProxy) child;
			addColumn(column);
		} else if (child instanceof PickerRowProxy) {
			getFirstColumn(true).add((PickerRowProxy) child);
		} else if (child.getClass().isArray()) {
			Object[] obj = (Object[]) child;
			Object firstObj = obj[0];
			if (firstObj instanceof PickerRowProxy) {
				getFirstColumn(true).addRows(obj);
			} else if (firstObj instanceof PickerColumnProxy) {
				addColumns(obj);
			}
		} else {
			Log.w(TAG, "Unexpected type not added to picker: " + child.getClass().getName());
		}
	}

	private void addColumns(Object[] columns)
	{
		for (Object obj : columns) {
			if (obj instanceof PickerColumnProxy) {
				addColumn((PickerColumnProxy) obj);
			} else {
				Log.w(TAG, "Unexpected type not added to picker: " + obj.getClass().getName());
			}
		}
	}

	private void addColumn(PickerColumnProxy column)
	{
		prepareColumn(column);
		super.add(column);
		if (peekView() instanceof TiUIPicker) {
			((TiUIPicker) peekView()).onColumnAdded(children.indexOf(column));
		}
	}

	private void prepareColumn(PickerColumnProxy column)
	{
		column.setUseSpinner(useSpinner);
		column.setColumnListener(this);
	}

	@Kroll.method
	public void setSelectedRow(int column, int row, @Kroll.argument(optional = true) boolean animated)
	{
		if (!isPlainPicker()) {
			Log.w(TAG, "Selecting row in date/time or countdown picker is not supported.");
			return;
		}
		TiUIView view = peekView();
		if (view == null) {
			// assign it to be selected after view creation
			if (preselectedRows == null) {
				preselectedRows = new ArrayList<Integer>();
			}
			while (preselectedRows.size() < (column + 1)) {
				preselectedRows.add(null);
			}
			if (preselectedRows.size() >= (column + 1)) {
				preselectedRows.remove(column);
			}
			preselectedRows.add(column, new Integer(row));
			return;
		} else {
			((TiUIPicker) view).selectRow(column, row, animated);
			if (TiConvert.toBoolean(getProperty(TiC.PROPERTY_SELECTION_OPENS), false)) {
				((TiUIPicker) view).openPicker();
			}
		}
	}

	@Kroll.method
	public PickerRowProxy getSelectedRow(int columnIndex)
	{
		if (!isPlainPicker()) {
			Log.w(TAG, "Cannot get selected row in date/time or countdown picker.");
			return null;
		}
		if (!(peekView() instanceof TiUIPicker)) {
			return null;
		}
		PickerRowProxy row = null;
		if (peekView() instanceof TiUIPicker) {
			int rowIndex = ((TiUIPicker) peekView()).getSelectedRowIndex(columnIndex);
			if (rowIndex >= 0) {
				row = getRow(columnIndex, rowIndex);
			}
		}
		return row;
	}

	@Kroll.getProperty
	public PickerColumnProxy[] getColumns()
	{
		if (!isPlainPicker()) {
			Log.w(TAG, "Cannot get columns from date/time or countdown picker.");
			return null;
		}
		if (children == null) {
			return new PickerColumnProxy[] {};
		} else {
			return children.toArray(new PickerColumnProxy[children.size()]);
		}
	}

	@Kroll.setProperty
	public void setColumns(Object passedColumns)
	{
		if (!isPlainPicker()) {
			Log.w(TAG, "Cannot set columns in date/time or countdown picker.");
			return;
		}

		boolean dirty = false;
		try {
			if (peekView() instanceof TiUIPicker) {
				((TiUIPicker) peekView()).batchModelChange = true;
			}
			if (children != null && children.size() > 0) {
				int count = children.size();
				for (int i = (count - 1); i >= 0; i--) {
					remove(children.get(i));
					dirty = true;
				}
			}
			Object[] columns = null;
			if (passedColumns.getClass().isArray()) {
				columns = (Object[]) passedColumns;
			} else {
				columns = new Object[] { passedColumns };
			}
			if (!(columns[0] instanceof PickerColumnProxy)) {
				Log.w(TAG, "Unexpected object type ignored for setColumns");
			} else {
				for (Object o : columns) {
					if (o instanceof PickerColumnProxy) {
						add((PickerColumnProxy) o);
						dirty = true;
					}
				}
			}
		} finally {
			if (peekView() instanceof TiUIPicker) {
				((TiUIPicker) peekView()).batchModelChange = false;
			}
		}
		if (dirty) {
			TiUIPicker pickerView = (TiUIPicker) peekView();
			if (pickerView != null) {
				pickerView.onModelReplaced();
			}
		}
	}

	public int getColumnCount()
	{
		TiViewProxy[] columns = getColumns();
		if (columns == null) {
			return 0;
		} else {
			return columns.length;
		}
	}

	public PickerColumnProxy getColumn(int index)
	{
		if (children == null || index >= children.size() || (!(children.get(index) instanceof PickerColumnProxy))) {
			return null;
		} else {
			return (PickerColumnProxy) children.get(index);
		}
	}

	public int getColumnIndex(PickerColumnProxy column)
	{
		if (children != null && children.size() > 0) {
			return children.indexOf(column);
		} else {
			return -1;
		}
	}

	public PickerRowProxy getRow(int columnIndex, int rowIndex)
	{
		PickerColumnProxy column = getColumn(columnIndex);
		if (column == null) {
			return null;
		}
		TiViewProxy[] rowArray = column.getChildren();
		if (rowArray == null || rowIndex >= rowArray.length || (!(rowArray[rowIndex] instanceof PickerRowProxy))) {
			return null;
		} else {
			return (PickerRowProxy) rowArray[rowIndex];
		}
	}

	public PickerColumnProxy getFirstColumn(boolean createIfMissing)
	{
		PickerColumnProxy column = getColumn(0);
		if (column == null && createIfMissing) {
			column = new PickerColumnProxy();
			column.setCreateIfMissing(true);
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

	private void fireColumnModelChange(int columnIndex)
	{
		if (peekView() instanceof TiUIPicker) {
			((TiUIPicker) peekView()).onColumnModelChanged(columnIndex);
		}
	}

	private void fireRowChange(int columnIndex, int rowIndex)
	{
		if (peekView() instanceof TiUIPicker) {
			((TiUIPicker) peekView()).onRowChanged(columnIndex, rowIndex);
		}
	}

	public void fireSelectionChange(int columnIndex, int rowIndex)
	{
		KrollDict d = new KrollDict();
		d.put("columnIndex", columnIndex);
		d.put("rowIndex", rowIndex);
		PickerColumnProxy column = getColumn(columnIndex);
		PickerRowProxy row = getRow(columnIndex, rowIndex);
		d.put("column", column);
		d.put("row", row);
		int columnCount = getColumnCount();
		ArrayList<String> selectedValues = new ArrayList<String>(columnCount);
		for (int i = 0; i < columnCount; i++) {
			PickerRowProxy rowInColumn = getSelectedRow(i);
			if (rowInColumn != null) {
				selectedValues.add(rowInColumn.toString());
			} else {
				selectedValues.add(null);
			}
		}
		d.put("selectedValue", selectedValues.toArray());
		fireEvent("change", d);
	}

	@Override
	public void rowAdded(PickerColumnProxy column, int rowIndex)
	{
		fireColumnModelChange(children.indexOf(column));
	}

	@Override
	public void rowRemoved(PickerColumnProxy column, int oldRowIndex)
	{
		fireColumnModelChange(children.indexOf(column));
	}

	@Override
	public void rowsReplaced(PickerColumnProxy column)
	{
		fireColumnModelChange(children.indexOf(column));
	}

	@Override
	public void rowChanged(PickerColumnProxy column, int rowIndex)
	{
		fireRowChange(children.indexOf(column), rowIndex);
	}

	@Override
	public void rowSelected(PickerColumnProxy column, int rowIndex)
	{
		int columnIndex = children.indexOf(column);
		fireSelectionChange(columnIndex, rowIndex);
	}

	public ArrayList<Integer> getPreselectedRows()
	{
		return preselectedRows;
	}

	public void forceRequestLayout()
	{
		if (peekView() instanceof TiUISpinner) {
			((TiUISpinner) view).forceRequestLayout();
		}
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.Picker";
	}
}

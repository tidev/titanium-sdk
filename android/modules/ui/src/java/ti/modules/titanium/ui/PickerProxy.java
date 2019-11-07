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
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.DatePickerDialog;
import android.app.TimePickerDialog;
import android.content.DialogInterface;
import android.os.Build;
import android.util.Log;
import android.widget.DatePicker;
import android.widget.TimePicker;

import ti.modules.titanium.ui.PickerColumnProxy.PickerColumnListener;
import ti.modules.titanium.ui.widget.picker.TiDatePickerDialog;
import ti.modules.titanium.ui.widget.picker.TiTimePickerDialog;
import ti.modules.titanium.ui.widget.picker.TiUIDatePicker;
import ti.modules.titanium.ui.widget.picker.TiUIDateSpinner;
import ti.modules.titanium.ui.widget.picker.TiUINativePicker;
import ti.modules.titanium.ui.widget.picker.TiUIPicker;
import ti.modules.titanium.ui.widget.picker.TiUISpinner;
import ti.modules.titanium.ui.widget.picker.TiUITimePicker;
import ti.modules.titanium.ui.widget.picker.TiUITimeSpinner;
import ti.modules.titanium.ui.widget.picker.TiUITimeSpinnerNumberPicker;
// clang-format off
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
// clang-format on
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

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public boolean getUseSpinner()
	// clang-format on
	{
		Log.w(TAG, "The useSpinner property is deprecated. Please refer to the documentation for more information");
		return useSpinner;
	}
	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setUseSpinner(boolean value)
	// clang-format on
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

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getType()
	// clang-format on
	{
		return type;
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setType(int type)
	// clang-format on
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

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public PickerColumnProxy[] getColumns()
	// clang-format on
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

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setColumns(Object passedColumns)
	// clang-format on
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
		HashMap settings = new HashMap();
		final AtomicInteger callbackCount =
			new AtomicInteger(0); // just a flag to be sure dismiss doesn't fire callback if ondateset did already.
		if (args.length > 0) {
			settings = (HashMap) args[0];
		}
		Calendar calendar = Calendar.getInstance();
		if (settings.containsKey("value")) {
			calendar.setTime(TiConvert.toDate(settings, "value"));
		}

		final KrollFunction callback;
		if (settings.containsKey("callback")) {
			Object typeTest = settings.get("callback");
			if (typeTest instanceof KrollFunction) {
				callback = (KrollFunction) typeTest;
			} else {
				callback = null;
			}
		} else {
			callback = null;
		}
		DatePickerDialog.OnDateSetListener dateSetListener = null;
		DialogInterface.OnDismissListener dismissListener = null;
		if (callback != null) {
			dateSetListener = new DatePickerDialog.OnDateSetListener() {
				@Override
				public void onDateSet(DatePicker picker, int year, int monthOfYear, int dayOfMonth)
				{
					if (callback != null) {
						callbackCount.incrementAndGet();
						Calendar calendar = Calendar.getInstance();
						calendar.set(Calendar.YEAR, year);
						calendar.set(Calendar.MONTH, monthOfYear);
						calendar.set(Calendar.DAY_OF_MONTH, dayOfMonth);
						Date value = calendar.getTime();
						KrollDict data = new KrollDict();
						data.put("cancel", false);
						data.put("value", value);
						callback.callAsync(getKrollObject(), new Object[] { data });
					}
				}
			};
			dismissListener = new DialogInterface.OnDismissListener() {
				@Override
				public void onDismiss(DialogInterface dialog)
				{
					if (callbackCount.get() == 0 && callback != null) {
						callbackCount.incrementAndGet();
						KrollDict data = new KrollDict();
						data.put("cancel", true);
						data.put("value", null);
						callback.callAsync(getKrollObject(), new Object[] { data });
					}
				}
			};
		}

		/*
	     * use getAppCurrentActivity over getActivity since technically the picker
	     * should show up on top of the current activity when called - not just the
	     * activity it was created in
	     */

		// DatePickerDialog has a bug in Android 4.x
		// If build version is using Android 4.x, use
		// our TiDatePickerDialog. It was fixed from Android 5.0.
		DatePickerDialog dialog;

		if ((Build.VERSION.SDK_INT >= Build.VERSION_CODES.ICE_CREAM_SANDWICH)
			&& (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP)) {
			dialog = new TiDatePickerDialog(TiApplication.getAppCurrentActivity(), dateSetListener,
											calendar.get(Calendar.YEAR), calendar.get(Calendar.MONTH),
											calendar.get(Calendar.DAY_OF_MONTH));
		} else {
			dialog = new DatePickerDialog(TiApplication.getAppCurrentActivity(), dateSetListener,
										  calendar.get(Calendar.YEAR), calendar.get(Calendar.MONTH),
										  calendar.get(Calendar.DAY_OF_MONTH));
		}

		Date minMaxDate = null;
		if (settings.containsKey(TiC.PROPERTY_MIN_DATE)) {
			minMaxDate = (Date) settings.get(TiC.PROPERTY_MIN_DATE);
		} else if (properties.containsKey(TiC.PROPERTY_MIN_DATE)) {
			minMaxDate = (Date) properties.get(TiC.PROPERTY_MIN_DATE);
		}
		if (minMaxDate != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB) {
			dialog.getDatePicker().setMinDate(trimDate(minMaxDate).getTime());
		}
		minMaxDate = null;
		if (settings.containsKey(TiC.PROPERTY_MAX_DATE)) {
			minMaxDate = (Date) settings.get(TiC.PROPERTY_MAX_DATE);
		} else if (properties.containsKey(TiC.PROPERTY_MAX_DATE)) {
			minMaxDate = (Date) properties.get(TiC.PROPERTY_MAX_DATE);
		}
		if (minMaxDate != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB) {
			dialog.getDatePicker().setMaxDate(trimDate(minMaxDate).getTime());
		}

		dialog.setCancelable(true);
		if (dismissListener != null) {
			dialog.setOnDismissListener(dismissListener);
		}
		if (settings.containsKey("title")) {
			dialog.setTitle(TiConvert.toString(settings, "title"));
		}
		dialog.setOnShowListener(new DialogInterface.OnShowListener() {
			@Override
			public void onShow(DialogInterface dialog)
			{
				fireEvent(TiC.EVENT_POST_LAYOUT, null, false);
			}
		});
		dialog.show();
		if (settings.containsKey("okButtonTitle")) {
			dialog.getButton(DatePickerDialog.BUTTON_POSITIVE).setText(TiConvert.toString(settings, "okButtonTitle"));
		}
	}

	/**
	 * Trim hour, minute, second and millisecond from the date
	 * @param inDate input date
	 * @return return the trimmed date
	 */
	public static Date trimDate(Date inDate)
	{
		Calendar cal = Calendar.getInstance();
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
		HashMap settings = new HashMap();
		boolean is24HourView = false;
		final AtomicInteger callbackCount =
			new AtomicInteger(0); // just a flag to be sure dismiss doesn't fire callback if ondateset did already.
		if (args.length > 0) {
			settings = (HashMap) args[0];
		}
		if (settings.containsKey("format24")) {
			is24HourView = TiConvert.toBoolean(settings, "format24");
		}
		Calendar calendar = Calendar.getInstance();
		if (settings.containsKey("value")) {
			calendar.setTime(TiConvert.toDate(settings, "value"));
		}

		final KrollFunction callback;
		if (settings.containsKey("callback")) {
			Object typeTest = settings.get("callback");
			if (typeTest instanceof KrollFunction) {
				callback = (KrollFunction) typeTest;
			} else {
				callback = null;
			}
		} else {
			callback = null;
		}
		TimePickerDialog.OnTimeSetListener timeSetListener = null;
		DialogInterface.OnDismissListener dismissListener = null;
		if (callback != null) {
			timeSetListener = new TimePickerDialog.OnTimeSetListener() {
				@Override
				public void onTimeSet(TimePicker field, int hourOfDay, int minute)
				{
					if (callback != null) {
						callbackCount.incrementAndGet();
						Calendar calendar = Calendar.getInstance();
						calendar.set(Calendar.HOUR_OF_DAY, hourOfDay);
						calendar.set(Calendar.MINUTE, minute);
						Date value = calendar.getTime();
						KrollDict data = new KrollDict();
						data.put("cancel", false);
						data.put("value", value);
						callback.callAsync(getKrollObject(), new Object[] { data });
					}
				}
			};
			dismissListener = new DialogInterface.OnDismissListener() {
				@Override
				public void onDismiss(DialogInterface dialog)
				{
					if (callbackCount.get() == 0 && callback != null) {
						callbackCount.incrementAndGet();
						KrollDict data = new KrollDict();
						data.put("cancel", true);
						data.put("value", null);
						callback.callAsync(getKrollObject(), new Object[] { data });
					}
				}
			};
		}

		// TimePickerDialog has a bug in Android 4.x
		// If build version is using Android 4.x, use
		// our TiTimePickerDialog. It was fixed from Android 5.0.
		TimePickerDialog dialog;

		if ((Build.VERSION.SDK_INT >= Build.VERSION_CODES.ICE_CREAM_SANDWICH)
			&& (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP)) {
			dialog =
				new TiTimePickerDialog(TiApplication.getAppCurrentActivity(), timeSetListener,
									   calendar.get(Calendar.HOUR_OF_DAY), calendar.get(Calendar.MINUTE), is24HourView);
		} else {
			dialog =
				new TimePickerDialog(TiApplication.getAppCurrentActivity(), timeSetListener,
									 calendar.get(Calendar.HOUR_OF_DAY), calendar.get(Calendar.MINUTE), is24HourView);
		}

		dialog.setCancelable(true);
		if (dismissListener != null) {
			dialog.setOnDismissListener(dismissListener);
		}
		if (settings.containsKey("title")) {
			dialog.setTitle(TiConvert.toString(settings, "title"));
		}
		dialog.show();
		if (settings.containsKey("okButtonTitle")) {
			dialog.getButton(TimePickerDialog.BUTTON_POSITIVE).setText(TiConvert.toString(settings, "okButtonTitle"));
		}
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

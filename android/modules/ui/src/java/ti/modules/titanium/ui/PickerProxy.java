/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
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
import org.appcelerator.kroll.common.AsyncResult;
import org.appcelerator.kroll.common.TiMessenger;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiContext;
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
import android.app.Activity;
import android.app.DatePickerDialog;
import android.app.TimePickerDialog;
import android.content.DialogInterface;
import android.os.Message;
import android.util.Log;
import android.widget.DatePicker;
import android.widget.TimePicker;

@Kroll.proxy(creatableInModule=UIModule.class, propertyAccessors={
	"locale", "visibleItems", "value"
})
public class PickerProxy extends TiViewProxy implements PickerColumnListener
{
	private int type = UIModule.PICKER_TYPE_PLAIN;
	private ArrayList<Integer> preselectedRows = new ArrayList<Integer>();
	private static final String TAG = "PickerProxy";
	public static final int DEFAULT_VISIBLE_ITEMS_COUNT = 5;
	private static final int MSG_FIRST_ID = TiViewProxy.MSG_LAST_ID + 1;
	private static final int MSG_SELECT_ROW = MSG_FIRST_ID + 101;
	private static final int MSG_SET_COLUMNS = MSG_FIRST_ID + 102;
	private static final int MSG_ADD = MSG_FIRST_ID + 103;
	private static final int MSG_REMOVE = MSG_FIRST_ID + 104;
	private static final int MSG_FIRE_COL_CHANGE = MSG_FIRST_ID + 105;
	private static final int MSG_FIRE_ROW_CHANGE = MSG_FIRST_ID + 106;
	private static final int MSG_FORCE_LAYOUT = MSG_FIRST_ID + 107;
	private boolean useSpinner = false;

	public PickerProxy()
	{
		super();
	}

	public PickerProxy(TiContext tiContext)
	{
		this();
	}

	@Override
	public void handleCreationDict(KrollDict dict) {
		super.handleCreationDict(dict);
		if (dict.containsKey("useSpinner")) {
			useSpinner = TiConvert.toBoolean(dict, "useSpinner");
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
		if (type == UIModule.PICKER_TYPE_COUNT_DOWN_TIMER ) {
			Log.w(TAG, "Countdown timer not supported in Titanium for Android");
			return null;
		} else if (type == UIModule.PICKER_TYPE_DATE_AND_TIME) {
			Log.w(TAG, "Date+Time timer not supported in Titanium for Android");
			return null;
		} else if (type == UIModule.PICKER_TYPE_PLAIN ) {
			return createPlainPicker(activity, useSpinner);
		} else if (type == UIModule.PICKER_TYPE_DATE ) {
			if (useSpinner) {
				return createDateSpinner(activity);
			} else {
				return createDatePicker(activity);
			}
		} else if (type == UIModule.PICKER_TYPE_TIME) {
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

	private TiUIView createTimeSpinner(Activity activity)
	{
		return new TiUITimeSpinner(this, activity);
	}
	
	private TiUIView createDateSpinner(Activity activity)
	{
		return new TiUIDateSpinner(this, activity);
	}
	
	@Kroll.getProperty @Kroll.method
	public boolean getUseSpinner()
	{
		return useSpinner;
	}
	@Kroll.setProperty @Kroll.method
	public void setUseSpinner(boolean value)
	{
		if (peekView() != null) {
			Log.w(TAG, "Attempt to change useSpinner property after view has already been created. Ignoring.");
		} else {
			useSpinner = value;
			if (children != null && children.size() > 0) {
				for (TiViewProxy child : children) {
					if (child instanceof PickerColumnProxy) {
						((PickerColumnProxy)child).setUseSpinner(value);
					}
				}
			}
		}
	}

	@Kroll.getProperty @Kroll.method
	public int getType()
	{
		return type;
	}

	@Kroll.setProperty @Kroll.method
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
		if (TiApplication.isUIThread() || peekView() == null) {
			handleRemoveColumn(child);
		} else {
			TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_REMOVE), child);
		}
	}

	private void handleRemoveColumn(TiViewProxy child)
	{
		int index = -1;
		if (children.contains(child)){
			index = children.indexOf(child);
		}
		super.remove(child);
		if (peekView() instanceof TiUIPicker){
			((TiUIPicker)peekView()).onColumnRemoved(index);
		}
	}

	@Override
	public void add(TiViewProxy child)
	{
		this.add((Object)child);
	}

	// We need a special add() method above and beyond the TiViewProxy add() because
	// because we can also accept array of PickerRowProxys
	@Kroll.method
	public void add(Object child) 
	{
		if (!isPlainPicker()) {
			Log.w(TAG, "Attempt to add to date/time or countdown picker ignored.");
			return;
		}
		if (TiApplication.isUIThread() || peekView() == null) {
			handleAddObject(child);

		} else {
			TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_ADD), child);
		}
	}

	private void handleAddObject(Object child)
	{
		if (child instanceof PickerColumnProxy) {
			PickerColumnProxy column = (PickerColumnProxy)child;
			prepareColumn(column);
			super.add(column);
			if (peekView() instanceof TiUIPicker) {
				((TiUIPicker)peekView()).onColumnAdded(children.indexOf(column));
			}
		} else if (child instanceof PickerRowProxy) {
			getFirstColumn(true).add((PickerRowProxy)child);
		} else if (child.getClass().isArray()) {
			getFirstColumn(true).addRows((Object[])child);
		} else {
			Log.w(TAG, "Unexpected type not added to picker: " + child.getClass().getName());
		}
	}

	private void prepareColumn(PickerColumnProxy column)
	{
		column.setUseSpinner(useSpinner);
		column.setColumnListener(this);
	}

	@Override
	public boolean handleMessage(Message msg)
	{
		switch(msg.what){
			case MSG_SELECT_ROW : {
				AsyncResult result = (AsyncResult)msg.obj;
				handleSelectRow( (KrollDict)result.getArg() );
				result.setResult(null);
				return true;
			}
			case MSG_SET_COLUMNS: {
				AsyncResult result = (AsyncResult)msg.obj;
				handleSetColumns(result.getArg());
				result.setResult(null);
				return true;
			}
			case MSG_ADD: {
				AsyncResult result = (AsyncResult)msg.obj;
				handleAddObject(result.getArg());
				result.setResult(null);
				return true;
			}
			case MSG_REMOVE: {
				AsyncResult result = (AsyncResult)msg.obj;
				handleRemoveColumn((TiViewProxy)result.getArg());
				result.setResult(null);
				return true;
			}
			case MSG_FIRE_COL_CHANGE: {
				handleFireColumnModelChange(msg.arg1);
				return true;
			}
			case MSG_FIRE_ROW_CHANGE: {
				handleFireRowChange(msg.arg1, msg.arg2);
				return true;
			}
			case MSG_FORCE_LAYOUT: {
				handleForceRequestLayout();
				return true;
			}
		}
		return super.handleMessage(msg);
	}

	@Kroll.method
	public void setSelectedRow(int column, int row, @Kroll.argument(optional=true) boolean animated)
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
		}

		// View exists
		if (TiApplication.isUIThread()) {
			handleSelectRow(column, row, animated);

		} else {
			KrollDict dict = new KrollDict();
			dict.put("column", new Integer(column));
			dict.put("row", new Integer(row));
			dict.put("animated", new Boolean(animated));

			TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_SELECT_ROW), dict);
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
			int rowIndex = ((TiUIPicker)peekView()).getSelectedRowIndex(columnIndex);
			if (rowIndex >= 0) {
				row = getRow(columnIndex, rowIndex);
			}
		}
		return row;
	}

	@Kroll.getProperty @Kroll.method
	public PickerColumnProxy[] getColumns()
	{
		if (!isPlainPicker()) {
			Log.w(TAG, "Cannot get columns from date/time or countdown picker.");
			return null;
		}
		if (children == null) {
			return new PickerColumnProxy[]{};
		} else {
			return children.toArray(new PickerColumnProxy[children.size()]);
		}
	}

	@Kroll.setProperty @Kroll.method
	public void setColumns(Object passedColumns)
	{
		if (!isPlainPicker()) {
			Log.w(TAG, "Cannot set columns in date/time or countdown picker.");
			return;
		}
		if (TiApplication.isUIThread() || peekView() == null) {
			handleSetColumns(passedColumns);

		} else {
			TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_SET_COLUMNS), passedColumns);
		}
	}

	private void handleSetColumns(Object passedColumns) {
		boolean dirty = false;
		try {
			if (peekView() instanceof TiUIPicker){
				((TiUIPicker)peekView()).batchModelChange = true;
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
				columns = new Object[]{passedColumns};
			}
			if (!(columns[0] instanceof PickerColumnProxy)) {
				Log.w(TAG, "Unexpected object type ignored for setColumns");
			} else { 
				for (Object o : columns) {
					if (o instanceof PickerColumnProxy) {
						add((PickerColumnProxy)o);
						dirty = true;
					}
				}
			}
		} finally{
			if (peekView() instanceof TiUIPicker){
				((TiUIPicker)peekView()).batchModelChange = false;
			}
		}
		if (dirty) {
			TiUIPicker pickerView = (TiUIPicker) peekView();
			if (pickerView != null) {
				pickerView.onModelReplaced();
			}
		}
	}

	private void handleSelectRow(KrollDict dict)
	{
		handleSelectRow(dict.getInt("column"), dict.getInt("row"), dict.getBoolean("animated"));
	}

	private void handleSelectRow(int column, int row, boolean animated)
	{
		if (peekView() == null) {
			return;
		}
		((TiUIPicker)peekView()).selectRow(column, row, animated);
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
			return (PickerColumnProxy)children.get(index);
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
		if (rowArray == null || rowIndex >= rowArray.length || (!(rowArray[rowIndex] instanceof PickerRowProxy))){
			return null;
		} else {
			return (PickerRowProxy)rowArray[rowIndex];
		}
	}

	public PickerColumnProxy getFirstColumn(boolean createIfMissing) 
	{
		PickerColumnProxy column = getColumn(0);
		if (column == null && createIfMissing) {
			column = new PickerColumnProxy();
			add(column);
		}
		return column;
	}

	// This is meant to be a kind of "static" method, in the sense that
	// it doesn't use any state except for context.  It's a quick hit way
	// of getting a date dialog up, in other words.
	@Kroll.method
	public void showDatePickerDialog(Object[] args)
	{
		HashMap settings = new HashMap();
		final AtomicInteger callbackCount = new AtomicInteger(0); // just a flag to be sure dismiss doesn't fire callback if ondateset did already.
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
			dateSetListener = new DatePickerDialog.OnDateSetListener()
			{
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
						callback.callAsync(getKrollObject(), new Object[]{ data });
					}
				}
			};
			dismissListener = new DialogInterface.OnDismissListener()
			{
				@Override
				public void onDismiss(DialogInterface dialog)
				{
					if (callbackCount.get() == 0 && callback != null) {
						callbackCount.incrementAndGet();
						KrollDict data = new KrollDict();
						data.put("cancel", true);
						data.put("value", null);
						callback.callAsync(getKrollObject(), new Object[]{ data });
					}
				}
			};
		}

		/*
		 * use getAppCurrentActivity over getActivity since technically the picker
		 * should show up on top of the current activity when called - not just the
		 * activity it was created in
		 */
		DatePickerDialog dialog = new DatePickerDialog(
					TiApplication.getAppCurrentActivity(),
					dateSetListener,
					calendar.get(Calendar.YEAR),
					calendar.get(Calendar.MONTH),
					calendar.get(Calendar.DAY_OF_MONTH));
			
		dialog.setCancelable(true);
		if (dismissListener != null) {
			dialog.setOnDismissListener(dismissListener);
		}
		if (settings.containsKey("title")) {
			dialog.setTitle(TiConvert.toString(settings, "title"));
		}
		dialog.show();
		if (settings.containsKey("okButtonTitle")) {
			dialog.getButton(DatePickerDialog.BUTTON_POSITIVE).setText(TiConvert.toString(settings, "okButtonTitle"));
		}
	}

	// This is meant to be a kind of "static" method, in the sense that
	// it doesn't use any state except for context.  It's a quick hit way
	// of getting a date dialog up, in other words.
	@Kroll.method
	public void showTimePickerDialog(Object[] args)
	{
		HashMap settings = new HashMap();
		boolean is24HourView = false;
		final AtomicInteger callbackCount = new AtomicInteger(0); // just a flag to be sure dismiss doesn't fire callback if ondateset did already.
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
			timeSetListener = new TimePickerDialog.OnTimeSetListener()
			{
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
						callback.callAsync(getKrollObject(), new Object[]{ data });
					}
				}
			};
			dismissListener = new DialogInterface.OnDismissListener()
			{
				@Override
				public void onDismiss(DialogInterface dialog)
				{
					if (callbackCount.get() == 0 && callback != null) {
						callbackCount.incrementAndGet();
						KrollDict data = new KrollDict();
						data.put("cancel", true);
						data.put("value", null);
						callback.callAsync(getKrollObject(), new Object[]{ data });
					}
				}
			};
		}
		TimePickerDialog dialog = new TimePickerDialog(
					getActivity(),
					timeSetListener,
					calendar.get(Calendar.HOUR_OF_DAY),
					calendar.get(Calendar.MINUTE),
					is24HourView);
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
		if (!(peekView() instanceof TiUIPicker)) {
			return;
		}
		if (TiApplication.isUIThread()) {
			handleFireColumnModelChange(columnIndex);
		} else {
			Message message = getMainHandler().obtainMessage(MSG_FIRE_COL_CHANGE);
			//Message msg = getUIHandler().obtainMessage(MSG_FIRE_COL_CHANGE);
			message.arg1 = columnIndex;
			message.sendToTarget();
		}
	}
	
	private void handleFireColumnModelChange(int columnIndex)
	{
		if (peekView() instanceof TiUIPicker) {
			((TiUIPicker)peekView()).onColumnModelChanged(columnIndex);
		}
	}
	
	private void fireRowChange(int columnIndex, int rowIndex)
	{
		if (!(peekView() instanceof TiUIPicker)) {
			return;
		}
		if (TiApplication.isUIThread()) {
			handleFireRowChange(columnIndex, rowIndex);
		} else {
			Message message = getMainHandler().obtainMessage(MSG_FIRE_ROW_CHANGE);
			//Message msg = getUIHandler().obtainMessage(MSG_FIRE_ROW_CHANGE);
			message.arg1 = columnIndex;
			message.arg2 = rowIndex;
			message.sendToTarget();
		}
	}
	
	private void handleFireRowChange(int columnIndex, int rowIndex)
	{
		if (peekView() instanceof TiUIPicker) {
			((TiUIPicker)peekView()).onRowChanged(columnIndex, rowIndex);
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
		if (!(peekView() instanceof TiUISpinner)) {
			return;
		}
		if (TiApplication.isUIThread()) {
			handleForceRequestLayout();
		} else {
			getMainHandler().obtainMessage(MSG_FORCE_LAYOUT).sendToTarget();
			//getUIHandler().obtainMessage(MSG_FORCE_LAYOUT).sendToTarget();
		}
	}

	private void handleForceRequestLayout()
	{
		((TiUISpinner)view).forceRequestLayout();
	}
}

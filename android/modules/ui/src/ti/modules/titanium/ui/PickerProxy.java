/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.picker.TiUIDatePicker;
import ti.modules.titanium.ui.widget.picker.TiUIDateSpinner;
import ti.modules.titanium.ui.widget.picker.TiUIPicker;
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

public class PickerProxy extends TiViewProxy 
{
	private int type = UIModule.PICKER_TYPE_PLAIN;
	private ArrayList<PickerColumnProxy>columns = new ArrayList<PickerColumnProxy>();
	private ArrayList<Integer> preselectedRows = new ArrayList<Integer>();
	private static final String LCAT = "PickerProxy";
	
	private static final int MSG_FIRST_ID = TiViewProxy.MSG_LAST_ID + 1;
	private static final int MSG_APPEND_VIEW_COLUMN = MSG_FIRST_ID + 100;
	private static final int MSG_SELECT_ROW = MSG_FIRST_ID + 101;
	private static final int MSG_REPLACE_MODEL = MSG_FIRST_ID + 102;
	
	public PickerProxy(TiContext tiContext, Object[] args)
	{
		super(tiContext, args);
		if (hasDynamicValue("type")) {
			type = getDynamicProperties().getInt("type");
		}
	}
	
	@Override
	public TiUIView createView(Activity activity) 
	{
		boolean useSpinner = false;
		if (hasDynamicValue("useSpinner")) {
			useSpinner = (TiConvert.toBoolean(getDynamicValue("useSpinner")));
		}
		if (type == UIModule.PICKER_TYPE_COUNT_DOWN_TIMER ) {
			Log.w(LCAT, "Countdown timer not supported in Titanium for Android");
			return null;
		} else if (type == UIModule.PICKER_TYPE_DATE_AND_TIME) {
			Log.w(LCAT, "Countdown timer not supported in Titanium for Android");
			return null;
		} else if (type == UIModule.PICKER_TYPE_PLAIN ) {
			return createPlainPicker(activity);
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
			Log.w(LCAT, "Unknown picker type");
			return null;
		}
		
	}
	
	private TiUIView createPlainPicker(Activity activity)
	{
		TiUIPicker picker = new TiUIPicker(this);
		if ((columns == null || columns.size() == 0) && hasDynamicValue("columns") ) {
			Object columnsAtCreation = getDynamicValue("columns");
			if (columnsAtCreation.getClass().isArray()) {
				Object[] columnsArray = (Object[]) columnsAtCreation;
				if (this.columns == null) {
					this.columns = new ArrayList<PickerColumnProxy>();
				}
				for (Object column : columnsArray) {
					if (column instanceof PickerColumnProxy) {
						this.columns.add((PickerColumnProxy) column);
					}
				}
			}
		}
		if (columns != null && columns.size() > 0) {
			picker.addColumns( getColumnsAsListOfLists() );
			if (preselectedRows != null && preselectedRows.size() > 0) {
				picker.selectRows(preselectedRows);
			}
		}
		
		return picker;
	}
	
	private TiUIView createDatePicker(Activity activity)
	{
		return new TiUIDatePicker(this);
	}
	
	private TiUIView createTimePicker(Activity activity)
	{
		return new TiUITimePicker(this);
	}
	
	private TiUIView createTimeSpinner(Activity activity)
	{
		return new TiUITimeSpinner(this);
	}
	
	private TiUIView createDateSpinner(Activity activity)
	{
		return new TiUIDateSpinner(this);
	}
	
	public int getType()
	{
		return type;
	}
	
	public void setType(int type)
	{
		if (peekView() != null) {
			Log.e(LCAT, "Attempt to change picker type after view has been created.");
			throw new IllegalStateException("You cannot change the picker type after it has been rendered.");
		}
		this.type = type;
	}
	
	private boolean isPlainPicker()
	{
		return (type == UIModule.PICKER_TYPE_PLAIN);
	}
	
	
	private ArrayList<ArrayList<PickerRowProxy>> getColumnsAsListOfLists()
	{
		ArrayList<ArrayList<PickerRowProxy>> rowLists = new ArrayList<ArrayList<PickerRowProxy>>();
		if (columns != null && columns.size() > 0) {
			for (PickerColumnProxy column : columns) {
				rowLists.add(column.getRowArrayList());
			}
		}
		return rowLists;
	}

	// We need special handling because can also accept array
	@Override
	public void add(TiViewProxy child)
	{
		add((Object)child);
	}
	
	public void add(Object child) 
	{
		if (!isPlainPicker()) {
			Log.w(LCAT, "Attempt to add to date/time or countdown picker ignored.");
			return;
		}
		boolean firstColumnExists = (columns != null && columns.size() > 0);
		boolean columnAdded = false;
		if (child instanceof PickerRowProxy) {
			getFirstColumn(true).addRow((PickerRowProxy)child);
			columnAdded = !firstColumnExists;
		} else if (child.getClass().isArray()) {
			getFirstColumn(true).addRows((Object[]) child);
			columnAdded = !firstColumnExists;
		} else if (child instanceof PickerColumnProxy) {
			addColumn((PickerColumnProxy)child);
			columnAdded = true;
		} else {
			Log.w(LCAT, "Unexpected type not added to picker: " + child.getClass().getName());
			return;
		}
		
		if (columnAdded && peekView() != null) {
			appendViewColumn();
		}
	}
	
	private void appendViewColumn()
	{
		if (peekView() == null) {
			return;
		}
		if (getTiContext().isUIThread()) {
			handleAppendViewColumn(peekView());
			return;
		} else {
			AsyncResult result = new AsyncResult(peekView());
			Message msg = getUIHandler().obtainMessage(MSG_APPEND_VIEW_COLUMN, result);
			msg.sendToTarget();
			result.getResult();
		}
	}
	
	@Override
	public boolean handleMessage(Message msg)
	{
		if (msg.what == MSG_APPEND_VIEW_COLUMN) {
			AsyncResult result = (AsyncResult)msg.obj;
			handleAppendViewColumn( (TiUIView)result.getArg() );
			result.setResult(null);
			return true;
		} else if (msg.what == MSG_SELECT_ROW) {
			AsyncResult result = (AsyncResult)msg.obj;
			handleSelectRow( (KrollDict)result.getArg() );
			result.setResult(null);
			return true;
		} else if (msg.what == MSG_REPLACE_MODEL) {
			AsyncResult result = (AsyncResult)msg.obj;
			handleReplaceViewModel();
			result.setResult(null);
			return true;
		} else {
			return super.handleMessage(msg);
		}
	}
	
	public void setSelectedRow(int column, int row, boolean animated)
	{
		if (!isPlainPicker()) {
			Log.w(LCAT, "Selecting row in date/time or countdown picker is not supported.");
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
		if (getTiContext().isUIThread()) {
			handleSelectRow(column, row, animated);			
		} else {
			KrollDict dict = new KrollDict();
			dict.put("column", new Integer(column));
			dict.put("row", new Integer(row));
			dict.put("animated", new Boolean(animated));
			AsyncResult result = new AsyncResult(dict);
			Message msg = getUIHandler().obtainMessage(MSG_SELECT_ROW, result);
			msg.sendToTarget();
			result.getResult();
		}
		
	}
	
	public PickerRowProxy getSelectedRow(int columnIndex)
	{
		if (!isPlainPicker()) {
			Log.w(LCAT, "Cannot get selected row in date/time or countdown picker.");
			return null;
		}
		if (peekView() == null) {
			return null;
		}
		
		return ((TiUIPicker)peekView()).getSelectedRow(columnIndex);
	}
	
	public PickerColumnProxy[] getColumns()
	{
		if (!isPlainPicker()) {
			Log.w(LCAT, "Cannot get columns from date/time or countdown picker.");
			return null;
		}
		if (columns == null) {
			return new PickerColumnProxy[]{};
		} else {
			return columns.toArray(new PickerColumnProxy[columns.size()]);
		}
	}
	
	public void setColumns(Object[] rawcolumns)
	{
		if (!isPlainPicker()) {
			Log.w(LCAT, "Cannot set columns in date/time or countdown picker.");
			return;
		}
		if (rawcolumns == null || rawcolumns.length == 0) {
			this.columns = new ArrayList<PickerColumnProxy>();
		} else {
			if (!(rawcolumns[0] instanceof PickerColumnProxy)) {
				Log.w(LCAT, "Unexpected object type ignored for setColumns");
				return;
			} 
			this.columns = new ArrayList<PickerColumnProxy>();
			for (Object o : rawcolumns) {
				this.columns.add((PickerColumnProxy) o);
			}
		}
		
		if (peekView() != null) {
			if (getTiContext().isUIThread()) {
				handleReplaceViewModel();
			} else {
				AsyncResult result = new AsyncResult();
				Message msg = getUIHandler().obtainMessage(MSG_REPLACE_MODEL, result);
				msg.sendToTarget();
				result.getResult();
			}
		}
	}
	
	private void handleReplaceViewModel() 
	{
		TiUIPicker picker = (TiUIPicker) peekView();
		if (picker == null){
			return;
		}
		picker.replaceColumns(getColumnsAsListOfLists());
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

	private void handleAppendViewColumn(TiUIView view) 
	{
		if (view == null) {
			return;
		}
		TiUIPicker picker = (TiUIPicker) view;
		picker.addColumn(columns.get(columns.size() - 1).getRowArrayList());
	}
	
	private PickerColumnProxy getFirstColumn(boolean createIfMissing) 
	{
		PickerColumnProxy column = null;
		
		if (columns == null) {
			columns = new ArrayList<PickerColumnProxy>();
		}
		
		if (columns.size() == 0 && createIfMissing) {
			column = new PickerColumnProxy(getTiContext());
			columns.add(column);
		} else {
			column = columns.get(0);
		}
		
		return column;
	}
	
	private void addColumn(PickerColumnProxy column)
	{
		TiUIView view = peekView();
		columns.add(column);
		if (peekView() != null) {
			((TiUIPicker)view).addColumn(column.getRowArrayList());
		}
	}
	
	// This is meant to be a kind of "static" method, in the sense that
	// it doesn't use any state except for context.  It's a quick hit way
	// of getting a date dialog up, in other words.
	public void showDatePickerDialog(Object[] args)
	{
		KrollDict settings = new KrollDict();
		final AtomicInteger callbackCount = new AtomicInteger(0); // just a flag to be sure dismiss doesn't fire callback if ondateset did already.
		
		if (args.length > 0) {
			settings = (KrollDict) args[0];
		}
		
		Calendar calendar = Calendar.getInstance();
		if (settings.containsKey("value")) {
			calendar.setTime(TiConvert.toDate(settings, "value"));
		}
		
		final KrollCallback callback;
		if (settings.containsKey("callback")) {
			Object typeTest = settings.get("callback");
			if (typeTest instanceof KrollCallback) {
				callback = (KrollCallback) typeTest; 
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
						callback.call(new Object[]{ data });
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
						callback.call(new Object[]{ data });
					}
				}
			};
						
		}
		
		DatePickerDialog dialog = new DatePickerDialog(
					getTiContext().getActivity(),
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
	public void showTimePickerDialog(Object[] args)
	{
		KrollDict settings = new KrollDict();
		boolean is24HourView = false;
		final AtomicInteger callbackCount = new AtomicInteger(0); // just a flag to be sure dismiss doesn't fire callback if ondateset did already.
		
		if (args.length > 0) {
			settings = (KrollDict) args[0];
		}
		
		if (settings.containsKey("format24")) {
			is24HourView = TiConvert.toBoolean(settings, "format24");
		}
		
		Calendar calendar = Calendar.getInstance();
		if (settings.containsKey("value")) {
			calendar.setTime(TiConvert.toDate(settings, "value"));
		}
		
		final KrollCallback callback;
		if (settings.containsKey("callback")) {
			Object typeTest = settings.get("callback");
			if (typeTest instanceof KrollCallback) {
				callback = (KrollCallback) typeTest; 
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
						callback.call(new Object[]{ data });
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
						callback.call(new Object[]{ data });
					}
				}
			};
						
		}
		
		TimePickerDialog dialog = new TimePickerDialog(
					getTiContext().getActivity(),
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

}

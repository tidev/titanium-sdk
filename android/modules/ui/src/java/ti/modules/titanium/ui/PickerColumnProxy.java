/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.AsyncResult;
import org.appcelerator.kroll.common.TiMessenger;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.PickerRowProxy.PickerRowListener;
import ti.modules.titanium.ui.widget.picker.TiUIPickerColumn;
import ti.modules.titanium.ui.widget.picker.TiUISpinnerColumn;
import android.app.Activity;
import android.os.Message;
import android.util.Log;

@Kroll.proxy(creatableInModule=UIModule.class)
public class PickerColumnProxy extends TiViewProxy implements PickerRowListener
{
	private static final String TAG = "PickerColumnProxy";
	private static final int MSG_FIRST_ID = TiViewProxy.MSG_LAST_ID + 1;
	private static final int MSG_ADD = MSG_FIRST_ID + 100;
	private static final int MSG_REMOVE = MSG_FIRST_ID + 101;
	private static final int MSG_SET_ROWS = MSG_FIRST_ID + 102;
	private static final int MSG_ADD_ARRAY = MSG_FIRST_ID + 103;
	private PickerColumnListener columnListener  = null;
	private boolean useSpinner = false;
	private boolean suppressListenerEvents = false;


	public PickerColumnProxy()
	{
		super();
	}

	public PickerColumnProxy(TiContext tiContext)
	{
		this();
	}

	public void setColumnListener(PickerColumnListener listener)
	{
		columnListener = listener;
	}
	public void setUseSpinner(boolean value)
	{
		useSpinner = value;
	}
	@Override
	public boolean handleMessage(Message msg)
	{
		switch(msg.what){
			case MSG_ADD: {
				AsyncResult result = (AsyncResult)msg.obj;
				handleAddRow((TiViewProxy)result.getArg());
				result.setResult(null);
				return true;
			}
			case MSG_ADD_ARRAY: {
				AsyncResult result = (AsyncResult)msg.obj;
				handleAddRowArray((Object [])result.getArg());
				result.setResult(null);
				return true;
			}
				
			case MSG_REMOVE: {
				AsyncResult result = (AsyncResult)msg.obj;
				handleRemoveRow((TiViewProxy)result.getArg());
				result.setResult(null);
				return true;
			}
			case MSG_SET_ROWS: {
				AsyncResult result = (AsyncResult)msg.obj;
				handleSetRows((Object[])result.getArg());
				result.setResult(null);
				return true;
			}
		}
		return super.handleMessage(msg);
	}

	@Override
	public void handleCreationDict(KrollDict dict) {
		super.handleCreationDict(dict);
		if (dict.containsKey("rows")) {
			Object rowsAtCreation = dict.get("rows");
			if (rowsAtCreation.getClass().isArray()) {
				Object[] rowsArray = (Object[]) rowsAtCreation;
				addRows(rowsArray);
			}
		}
	}

	@Override
	public void add(TiViewProxy o)
	{
		if (TiApplication.isUIThread()) {
			handleAddRow(o);
		} else {
			TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_ADD), o);
		}
	}
	
	private void handleAddRowArray(Object[] o)
	{
		for (Object oChild: o)
		{
			if (oChild instanceof PickerRowProxy) {
				handleAddRow((PickerRowProxy) oChild);
			}
			else
			{
				Log.w(TAG, "add() unsupported argument type: " + oChild.getClass().getSimpleName());
			}
		}
	}
	
	private void handleAddRow(TiViewProxy o)
	{
		if (o == null)return;
		if (o instanceof PickerRowProxy) {
			((PickerRowProxy)o).setRowListener(this);
			super.add((PickerRowProxy)o);
			if (columnListener != null && !suppressListenerEvents) {
				int index = children.indexOf(o);
				columnListener.rowAdded(this, index);
			}
		} else {
			Log.w(TAG, "add() unsupported argument type: " + o.getClass().getSimpleName());
		}
	}
	

	@Override
	public void remove(TiViewProxy o)
	{
		if (TiApplication.isUIThread() || peekView() == null) {
			handleRemoveRow(o);

		} else {
			TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_REMOVE), o);
		}
	}

	private void handleRemoveRow(TiViewProxy o)
	{
		if (o == null)return;
		if (o instanceof PickerRowProxy) {
			int index = children.indexOf(o);
			super.remove((PickerRowProxy)o);
			if (columnListener != null && !suppressListenerEvents) {
				columnListener.rowRemoved(this, index);
			}
		} else {
			Log.w(TAG, "remove() unsupported argment type: " + o.getClass().getSimpleName());
		}
	}

	@Kroll.method
	public void addRow(Object row)
	{
		if (row instanceof PickerRowProxy) {
			this.add((PickerRowProxy) row);
		} else {
			Log.w(TAG, "Unable to add the row. Invalid type for row.");
		}
	}

	protected void addRows(Object[] rows) 
	{
		if (TiApplication.isUIThread()) {
			handleAddRowArray(rows);

		} else {
			TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_ADD_ARRAY), rows);
		}
	}

	@Kroll.method
	public void removeRow(Object row)
	{
		if (row instanceof PickerRowProxy) {
			this.remove((PickerRowProxy) row);
		} else {
			Log.w(TAG, "Unable to remove the row. Invalid type for row.");
		}
	}

	@Kroll.getProperty @Kroll.method
	public PickerRowProxy[] getRows()
	{
		if (children == null || children.size() == 0) {
			return null;
		}
		return children.toArray(new PickerRowProxy[children.size()]);
	}
	
	@Kroll.setProperty @Kroll.method
	public void setRows(Object[] rows)
	{
		if (TiApplication.isUIThread() || peekView() == null) {
			handleSetRows(rows);

		} else {
			TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_SET_ROWS), rows);
		}
	}

	private void handleSetRows(Object[] rows)
	{
		try {
			suppressListenerEvents = true;
			if (children != null && children.size() > 0) {
				int count = children.size();
				for (int i = (count - 1); i >= 0; i--) {
					remove(children.get(i));
				}
			}
			addRows(rows);
		} finally {
			suppressListenerEvents = false;
		}
		if (columnListener != null) {
			columnListener.rowsReplaced(this);
		}
	}

	@Kroll.getProperty @Kroll.method
	public int getRowCount()
	{
		return children.size();
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		if (useSpinner) {
			return new TiUISpinnerColumn(this);
		} else {
			return new TiUIPickerColumn(this);
		}
	}
	
	public interface PickerColumnListener
	{
		void rowAdded(PickerColumnProxy column, int rowIndex);
		void rowRemoved(PickerColumnProxy column, int oldRowIndex);
		void rowChanged(PickerColumnProxy column, int rowIndex);
		void rowSelected(PickerColumnProxy column, int rowIndex);
		void rowsReplaced(PickerColumnProxy column); // wholesale replace of rows
	}

	@Override
	public void rowChanged(PickerRowProxy row)
	{
		if (columnListener != null && !suppressListenerEvents) {
			int index = children.indexOf(row);
			columnListener.rowChanged(this, index);
		}
		
	}
	
	public void onItemSelected(int rowIndex)
	{
		if (columnListener != null && !suppressListenerEvents) {
			columnListener.rowSelected(this, rowIndex);
		}
	}

	public PickerRowProxy getSelectedRow()
	{
		if (!(peekView() instanceof TiUISpinnerColumn)) {
			return null;
		}
		int rowIndex = ((TiUISpinnerColumn)peekView()).getSelectedRowIndex();
		if (rowIndex < 0) {
			return null;
		} else {
			return (PickerRowProxy)children.get(rowIndex);
		}
	}
	
	public int getThisColumnIndex()
	{
		return ((PickerProxy)getParent()).getColumnIndex(this);
	}

	public void parentShouldRequestLayout()
	{
		if (getParent() instanceof PickerProxy) {
			((PickerProxy)getParent()).forceRequestLayout();
		}
	}
}

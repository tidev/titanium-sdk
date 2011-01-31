/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.AsyncResult;
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
	private static final String LCAT = "PickerColumnProxy";
	private static final int DEFAULT_VISIBLE_ITEMS_COUNT = 5;
	private int visibleItems = DEFAULT_VISIBLE_ITEMS_COUNT;
	private static final int MSG_FIRST_ID = TiViewProxy.MSG_LAST_ID + 1;
	private static final int MSG_ADD = MSG_FIRST_ID + 100;
	private static final int MSG_REMOVE = MSG_FIRST_ID + 101;
	private PickerColumnListener columnListener  = null;
	private boolean useSpinner = false;

	public PickerColumnProxy(TiContext tiContext)
	{
		super(tiContext);
	}
	public void setColumnListener(PickerColumnListener listener)
	{
		columnListener = listener;
	}
	public void setUseSpinner(boolean value)
	{
		useSpinner = value;
	}
	public void setVisibleItems(int count)
	{
		boolean changed = (count != visibleItems);
		visibleItems = count;
		// Relevant if we're using the spinner style of picker control.
		if (changed && peekView() != null && useSpinner) {
			((TiUISpinnerColumn)view).refreshNativeView();
		}
	}
	public int getVisibleItems()
	{
		return visibleItems;
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
			case MSG_REMOVE: {
				AsyncResult result = (AsyncResult)msg.obj;
				handleRemoveRow((TiViewProxy)result.getArg());
				result.setResult(null);
				return true;
			}
		}
		return super.handleMessage(msg);
	}

	@Override
	public void handleCreationDict(KrollDict dict) {
		super.handleCreationDict(dict);
		if (hasProperty("rows")) {
			Object rowsAtCreation = getProperty("rows");
			if (rowsAtCreation.getClass().isArray()) {
				Object[] rowsArray = (Object[]) rowsAtCreation;
				addRows(rowsArray);
			}
		}
	}

	@Override
	public void add(TiViewProxy o)
	{
		if (getTiContext().isUIThread() || peekView() == null) {
			handleAddRow(o);
		} else {
			AsyncResult result = new AsyncResult(o);
			Message msg = getUIHandler().obtainMessage(MSG_ADD, result);
			msg.sendToTarget();
			result.getResult();
		}
	}
	
	private void handleAddRow(TiViewProxy o)
	{
		if (o == null)return;
		if (o instanceof PickerRowProxy) {
			((PickerRowProxy)o).setRowListener(this);
			super.add((PickerRowProxy)o);
			if (columnListener != null) {
				int index = children.indexOf(o);
				columnListener.rowAdded(this, index);
			}
		} else {
			Log.w(LCAT, "add() unsupported argument type: " + o.getClass().getSimpleName());
		}
	}
	

	@Override
	public void remove(TiViewProxy o)
	{
		if (getTiContext().isUIThread() || peekView() == null) {
			handleRemoveRow(o);
		} else {
			AsyncResult result = new AsyncResult(o);
			Message msg = getUIHandler().obtainMessage(MSG_REMOVE, result);
			msg.sendToTarget();
			result.getResult();
		}
	}

	private void handleRemoveRow(TiViewProxy o)
	{
		if (o == null)return;
		if (o instanceof PickerRowProxy) {
			int index = children.indexOf(o);
			super.remove((PickerRowProxy)o);
			if (columnListener != null) {
				columnListener.rowRemoved(this, index);
			}
		} else {
			Log.w(LCAT, "remove() unsupported argment type: " + o.getClass().getSimpleName());
		}
	}

	@Kroll.method
	public void addRow(PickerRowProxy row)
	{
		this.add(row);
	}

	protected void addRows(Object[] rows) 
	{
		for (Object obj :rows) {
			if (obj instanceof PickerRowProxy) {
				this.add((PickerRowProxy)obj);
			} else {
				Log.w(LCAT, "Unexpected type not added to picker column: " + obj.getClass().getName());
			}
		}
	}

	@Kroll.method
	public void removeRow(PickerRowProxy row) 
	{
		this.remove(row);
	}

	@Kroll.getProperty @Kroll.method
	public PickerRowProxy[] getRows()
	{
		if (children == null || children.size() == 0) {
			return null;
		}
		return children.toArray(new PickerRowProxy[children.size()]);
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
	}

	@Override
	public void rowChanged(PickerRowProxy row)
	{
		if (columnListener != null) {
			int index = children.indexOf(row);
			columnListener.rowChanged(this, index);
		}
		
	}
	
	public void onItemSelected(int rowIndex)
	{
		if (columnListener != null) {
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
}

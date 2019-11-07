/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.AsyncResult;
import org.appcelerator.kroll.common.TiMessenger;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.os.Message;
import android.util.Log;

import ti.modules.titanium.ui.PickerRowProxy.PickerRowListener;
import ti.modules.titanium.ui.widget.picker.TiUIPickerColumn;
import ti.modules.titanium.ui.widget.picker.TiUISpinnerColumn;

@Kroll.proxy(creatableInModule = UIModule.class)
public class PickerColumnProxy extends TiViewProxy implements PickerRowListener
{
	private static final String TAG = "PickerColumnProxy";

	private PickerColumnListener columnListener = null;
	private boolean useSpinner = false;
	private boolean suppressListenerEvents = false;

	// Indicate whether this picker column is not created by users.
	// Users can directly add picker rows to the picker. In this case, we create a picker column for them and this is
	// the only column in the picker.
	private boolean createIfMissing = false;

	public PickerColumnProxy()
	{
		super();
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
	public void handleCreationDict(KrollDict dict)
	{
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
	public void add(Object args)
	{
		handleAddRow((TiViewProxy) args);
	}

	private void handleAddRow(TiViewProxy o)
	{
		if (o == null)
			return;
		if (o instanceof PickerRowProxy) {
			((PickerRowProxy) o).setRowListener(this);
			super.add((PickerRowProxy) o);
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
		if (o instanceof PickerRowProxy) {
			int index = children.indexOf(o);
			super.remove((PickerRowProxy) o);
			if (columnListener != null && !suppressListenerEvents) {
				columnListener.rowRemoved(this, index);
			}
		} else if (o != null) {
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
		for (Object row : rows) {
			addRow(row);
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

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public PickerRowProxy[] getRows()
	// clang-format on
	{
		if (children == null || children.size() == 0) {
			return null;
		}
		return children.toArray(new PickerRowProxy[children.size()]);
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setRows(Object[] rows)
	// clang-format on
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

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getRowCount()
	// clang-format on
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

	public interface PickerColumnListener {
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
		int rowIndex = ((TiUISpinnerColumn) peekView()).getSelectedRowIndex();
		if (rowIndex < 0) {
			return null;
		} else {
			return (PickerRowProxy) children.get(rowIndex);
		}
	}

	public int getThisColumnIndex()
	{
		return ((PickerProxy) getParent()).getColumnIndex(this);
	}

	public void parentShouldRequestLayout()
	{
		if (getParent() instanceof PickerProxy) {
			((PickerProxy) getParent()).forceRequestLayout();
		}
	}

	public void setCreateIfMissing(boolean flag)
	{
		createIfMissing = flag;
	}

	public boolean getCreateIfMissing()
	{
		return createIfMissing;
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.PickerColumn";
	}
}

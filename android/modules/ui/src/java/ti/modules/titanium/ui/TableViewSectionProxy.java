/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.util.ArrayList;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;

@Kroll.proxy(creatableInModule=UIModule.class, propertyAccessors = { 
	TiC.PROPERTY_HEADER_TITLE,
	TiC.PROPERTY_FOOTER_TITLE
})
public class TableViewSectionProxy extends TiViewProxy
{
	private static final String TAG = "TableViewSectionProxy";
	protected ArrayList<TableViewRowProxy> rows = new ArrayList<TableViewRowProxy>();

	public TableViewSectionProxy()
	{
		super();
		rows = new ArrayList<TableViewRowProxy>();
	}

	public TableViewSectionProxy(TiContext tiContext)
	{
		this();
	}

	@Override
	public TiUIView createView(Activity activity) {
		return null;
	}

	@Override
	public void setActivity(Activity activity)
	{
		super.setActivity(activity);
		if (rows != null) {
			for (TableViewRowProxy row : rows) {
				row.setActivity(activity);
			}
		}
	}

	@Kroll.method @Kroll.getProperty
	public TableViewRowProxy[] getRows()
	{
		return rows.toArray(new TableViewRowProxy[rows.size()]);
	}

	@Kroll.getProperty @Kroll.method
	public double getRowCount() {
		return rows.size();
	}

	@Kroll.method
	public void add(TableViewRowProxy rowProxy)
	{
		if (rowProxy != null) {
			rows.add(rowProxy);
			rowProxy.setParent(this);
		}
	}

	@Kroll.method
	public void remove(TableViewRowProxy rowProxy) {
		if (rowProxy != null) {
			rows.remove(rowProxy);
			if (rowProxy.getParent() == this) {
				rowProxy.setParent(null);
			}
		}
	}

	@Kroll.method
	public TableViewRowProxy rowAtIndex(int index)
	{
		TableViewRowProxy result = null;
		if (index > -1 && index < rows.size()) {
			result = rows.get(index);
		}

		return result;
	}

	@Kroll.method
	public void insertRowAt(int index, TableViewRowProxy row)
	{
		if (index > -1 && index <= rows.size()) {
			rows.add(index, row);
			row.setParent(this);
		} else {
			Log.e(TAG, "Index out of range. Unable to insert row at index " + index, Log.DEBUG_MODE);
		}
	}

	@Kroll.method
	public void removeRowAt(int index)
	{
		if (index > -1 && index < rows.size()) {
			TableViewRowProxy rowProxy = rows.get(index);
			rows.remove(index);
			if (rowProxy.getParent() == this) {
				rowProxy.setParent(null);
			}
		} else {
			Log.e(TAG, "Index out of range. Unable to remove row at index " + index, Log.DEBUG_MODE);
		}
	}

	@Kroll.method
	public void updateRowAt(int index, TableViewRowProxy row)
	{
		TableViewRowProxy oldRow = rows.get(index);
		if (row == oldRow) {
			return;
		}
		if (index > -1 && index < rows.size()) {
			rows.set(index, row);
			row.setParent(this);
			if (oldRow.getParent() == this) {
				oldRow.setParent(null);
			}
		} else {
			Log.e(TAG, "Index out of range. Unable to update row at index " + index, Log.DEBUG_MODE);
		}
	}

	@Override
	public String toString() {
		return "[object TableViewSectionProxy]";
	}

	@Override
	public void releaseViews()
	{
		super.releaseViews();
		if (rows != null) {
			for (TableViewRowProxy row : rows) {
				row.releaseViews();
			}
		}
	}
}

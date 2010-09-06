/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.util.ArrayList;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;

public class TableViewSectionProxy extends TiViewProxy
{

	ArrayList<TableViewRowProxy> rows;

	public TableViewSectionProxy(TiContext tiContext, Object[] args) {
		super(tiContext, args);
		rows = new ArrayList<TableViewRowProxy>();
	}

	@Override
	public TiUIView createView(Activity activity) {
		return null;
	}

	public TableViewRowProxy[] getRows()
	{
		return rows.toArray(new TableViewRowProxy[rows.size()]);
	}

	public double getRowCount() {
		return rows.size();
	}

	public void add(TableViewRowProxy rowProxy)
	{
		if (rowProxy != null) {
			rows.add(rowProxy);
			if (rowProxy.getParent() == null) {
				rowProxy.setParent(this);
			}
		}
	}

	public void remove(TableViewRowProxy rowProxy) {
		if (rowProxy != null) {
			rows.remove(rowProxy);
			if (rowProxy.getParent() == this) {
				rowProxy.setParent(null);
			}
		}
	}

	public TableViewRowProxy rowAtIndex(int index)
	{
		TableViewRowProxy result = null;
		if (index > -1 && index < rows.size()) {
			result = rows.get(index);
		}

		return result;
	}

	public void insertRowAt(int index, TableViewRowProxy row) {
		rows.add(index, row);
	}

	public void removeRowAt(int index) {
		rows.remove(index);
	}

	public void updateRowAt(int index, TableViewRowProxy row)
	{
		//TODO this may not be the most efficient way to handle this model change
		rows.set(index, row);
	}
	
	@Override
	public String toString() {
		return "[object TiUITableViewSection]";
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
		rows.clear();
	}
}

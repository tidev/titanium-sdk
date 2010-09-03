/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui;

import java.util.ArrayList;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;

import android.util.Log;

@Kroll.proxy(creatableInModule="UI")
public class PickerColumnProxy extends KrollProxy
{
	private ArrayList<PickerRowProxy> rows = new ArrayList<PickerRowProxy>();
	private static final String LCAT = "PickerColumnProxy";
	
	public PickerColumnProxy(TiContext tiContext)
	{
		super(tiContext);
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
	
	// Put in warnings for add() and remove().  Docs say we support them,
	// but this is not really a view.
	public void add(Object o) 
	{
		Log.w(LCAT, "add() not supported. Use addRow() to add a row.");
	}
	public void remove(Object o)
	{
		Log.w(LCAT, "remove() not supported.  Use removeRow() to remove a row.");
	}
	
	public void addRow(PickerRowProxy row)
	{
		addRow(row, true);
	}
	protected void addRow(PickerRowProxy row, boolean notifyListeners) 
	{
		rows.add(row);
	}
	
	protected void addRows(Object[] rows) 
	{
		ArrayList<PickerRowProxy> newrows = null;
		for (Object obj :rows) {
			if (obj instanceof PickerRowProxy) {
				if (newrows == null) {
					newrows = new ArrayList<PickerRowProxy>();
				}
				newrows.add((PickerRowProxy)obj);
			} else {
				Log.w(LCAT, "Unexpected type not added to picker: " + obj.getClass().getName());
			}
		}
		
		addRows(newrows);
	}
	
	protected void addRows(ArrayList<PickerRowProxy> newRows)
	{
		if (newRows != null && newRows.size() > 0) {
			rows.addAll(newRows);
		}
	}
	
	public void removeRow(PickerRowProxy row) 
	{
		if (rows != null) {
			rows.remove(row);
		}
	}
	
	public PickerRowProxy[] getRows()
	{
		if (rows == null || rows.size() == 0) {
			return null;
		}
		return rows.toArray(new PickerRowProxy[rows.size()]);
	}
	
	public int getRowCount()
	{
		if (rows == null) {
			return 0;
		} else {
			return rows.size();
		}
	}
	
	protected ArrayList<PickerRowProxy> getRowArrayList()
	{
		return rows;
	}

}

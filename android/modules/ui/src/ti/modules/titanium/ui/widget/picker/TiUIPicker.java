/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.picker;

import java.util.ArrayList;

import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.PickerRowProxy;

public abstract class TiUIPicker extends TiUIView 
{
	protected boolean suppressChangeEvent = false;
	protected boolean initialSelectionDone = false;
	protected ArrayList<ArrayList<PickerRowProxy>> columns;

	public TiUIPicker(TiViewProxy proxy) 
	{
		super(proxy);
	}
	
	public abstract void selectRow(int columnIndex, int rowIndex, boolean animated);
	public abstract PickerRowProxy getSelectedRow(int columnIndex);
	protected abstract void refreshNativeView(); 
	public abstract boolean isRedrawRequiredForModelChanges();
	
	public void selectRows(ArrayList<Integer> selectionIndexes)
	{
		if (selectionIndexes == null || selectionIndexes.size() == 0 || columns == null || columns.size() == 0) {
			return;
		}
		for (int colnum = 0; colnum < selectionIndexes.size(); colnum++) {
			if ((colnum + 1) > columns.size()) return;
			int rownum = selectionIndexes.get(colnum).intValue();
			if ((rownum + 1) > columns.get(colnum).size()) continue;
			selectRow(colnum, rownum, false);
		}
	}
	
	public void addColumn(ArrayList<PickerRowProxy> column, boolean refreshView)
	{
		if (columns == null) {
			columns = new ArrayList<ArrayList<PickerRowProxy>>();
		}
		columns.add(column);
		if (refreshView) {
			// Caller responsible for making sure this occurs on ui thread.
			refreshNativeView();
		}
	}
	
	public void addColumns(ArrayList<ArrayList<PickerRowProxy>> newColumns)
	{
		if (newColumns == null){
			return;
		}
		
		if (columns == null) {
			columns = new ArrayList<ArrayList<PickerRowProxy>>();
		}
		
		for (ArrayList<PickerRowProxy> column : newColumns) {
			addColumn(column, false);
		}
		
		// Caller responsible for making sure this occurs on ui thread.
		refreshNativeView();
	}
	
	public void replaceColumns(ArrayList<ArrayList<PickerRowProxy>> newColumns)
	{
		columns = null;
		addColumns(newColumns);
	}
	
	public void addColumn(ArrayList<PickerRowProxy> column)
	{
		addColumn(column, true);
	}
	
	protected int getColumnCount()
	{
		return (columns == null) ? 0 : columns.size();
	}

	@Override
	public void release()
	{
		super.release();
		if (columns != null) {
			columns.clear();
			columns = null;
		}
	}

}

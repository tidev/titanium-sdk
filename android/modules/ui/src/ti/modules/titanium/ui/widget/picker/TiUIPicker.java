/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.picker;

import java.util.ArrayList;

import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.PickerProxy;

public abstract class TiUIPicker extends TiUIView 
{
	protected boolean suppressChangeEvent = false;
	public boolean batchModelChange = false; // Set by proxy to indicate that several model changes are occurring and therefore view can wait to refresh

	public TiUIPicker(TiViewProxy proxy) 
	{
		super(proxy);
	}

	public abstract void selectRow(int columnIndex, int rowIndex, boolean animated);
	public abstract int getSelectedRowIndex(int columnIndex);
	protected abstract void refreshNativeView();

	// When the whole set of columns has been changed out.
	public void onModelReplaced()
	{
		if (!batchModelChange){
			refreshNativeView();
		}
	}

	// When a column has been added.
	public void onColumnAdded(int columnIndex) {}
	// When a column has been removed.
	public void onColumnRemoved(int oldColumnIndex) {}	
	// When a row has been added to / removed from a column
	public void onColumnModelChanged(int columnIndex) {}
	// When a row value has been changed.
	public void onRowChanged(int columnIndex, int rowIndex) {}

	protected PickerProxy getPickerProxy()
	{
		return (PickerProxy)proxy;
	}

	public void selectRows(ArrayList<Integer> selectionIndexes)
	{
		if (selectionIndexes == null || selectionIndexes.size() == 0) {
			return;
		}
		for (int colnum = 0; colnum < selectionIndexes.size(); colnum++) {
			int rownum = selectionIndexes.get(colnum).intValue();
			selectRow(colnum, rownum, false);
		}
	}
}

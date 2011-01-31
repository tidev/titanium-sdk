/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.picker;

import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutArrangement;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;

public class TiUISpinner extends TiUIPicker
{
	private static final String LCAT = "TiUISpinner";
	public TiUISpinner(TiViewProxy proxy)
	{
		super(proxy);
	}
	public TiUISpinner(TiViewProxy proxy, Activity activity)
	{
		this(proxy);
		TiCompositeLayout layout = new TiCompositeLayout(activity, LayoutArrangement.HORIZONTAL);
		layout.setDisableHorizontalWrap(true);
		setNativeView(layout);
	}

	@Override
	protected void refreshNativeView()
	{
		if (children == null || children.size() == 0) {
			return;
		}
		for (TiUIView child : children) {
			refreshColumn((TiUISpinnerColumn)child);
		}
	}
	
	private void refreshColumn(int columnIndex)
	{
		if (columnIndex < 0 || children == null || children.size() == 0 || columnIndex > (children.size() + 1)) {
			return;
		}
		refreshColumn((TiUISpinnerColumn)children.get(columnIndex));
	}
	private void refreshColumn(TiUISpinnerColumn column)
	{
		if (column == null) {
			return;
		}
		column.refreshNativeView();
	}

	@Override
	public int getSelectedRowIndex(int columnIndex)
	{
		if (columnIndex < 0 || children == null || children.size() == 0 || columnIndex >= children.size()) {
			Log.w(LCAT, "Ignoring effort to get selected row index for out-of-bounds columnIndex " + columnIndex);
			return -1;
		}
		TiUIView child = children.get(columnIndex);
		if (child instanceof TiUISpinnerColumn) {
			return ((TiUISpinnerColumn)child).getSelectedRowIndex();
		} else {
			Log.w(LCAT, "Could not locate column " + columnIndex + ".  Ignoring effort to get selected row index in that column.");
			return -1;
		}
	}
	@Override
	public void selectRow(int columnIndex, int rowIndex, boolean animated)
	{
		if (children == null || columnIndex >= children.size()) {
			Log.w(LCAT, "Column " + columnIndex + " does not exist.  Ignoring effort to select a row in that column.");
			return;
		}
		TiUIView child = children.get(columnIndex);
		if (child instanceof TiUISpinnerColumn) {
			((TiUISpinnerColumn)child).selectRow(rowIndex);
		} else {
			Log.w(LCAT, "Could not locate column " + columnIndex + ".  Ignoring effort to select a row in that column.");
		}
	}

	@Override
	public void onColumnModelChanged(int columnIndex)
	{
		refreshColumn(columnIndex);
	}
	@Override
	public void onRowChanged(int columnIndex, int rowIndex)
	{
		refreshColumn(columnIndex);
	}
}

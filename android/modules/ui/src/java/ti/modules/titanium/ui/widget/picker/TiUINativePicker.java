/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.picker;

import java.util.ArrayList;
import java.util.Arrays;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.PickerColumnProxy;
import ti.modules.titanium.ui.PickerProxy;
import android.app.Activity;
import android.view.View;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemSelectedListener;
import android.widget.ArrayAdapter;
import android.widget.Spinner;

public class TiUINativePicker extends TiUIPicker 
		implements OnItemSelectedListener
{
	private static final String TAG = "TiUINativePicker";
	private boolean firstSelectedFired = false;
	
	public TiUINativePicker(TiViewProxy proxy) 
	{
		super(proxy);
	}
	public TiUINativePicker(final TiViewProxy proxy, Activity activity)
	{
		this(proxy);
		Spinner spinner = new Spinner(activity)
		{
			@Override
			protected void onLayout(boolean changed, int left, int top, int right, int bottom)
			{
				super.onLayout(changed, left, top, right, bottom);
				TiUIHelper.firePostLayoutEvent(proxy);
			}
		};
		setNativeView(spinner);
		refreshNativeView();
		preselectRows();
		spinner.setOnItemSelectedListener(this);
	}
	
	private void preselectRows()
	{
		ArrayList<Integer> preselectedRows = getPickerProxy().getPreselectedRows();
		if (preselectedRows == null || preselectedRows.size() == 0) {
			return;
		}
		Spinner spinner = (Spinner)nativeView;
		if (spinner == null)return;
		try {
			spinner.setOnItemSelectedListener(null);
			for (int i = 0; i < preselectedRows.size(); i++) {
				Integer rowIndex = preselectedRows.get(i);
				if (rowIndex == 0 || rowIndex.intValue() < 0) {
					continue;
				}
				selectRow(i, rowIndex, false);
			}
		} finally {
			spinner.setOnItemSelectedListener(this);
			firstSelectedFired = true;
		}
	}

	@Override
	public void selectRow(int columnIndex, int rowIndex, boolean animated)
	{
		// At the moment we only support one column.
		if (columnIndex != 0) {
			Log.w(TAG, "Only one column is supported. Ignoring request to set selected row of column " + columnIndex);
			return;
		}
		Spinner view = (Spinner)nativeView;
		int rowCount = view.getAdapter().getCount();
		if (rowIndex < 0 || rowIndex >= rowCount) {
			Log.w(TAG, "Ignoring request to select out-of-bounds row index " + rowIndex);
			return;
		}
		view.setSelection(rowIndex, animated);
	}

	@Override
	public int getSelectedRowIndex(int columnIndex)
	{
		if (columnIndex != 0) {
			Log.w(TAG, "Ignoring request to get selected row from out-of-bounds columnIndex " + columnIndex);
			return -1;
		}
		return ((Spinner)getNativeView()).getSelectedItemPosition();
	}

	@Override
	protected void refreshNativeView() 
	{
		// Don't allow change events here
		suppressChangeEvent = true;
		Spinner spinner = (Spinner)nativeView;
		if (spinner == null) {
			return;
		}
		try {
			spinner.setOnItemSelectedListener(null);
			int rememberSelectedRow = getSelectedRowIndex(0);
			spinner.setAdapter(new ArrayAdapter<String>(spinner.getContext(), android.R.layout.simple_spinner_item, new ArrayList<String>()));
			// Just one column - the first column - for now.  
			// Maybe someday we'll support multiple columns.
			PickerColumnProxy column = getPickerProxy().getFirstColumn(false);
			if (column == null) {
				return;
			}
			TiViewProxy[] rowArray = column.getChildren();
			if (rowArray == null || rowArray.length == 0) {
				return;
			}
			ArrayList<TiViewProxy> rows = new ArrayList<TiViewProxy>(Arrays.asList(rowArray));
			// At the moment we're using the simple spinner layouts provided
			// in android because we're only supporting a piece of text, which
			// is fetched via PickerRowProxy.toString().  If we allow 
			// anything beyond a string, we'll have to implement our own
			// layouts (maybe our own Adapter too.)
			ArrayAdapter<TiViewProxy> adapter = new ArrayAdapter<TiViewProxy>(
					spinner.getContext(), 
					android.R.layout.simple_spinner_item, 
					rows);
			adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
			spinner.setAdapter(adapter);
			if (rememberSelectedRow >= 0) {
				selectRow(0, rememberSelectedRow, false);
			}
			
		} catch(Throwable t) {
			Log.e(TAG, "Unable to refresh native spinner control: " + t.getMessage(), t);
		} finally {
			suppressChangeEvent = false;
			spinner.setOnItemSelectedListener(this);
		}
	}
	

	@Override
	public void onItemSelected(AdapterView<?> parent, View view, int position,
			long itemId)
	{
		if (!firstSelectedFired) {
			// swallow the first selected event that gets fired after the adapter gets set, so as to avoid
			// firing our change event in that case.
			firstSelectedFired = true;
			return;
		}
		fireSelectionChange(0, position);
	}

	@Override
	public void onNothingSelected(AdapterView<?> arg0)
	{
	}
	public void add(TiUIView child)
	{
		// Don't do anything.  We don't add/remove views to the native picker (the Android "Spinner").
	}
	@Override
	public void remove(TiUIView child)
	{
		// Don't do anything.  We don't add/remove views to the native picker (the Android "Spinner").
	}
	@Override
	public void onColumnAdded(int columnIndex)
	{
		if (!batchModelChange) {
			refreshNativeView();
		}
	}
	@Override
	public void onColumnRemoved(int oldColumnIndex)
	{
		if (!batchModelChange) {
			refreshNativeView();
		}
	}
	@Override
	public void onColumnModelChanged(int columnIndex)
	{
		if (!batchModelChange) {
			refreshNativeView();
		}
	}
	@Override
	public void onRowChanged(int columnIndex, int rowIndex)
	{
		if (!batchModelChange) {
			refreshNativeView();
		}
	}
	protected void fireSelectionChange(int columnIndex, int rowIndex)
	{
		((PickerProxy)proxy).fireSelectionChange(columnIndex, rowIndex);
	}
}

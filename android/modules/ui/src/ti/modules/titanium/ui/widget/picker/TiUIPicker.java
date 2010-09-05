/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.picker;

import java.util.ArrayList;

import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.PickerRowProxy;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Spinner;
import android.widget.AdapterView.OnItemSelectedListener;

public class TiUIPicker extends TiUIView 
		implements OnItemSelectedListener
{
	private static final String LCAT = "TiUIPicker";
	private boolean suppressChangeEvent = false;
	private boolean initialSelectionDone = false;
	
	// With this data structure we're prepared
	// to handle multiple columns, though we
	// don't support it yet (and may never with this native Android widget).
	private ArrayList<ArrayList<PickerRowProxy>> columns;

	public TiUIPicker(TiViewProxy proxy) 
	{
		super(proxy);
		Spinner spinner = new Spinner(proxy.getContext());
		setNativeView(spinner);
		refreshNativeView();
		spinner.setOnItemSelectedListener(this);
	}
	
	public void selectRow(int columnIndex, int rowIndex, boolean animated)
	{
		// At the moment we only support one column.
		if (columnIndex != 0) {
			Log.w(LCAT, "Only one column is supported. Ignoring request to set selected row of column " + columnIndex);
		}
		
		((Spinner)getNativeView()).setSelection(rowIndex, animated);
	}
	
	public void selectRows(ArrayList<Integer> selectionIndexes)
	{
		// Only support one column for now, so only pay attention to first element.
		if (selectionIndexes == null || selectionIndexes.size() == 0) {
			return;
		}
		Integer row = selectionIndexes.get(0);
		if (row == null) {
			return;
		}
		if (columns == null || columns.size() == 0 || columns.get(0).size() < (row.intValue() + 1)) {
			return;
		}
		selectRow(0, row.intValue(), true);
	}
	
	public PickerRowProxy getSelectedRow(int columnIndex)
	{
		// we only support one column, so ignore anything over 0.
		if (columnIndex > 0) {
			Log.w(LCAT, "Picker supports only one column.  Ignoring request for column " + columnIndex);
			return null;
		}
		
		int index = ((Spinner)getNativeView()).getSelectedItemPosition();
		return columns.get(0).get(index);
			
	}
	
	public void addColumn(ArrayList<PickerRowProxy> column)
	{
		addColumn(column, true);
	}
	
	public void addColumn(ArrayList<PickerRowProxy> column, boolean refreshView)
	{
		if (columns == null) {
			columns = new ArrayList<ArrayList<PickerRowProxy>>();
		}
		if (columns.size() > 0) {
			Log.w(LCAT, "Titanium Android picker currently supports only one column.  Added column will be ignored.");
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
	
	private void refreshNativeView() 
	{
		// Don't allow change events here
		suppressChangeEvent = true;
		try {
			Spinner spinner = (Spinner) getNativeView();
			spinner.setAdapter(null);
			if (columns == null || columns.size() == 0) {
				return;
			}
			// Just one column - the first column - for now.  
			// Maybe someday we'll support multiple columns.
			ArrayList<PickerRowProxy> rows = columns.get(0);
			// At the moment we're using the simple spinner layouts provided
			// in android because we're only supporting a piece of text, which
			// is fetched via PickerRowProxy.toString().  If we allow 
			// anything beyond a string, we'll have to implement our own
			// layouts (maybe our own Adapter too.)
			ArrayAdapter<PickerRowProxy> adapter = new ArrayAdapter<PickerRowProxy>(
					spinner.getContext(), 
					android.R.layout.simple_spinner_item, 
					rows);
			adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
			spinner.setAdapter(adapter);
		} catch(Throwable t) {
			Log.e(LCAT, "Unable to refresh native spinner control: " + t.getMessage(), t);
		} finally {
			suppressChangeEvent = false;
		}
	}
	
	@Override
	public void onItemSelected(AdapterView<?> parent, View view, int position,
			long itemId)
	{
		if (!initialSelectionDone) {
			initialSelectionDone = true;
			return;
		}
		if (suppressChangeEvent) {
			return;
		}
		TiDict d = new TiDict();
		d.put("rowIndex", position);
		d.put("columnIndex", 0);
		d.put("row", columns.get(0).get(position));
		d.put("column", columns.get(0));
		d.put("selectedValue", new Object[]{columns.get(0).get(position).toString()});
		proxy.fireEvent("change", d);
	}

	@Override
	public void onNothingSelected(AdapterView<?> arg0)
	{
		
	}
	
}

/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import java.util.ArrayList;

import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.PickerRowProxy;
import android.app.Activity;
import android.widget.ArrayAdapter;
import android.widget.Spinner;

public class TiUIPicker extends TiUIView 
{
	private static final String LCAT = "TiUIPicker";
	
	// With this data structure we're prepared
	// to handle multiple columns, though we
	// don't support it yet (and may never).
	private ArrayList<ArrayList<PickerRowProxy>> columns;

	public TiUIPicker(TiViewProxy proxy, Activity activity) 
	{
		super(proxy);
		setNativeView(new Spinner(proxy.getContext()));
		refreshNativeView();
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
		
		refreshNativeView();
	}
	
	private void refreshNativeView() 
	{
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
	}

}

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

import ti.modules.titanium.ui.widget.TiUIPicker;
import android.app.Activity;
import android.util.Log;

public class PickerProxy extends TiViewProxy 
		implements PickerColumnProxy.PickerColumnChangeListener
{
	private ArrayList<PickerColumnProxy>columns = new ArrayList<PickerColumnProxy>();
	private static final String LCAT = "PickerProxy";
	
	public PickerProxy(TiContext tiContext, Object[] args)
	{
		super(tiContext, args);
	}
	
	@Override
	public TiUIView createView(Activity activity) 
	{
		TiUIPicker picker = new TiUIPicker(this, activity);
		if (columns != null && columns.size() > 0) {
			picker.addColumns( getColumnsAsListOfLists() );
		}
		
		return picker;
	}
	
	private ArrayList<ArrayList<PickerRowProxy>> getColumnsAsListOfLists()
	{
		ArrayList<ArrayList<PickerRowProxy>> rowLists = new ArrayList<ArrayList<PickerRowProxy>>();
		if (columns != null && columns.size() > 0) {
			for (PickerColumnProxy column : columns) {
				rowLists.add(column.getRows());
			}
		}
		return rowLists;
	}

	// We need special handling because can also accept array
	@Override
	public void add(TiViewProxy child)
	{
		add((Object)child);
	}
	
	public void add(Object child) 
	{ 
		if (child instanceof PickerRowProxy) {
			getFirstColumn(true).addRow((PickerRowProxy)child);
		} else if (child.getClass().isArray()) {
			getFirstColumn(true).addRows((Object[]) child);
		} else if (child instanceof PickerColumnProxy) {
			addColumn((PickerColumnProxy)child);
		} else {
			Log.w(LCAT, "Unexpected type not added to picker: " + child.getClass().getName());
		}
	}

	@Override
	public void rowAdded(PickerColumnProxy column, PickerRowProxy row)
	{
		// TODO Auto-generated method stub
		
	}

	@Override
	public void rowsAdded(PickerColumnProxy column,
			ArrayList<PickerRowProxy> rows)
	{
		// TODO Auto-generated method stub
		
	}
	
	private PickerColumnProxy getFirstColumn(boolean createIfMissing) 
	{
		PickerColumnProxy column = null;
		if (columns == null) {
			columns = new ArrayList<PickerColumnProxy>();
		}
		
		if (columns.size() == 0 && createIfMissing) {
			column = new PickerColumnProxy(getTiContext());
			column.setPickerColumnChangeListener(this);
			columns.add(column);
		} else {
			column = columns.get(0);
		}
		return column;
	}
	
	private void addColumn(PickerColumnProxy column)
	{
		TiUIView view = peekView();
		column.setPickerColumnChangeListener(this);
		columns.add(column);
		if (peekView() != null) {
			((TiUIPicker)view).addColumn(column.getRows());
		}
	}

}

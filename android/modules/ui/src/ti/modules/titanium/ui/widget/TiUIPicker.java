/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget;

import java.util.ArrayList;

import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.view.TiUIView;

import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Spinner;
import android.widget.AdapterView.OnItemSelectedListener;

import ti.modules.titanium.ui.PickerColumnProxy;
import ti.modules.titanium.ui.PickerProxy;
import ti.modules.titanium.ui.PickerRowProxy;
import ti.modules.titanium.ui.widget.tableview.TiTableView.OnItemClickedListener;

public class TiUIPicker extends TiUIView implements OnItemSelectedListener {

	private static final String LCAT = "TiUIPicker";
	private static final boolean DBG = TiConfig.LOGD;
	
	public TiUIPicker(TiViewProxy proxy){
		super(proxy);
		if (DBG) {
			Log.d(LCAT, "Creating a picker");
		}		
		Spinner spinner = new Spinner(proxy.getContext());
		
		PickerProxy pproxy = (PickerProxy) proxy;
		
		// TODO support multiple columns
		PickerColumnProxy col = pproxy.getColumns().get(0);
		final ArrayList<PickerRowProxy> rows = col.getRows();
		final ArrayList<String> titles = getRowTitles(rows);
		final ArrayAdapter<String> adapter = 
			new ArrayAdapter<String>(proxy.getContext(),
					android.R.layout.simple_spinner_item,
					titles);
		spinner.setAdapter(adapter);
		
		setNativeView(spinner);		
	}
	

	
	private ArrayList<String> getRowTitles(ArrayList<PickerRowProxy> rows){
		ArrayList<String> result = new ArrayList<String>();
		
		for (PickerRowProxy row : rows){
			String title = "[row]";
			Object titleTest = row.getDynamicValue("title");
			if (titleTest != null) {
				title = titleTest.toString();
			}
			result.add(title);
		}
		return result;			
	}


	@Override
	public void onItemSelected(AdapterView<?> arg0, View arg1, int arg2,
			long arg3) {
		// TODO Auto-generated method stub
		
	}


	@Override
	public void onNothingSelected(AdapterView<?> arg0) {
		// TODO Auto-generated method stub
		
	}

}

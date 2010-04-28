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
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUIPicker;
import android.app.Activity;
import android.util.Log;

public class PickerProxy extends TiViewProxy
{
	private static final ArrayList<PickerColumnProxy> columns = 
		new ArrayList<PickerColumnProxy>();
	
	 
	private static final String LCAT = "PickerProxy";
	private static final boolean DBG = TiConfig.LOGD;
	public PickerProxy(TiContext tiContext, Object[] args)
	{
		super(tiContext, args);
		// give me one column for starters column
		columns.add(new PickerColumnProxy(this.getTiContext()));
	}
	
	public ArrayList<PickerColumnProxy> getColumns() {
		return columns;
	}
	
	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUIPicker(this);
	}
	
	
	
	public void add(TiViewProxy control) {
		if (DBG) {
			Log.d(LCAT, "adding a TiViewProxy to picker");
		}
		if (control instanceof PickerRowProxy) {
			columns.get(0).addRow((PickerRowProxy) control);
		}
	}
	
	
}

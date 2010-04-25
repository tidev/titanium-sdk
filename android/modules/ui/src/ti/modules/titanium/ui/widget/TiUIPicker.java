/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget;

import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.view.TiUIView;

import android.widget.Spinner;

import ti.modules.titanium.ui.widget.tableview.TiTableView.OnItemClickedListener;

public class TiUIPicker extends TiUIView implements OnItemClickedListener {

	private static final String LCAT = "TiUIPicker";
	private static final boolean DBG = TiConfig.LOGD;
	
	public TiUIPicker(TiViewProxy proxy){
		super(proxy);
		if (DBG) {
			Log.d(LCAT, "Creating a picker");
		}		
		setNativeView(new Spinner(proxy.getContext()));		
	}
	
	
	@Override
	public void onClick(TiDict item) {
		// TODO Auto-generated method stub

	}

}

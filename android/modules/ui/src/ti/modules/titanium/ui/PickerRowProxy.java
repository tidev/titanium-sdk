/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;

public class PickerRowProxy extends TiViewProxy {
	
	private static final String LCAT = "PickerRowProxy";
	private static final boolean DBG = TiConfig.LOGD;

	public PickerRowProxy(TiContext tiContext, Object[] args) {
		super(tiContext, args);
		if (DBG) {
			Log.d(LCAT, "Creating a pickerrowproxy with args length " + args.length);
		}	
		
		
	}

	@Override
	public TiUIView createView(Activity activity) {
		// TODO Auto-generated method stub
		return null;
	}

}

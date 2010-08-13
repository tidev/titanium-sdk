/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.android;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;

import android.view.WindowManager;

public class AndroidModule extends TiModule 
{
	
	private static TiDict constants;
	
	public AndroidModule(TiContext tiContext) 
	{
		super(tiContext);
	}

	@Override
	public TiDict getConstants() 
	{
		if (constants == null) {
			constants = new TiDict();
			
			//Desired operating mode for any soft input area. May any combination of:
			//	One of the visibility states SOFT_INPUT_STATE_UNSPECIFIED, SOFT_INPUT_STATE_UNCHANGED, 
			//      SOFT_INPUT_STATE_HIDDEN, SOFT_INPUT_STATE_ALWAYS_VISIBLE, or SOFT_INPUT_STATE_VISIBLE.
			//	One of the adjustment options SOFT_INPUT_ADJUST_UNSPECIFIED, SOFT_INPUT_ADJUST_RESIZE, or SOFT_INPUT_ADJUST_PAN.

			constants.put("SOFT_INPUT_ADJUST_PAN", WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN);
			constants.put("SOFT_INPUT_ADJUST_RESIZE", WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
			constants.put("SOFT_INPUT_ADJUST_UNSPECIFIED", WindowManager.LayoutParams.SOFT_INPUT_ADJUST_UNSPECIFIED);
			
			constants.put("SOFT_INPUT_STATE_ALWAYS_HIDDEN", WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_HIDDEN);
			constants.put("SOFT_INPUT_STATE_ALWAYS_VISIBLE", WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_VISIBLE);
			constants.put("SOFT_INPUT_STATE_HIDDEN", WindowManager.LayoutParams.SOFT_INPUT_STATE_HIDDEN);
			constants.put("SOFT_INPUT_STATE_UNSPECIFIED", WindowManager.LayoutParams.SOFT_INPUT_STATE_UNSPECIFIED);
			constants.put("SOFT_INPUT_STATE_VISIBLE", WindowManager.LayoutParams.SOFT_INPUT_STATE_VISIBLE);
		}
		
		return constants;
	}	
}

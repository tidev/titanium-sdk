/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.android;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;

import android.content.Intent;

public class AndroidModule extends TiModule
{
	private static final String LCAT = "TiAndroid";

	private static TiDict constants;


	public AndroidModule(TiContext tiContext) {
		super(tiContext);
	}


	@Override
	public TiDict getConstants()
	{
		if (constants == null) {
			constants = new TiDict();

			constants.put("ACTION_DIAL", Intent.ACTION_DIAL);
		}

		return constants;
	}

}

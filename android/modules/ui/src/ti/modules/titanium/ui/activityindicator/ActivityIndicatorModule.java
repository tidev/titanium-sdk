/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.activityindicator;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiContext;

import ti.modules.titanium.ui.widget.TiUIActivityIndicator;

public class ActivityIndicatorModule extends TiModule
{
	private static KrollDict constants;

	public ActivityIndicatorModule(TiContext tiContext) {
		super(tiContext);
	}

	@Override
	public KrollDict getConstants()
	{
		if (constants == null) {
			constants = new KrollDict();

			constants.put("STATUS_BAR", TiUIActivityIndicator.STATUS_BAR);
			constants.put("DIALOG", TiUIActivityIndicator.DIALOG);

			constants.put("INDETERMINANT", TiUIActivityIndicator.INDETERMINANT);
			constants.put("DETERMINANT", TiUIActivityIndicator.DETERMINANT);
		}

		return constants;
	}
}

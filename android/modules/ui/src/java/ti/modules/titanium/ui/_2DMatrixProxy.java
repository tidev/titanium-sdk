/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.view.Ti2DMatrix;

@Kroll.proxy(creatableInModule = UIModule.class, name = "2DMatrix")
public class _2DMatrixProxy extends Ti2DMatrix
{
	private static final String TAG = "2DMatrix";

	public _2DMatrixProxy()
	{
		super();

		Log.w(TAG, "Ti.UI.2DMatrix DEPRECATED in 8.0.0, in favor of Ti.UI.Matrix2D");
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.2DMatrix";
	}
}

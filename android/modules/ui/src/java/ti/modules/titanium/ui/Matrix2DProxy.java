/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018-present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.view.Ti2DMatrix;

@Kroll.proxy(creatableInModule = UIModule.class, name = "Matrix2D")
public class Matrix2DProxy extends Ti2DMatrix
{
	@Override
	public String getApiName()
	{
		return "Ti.UI.Matrix2D";
	}
}

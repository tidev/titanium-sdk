/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.view.Ti2DMatrix;

@Kroll.proxy(creatableInModule=UIModule.class, name="2DMatrix")
public class _2DMatrixProxy extends Ti2DMatrix
{
	public _2DMatrixProxy(TiContext tiContext)
	{
		super(tiContext);
	}
}

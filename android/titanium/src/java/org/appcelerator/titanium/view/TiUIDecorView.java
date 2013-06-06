/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.view;

import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.DecorViewProxy;

import android.os.Build;


public class TiUIDecorView extends TiUIView
{
	public TiUIDecorView(DecorViewProxy decorViewProxy)
	{
		super(decorViewProxy);

		setNativeView(decorViewProxy.getLayout());
	}

	@Override
	public void add(TiUIView child)
	{
		super.add(child);

		// Honeycomb has issues to redraw the decor view after adding a child. (TIMOB-10126)
		// So we force it to invalidate the decor view here.
		if (Build.VERSION.SDK_INT >= TiC.API_LEVEL_HONEYCOMB && Build.VERSION.SDK_INT < TiC.API_LEVEL_ICE_CREAM_SANDWICH) {
			getNativeView().postInvalidate();
		}
	}
}
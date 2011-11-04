/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIDecorView;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;


@Kroll.proxy
public class DecorViewProxy extends TiViewProxy
{
	protected TiCompositeLayout layout;


	public DecorViewProxy(TiCompositeLayout layout)
	{
		super();
		this.layout = layout;
	}


	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUIDecorView(this);
	}


	public TiCompositeLayout getLayout()
	{
		return layout;
	}
}

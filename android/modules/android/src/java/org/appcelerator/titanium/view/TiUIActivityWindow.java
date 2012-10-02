/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.view;

import org.appcelerator.titanium.proxy.TiActivityWindowProxy;

import ti.modules.titanium.android.TiJSActivity;
import android.view.View;

public class TiUIActivityWindow extends TiUIView 
{
	protected TiJSActivity activity;

	public TiUIActivityWindow(TiActivityWindowProxy proxy, TiJSActivity activity, View layout) 
	{
		super(proxy);
		this.activity = activity;

		proxy.setView(this);

		setNativeView(layout);
		proxy.setModelListener(this);

		layout.setClickable(true);
		registerForTouch(layout);
	}

	public void open()
	{
		getProxy().realizeViews(this);
	}

	public void close()
	{
		activity.finish();
	}

	public TiJSActivity getActivity()
	{
		return activity;
	}
}

/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiView;
import android.app.Activity;

@Kroll.proxy(creatableInModule=UIModule.class)
public class ViewProxy extends TiViewProxy
{
	public ViewProxy()
	{
		super();
	}

	public ViewProxy(TiContext tiContext)
	{
		this();
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		TiUIView view = new TiView(this);
		view.getLayoutParams().autoFillsHeight = true;
		view.getLayoutParams().autoFillsWidth = true;
		return view;
	}
}

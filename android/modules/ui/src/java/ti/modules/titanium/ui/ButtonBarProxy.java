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

import ti.modules.titanium.ui.widget.TiUIButton;

import android.app.Activity;

/**
 * This class is @deprecated. Any usage will crash application.
 */
@Deprecated
@Kroll.proxy(creatableInModule=UIModule.class)
  public class ButtonBarProxy extends TiViewProxy
{
	public ButtonBarProxy()
	{
		super();
	}

	public ButtonBarProxy(TiContext tiContext)
	{
		this();
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return null;
	}

}

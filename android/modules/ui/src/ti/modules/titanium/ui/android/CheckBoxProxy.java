/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.android;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.android.widget.TiUICheckBox;
import android.app.Activity;

@Kroll.proxy(creatableInModule=AndroidModule.class)
public class CheckBoxProxy extends TiViewProxy
{
	public CheckBoxProxy(TiContext tiContext)
	{
		super(tiContext);
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUICheckBox(this);
	}

	@Kroll.method
	public void toggle()
	{
		setProperty("value", !TiConvert.toBoolean(getProperty("value")), true);
	}
}

/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUIProgressBar;
import android.app.Activity;

@Kroll.proxy(creatableInModule = UIModule.class,
	propertyAccessors = {
		TiC.PROPERTY_MIN,
		TiC.PROPERTY_MAX,
		TiC.PROPERTY_VALUE,
		TiC.PROPERTY_MESSAGE,
		TiC.PROPERTY_COLOR,
		TiC.PROPERTY_TINT_COLOR,
		TiC.PROPERTY_TRACK_TINT_COLOR,
})
public class ProgressBarProxy extends TiViewProxy
{
	public ProgressBarProxy()
	{
		super();
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUIProgressBar(this);
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.ProgressBar";
	}
}

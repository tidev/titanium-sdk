/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;

import ti.modules.titanium.ui.android.AndroidModule;
import ti.modules.titanium.ui.widget.TiUITabbedBar;

// clang-format off
@Kroll.proxy(creatableInModule = UIModule.class, propertyAccessors = {
	TiC.PROPERTY_INDEX,
	TiC.PROPERTY_LABELS,
	TiC.PROPERTY_STYLE,
})
// clang-format on
public class TabbedBarProxy extends TiViewProxy
{
	private static final String TAG = "TabbedBarProxy";

	public TabbedBarProxy()
	{
		defaultValues.put(TiC.PROPERTY_STYLE, AndroidModule.TABS_STYLE_DEFAULT);
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUITabbedBar(this);
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.TabbedBar";
	}
}

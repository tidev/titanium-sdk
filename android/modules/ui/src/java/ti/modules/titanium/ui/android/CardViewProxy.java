/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.android;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUICardView;
import android.app.Activity;

@Kroll.proxy(creatableInModule = AndroidModule.class,
	propertyAccessors = {
		TiC.PROPERTY_BORDER_RADIUS,
		TiC.PROPERTY_ELEVATION,
		TiC.PROPERTY_MAX_ELEVATION,
		TiC.PROPERTY_PREVENT_CORNER_OVERLAP,
		TiC.PROPERTY_USE_COMPAT_PADDING,
		TiC.PROPERTY_PADDING,
		TiC.PROPERTY_PADDING_BOTTOM,
		TiC.PROPERTY_PADDING_LEFT,
		TiC.PROPERTY_PADDING_RIGHT,
		TiC.PROPERTY_PADDING_TOP
})
public class CardViewProxy extends TiViewProxy
{
	private static final int MSG_FIRST_ID = TiViewProxy.MSG_LAST_ID + 1;
	protected static final int MSG_LAST_ID = MSG_FIRST_ID + 999;

	public CardViewProxy()
	{
		super();
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUICardView(this);
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.Android.CardView";
	}
}

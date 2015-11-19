/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.android;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUICardView;
import android.app.Activity;

@Kroll.proxy(creatableInModule = AndroidModule.class, propertyAccessors = {
	TiC.PROPERTY_CARD_BACKGROUND_COLOR,
	TiC.PROPERTY_CARD_CORNER_RADIUS,
	TiC.PROPERTY_CARD_ELEVATION,
	TiC.PROPERTY_CARD_MAX_ELEVATION,
	TiC.PROPERTY_CARD_PREVENT_CORNER_OVERLAP,
	TiC.PROPERTY_CARD_USE_COMPAT_PADDING,
	TiC.PROPERTY_PREVENT_CORNER_OVERLAP,
	TiC.PROPERTY_USE_COMPAT_PADDING,
	TiC.PROPERTY_CONTENT_PADDING,
	TiC.PROPERTY_CONTENT_PADDING_BOTTOM,
	TiC.PROPERTY_CONTENT_PADDING_LEFT,
	TiC.PROPERTY_CONTENT_PADDING_RIGHT,
	TiC.PROPERTY_CONTENT_PADDING_TOP
})
public class CardViewProxy extends TiViewProxy
{
	private static final int MSG_FIRST_ID = KrollProxy.MSG_LAST_ID + 1;
	protected static final int MSG_LAST_ID = MSG_FIRST_ID + 999;
		
	public CardViewProxy()
	{
		super();
	}

	public CardViewProxy(TiContext tiContext)
	{
		this();
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

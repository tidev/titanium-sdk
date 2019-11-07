/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;

import ti.modules.titanium.ui.widget.TiUIScrollView;
// clang-format off
@Kroll.proxy(creatableInModule = UIModule.class,
	propertyAccessors = {
		TiC.PROPERTY_CONTENT_HEIGHT,
		TiC.PROPERTY_CONTENT_WIDTH,
		TiC.PROPERTY_SHOW_HORIZONTAL_SCROLL_INDICATOR,
		TiC.PROPERTY_SHOW_VERTICAL_SCROLL_INDICATOR,
		TiC.PROPERTY_SCROLL_TYPE,
		TiC.PROPERTY_CONTENT_OFFSET,
		TiC.PROPERTY_CAN_CANCEL_EVENTS,
		TiC.PROPERTY_OVER_SCROLL_MODE,
		TiC.PROPERTY_REFRESH_CONTROL
})
// clang-format on
public class ScrollViewProxy extends TiViewProxy
{
	private static final int MSG_FIRST_ID = TiViewProxy.MSG_LAST_ID + 1;
	protected static final int MSG_LAST_ID = MSG_FIRST_ID + 999;

	public ScrollViewProxy()
	{
		super();
		defaultValues.put(TiC.PROPERTY_OVER_SCROLL_MODE, 0);
		KrollDict offset = new KrollDict();
		offset.put(TiC.EVENT_PROPERTY_X, 0);
		offset.put(TiC.EVENT_PROPERTY_Y, 0);
		defaultValues.put(TiC.PROPERTY_CONTENT_OFFSET, offset);
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUIScrollView(this);
	}

	public TiUIScrollView getScrollView()
	{
		return (TiUIScrollView) getOrCreateView();
	}

	@Kroll.method
	public void scrollTo(int x, int y, @Kroll.argument(optional = true) HashMap args)
	{
		boolean animated = false;
		if (args != null) {
			animated = TiConvert.toBoolean(args.get("animated"), false);
		}
		handleScrollTo(x, y, animated);
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setScrollingEnabled(Object enabled)
	// clang-format on
	{
		getScrollView().setScrollingEnabled(enabled);
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public boolean getScrollingEnabled()
	// clang-format on
	{
		return getScrollView().getScrollingEnabled();
	}

	@Kroll.method
	public void scrollToBottom()
	{
		handleScrollToBottom();
	}

	@Kroll.method
	public void scrollToTop()
	{
		handleScrollToTop();
	}

	public void handleScrollTo(int x, int y, boolean smoothScroll)
	{
		getScrollView().scrollTo(x, y, smoothScroll);
	}

	public void handleScrollToBottom()
	{
		getScrollView().scrollToBottom();
	}

	public void handleScrollToTop()
	{
		getScrollView().scrollToTop();
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.ScrollView";
	}
}

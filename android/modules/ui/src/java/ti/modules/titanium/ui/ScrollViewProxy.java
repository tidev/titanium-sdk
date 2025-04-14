/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import android.app.Activity;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import java.util.HashMap;

import ti.modules.titanium.ui.widget.TiUIScrollView;

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

	@Kroll.getProperty
	public boolean getScrollingEnabled()
	{
		return getScrollView().getScrollingEnabled();
	}

	@Kroll.setProperty
	public void setScrollingEnabled(Object enabled)
	{
		getScrollView().setScrollingEnabled(enabled);
	}

	@Kroll.method
	public void scrollToBottom(@Kroll.argument(optional = true) HashMap args)
	{
		boolean animated = false;
		if (args != null) {
			animated = TiConvert.toBoolean(args.get("animated"), false);
		}
		handleScrollToBottom(animated);
	}

	@Kroll.method
	public void scrollToTop(@Kroll.argument(optional = true) HashMap args)
	{
		boolean animated = false;
		if (args != null) {
			animated = TiConvert.toBoolean(args.get("animated"), false);
		}
		handleScrollToTop(animated);
	}

	public void handleScrollTo(int x, int y, boolean smoothScroll)
	{
		getScrollView().scrollTo(x, y, smoothScroll);
	}

	public void handleScrollToBottom(boolean animated)
	{
		getScrollView().scrollToBottom(animated);
	}

	public void handleScrollToTop(boolean animated)
	{
		getScrollView().scrollToTop(animated);
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.ScrollView";
	}
}

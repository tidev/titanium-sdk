/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.AsyncResult;
import org.appcelerator.kroll.common.TiMessenger;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;
import org.appcelerator.titanium.util.TiConvert;

import ti.modules.titanium.ui.widget.TiUIScrollView;
import android.app.Activity;
import android.os.Handler;
import android.os.Message;
import java.util.HashMap;
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
public class ScrollViewProxy extends TiViewProxy implements Handler.Callback
{
	private static final int MSG_FIRST_ID = TiViewProxy.MSG_LAST_ID + 1;

	private static final int MSG_SCROLL_TO = MSG_FIRST_ID + 100;
	private static final int MSG_SCROLL_TO_BOTTOM = MSG_FIRST_ID + 101;
	private static final int MSG_SCROLL_TO_TOP = MSG_FIRST_ID + 102;
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

		if (!TiApplication.isUIThread()) {
			HashMap msgArgs = new HashMap();
			msgArgs.put("x", x);
			msgArgs.put("y", y);
			msgArgs.put("animated", animated);
			TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_SCROLL_TO), msgArgs);
		} else {
			handleScrollTo(x, y, animated);
		}
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
		if (!TiApplication.isUIThread()) {
			TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_SCROLL_TO_BOTTOM), getActivity());
		} else {
			handleScrollToBottom();
		}
	}

	@Kroll.method
	public void scrollToTop()
	{
		if (!TiApplication.isUIThread()) {
			TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_SCROLL_TO_TOP), getActivity());
		} else {
			handleScrollToTop();
		}
	}

	@Override
	public boolean handleMessage(Message msg)
	{
		if (msg.what == MSG_SCROLL_TO) {
			AsyncResult result = (AsyncResult) msg.obj;
			HashMap args = (HashMap) result.getArg();
			handleScrollTo(TiConvert.toInt(args.get("x"), 0), TiConvert.toInt(args.get("y"), 0),
						   TiConvert.toBoolean(args.get("animated"), false));
			result.setResult(null); // signal scrolled
			return true;
		} else if (msg.what == MSG_SCROLL_TO_BOTTOM) {
			handleScrollToBottom();
			AsyncResult result = (AsyncResult) msg.obj;
			result.setResult(null); // signal scrolled
			return true;
		} else if (msg.what == MSG_SCROLL_TO_TOP) {
			handleScrollToTop();
			AsyncResult result = (AsyncResult) msg.obj;
			result.setResult(null); // signal scrolled
			return true;
		}
		return super.handleMessage(msg);
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

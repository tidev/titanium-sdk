/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUIScrollView;
import android.app.Activity;
import android.os.Handler;
import android.os.Message;

@Kroll.proxy(creatableInModule="UI")
public class ScrollViewProxy extends TiViewProxy
	implements Handler.Callback
{
	private static final int MSG_FIRST_ID = KrollProxy.MSG_LAST_ID + 1;

	private static final int MSG_SCROLL_TO = MSG_FIRST_ID + 100;
	private static final int MSG_SCROLL_TO_BOTTOM = MSG_FIRST_ID + 101;
	protected static final int MSG_LAST_ID = MSG_FIRST_ID + 999;

	public ScrollViewProxy(TiContext context)
	{
		super(context);
	}

	@Override
	public TiUIView createView(Activity activity) {
		return new TiUIScrollView(this);
	}

	public TiUIScrollView getScrollView(Activity activity) {
		return (TiUIScrollView)getView(activity);
	}

	@Kroll.method
	public void scrollTo(int x, int y) {
		if (!getTiContext().isUIThread()) {
			AsyncResult result = new AsyncResult(getTiContext().getActivity());
			Message msg = getUIHandler().obtainMessage(MSG_SCROLL_TO, result);
			msg.arg1 = x;
			msg.arg2 = y;
			msg.sendToTarget();
			result.getResult(); // wait for scroll
		} else {
			handleScrollTo(x,y);
		}
	}
	
	@Kroll.method
	public void scrollToBottom() {
		if (!getTiContext().isUIThread()) {
			AsyncResult result = new AsyncResult(getTiContext().getActivity());
			Message msg = getUIHandler().obtainMessage(MSG_SCROLL_TO_BOTTOM, result);
			msg.sendToTarget();
			result.getResult(); // wait for scroll
		} else {
			handleScrollToBottom();
		}
	}

	@Override
	public boolean handleMessage(Message msg) {
		if (msg.what == MSG_SCROLL_TO) {
			handleScrollTo(msg.arg1, msg.arg2);
			AsyncResult result = (AsyncResult) msg.obj;
			result.setResult(null); // signal scrolled
			return true;
		} else if (msg.what == MSG_SCROLL_TO_BOTTOM) {
			handleScrollToBottom();
			AsyncResult result = (AsyncResult) msg.obj;
			result.setResult(null); // signal scrolled
			return true;
		}
		return super.handleMessage(msg);
	}

	public void handleScrollTo(int x, int y) {
		getScrollView(getTiContext().getActivity()).scrollTo(x, y);
	}
	
	public void handleScrollToBottom() {
		getScrollView(getTiContext().getActivity()).scrollToBottom();
	}
}

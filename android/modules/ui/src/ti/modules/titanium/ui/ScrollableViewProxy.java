/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiEventHelper;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUIScrollableView;
import android.app.Activity;
import android.os.Message;

@Kroll.proxy(creatableInModule=UIModule.class)
public class ScrollableViewProxy extends TiViewProxy
{
	private static final String TAG = "TiScrollableView";

	private static final int MSG_FIRST_ID = TiViewProxy.MSG_LAST_ID + 1;
	public static final int MSG_SHOW_PAGER = MSG_FIRST_ID + 100;
	public static final int MSG_HIDE_PAGER = MSG_FIRST_ID + 101;
	public static final int MSG_MOVE_PREV = MSG_FIRST_ID + 102;
	public static final int MSG_MOVE_NEXT = MSG_FIRST_ID + 103;
	public static final int MSG_SCROLL_TO = MSG_FIRST_ID + 104;
	public static final int MSG_SET_VIEWS = MSG_FIRST_ID + 105;
	public static final int MSG_ADD_VIEW = MSG_FIRST_ID + 106;
	public static final int MSG_SET_CURRENT = MSG_FIRST_ID + 107;
	public static final int MSG_REMOVE_VIEW = MSG_FIRST_ID + 108;
	public static final int MSG_LAST_ID = MSG_FIRST_ID + 999;
	
	private static final int DEFAULT_PAGING_CONTROL_TIMEOUT = 3000;

	protected AtomicBoolean inScroll;

	public ScrollableViewProxy()
	{
		inScroll = new AtomicBoolean(false);
	}

	@Override
	public TiUIView createView(Activity activity) {
		return new TiUIScrollableView(this);
	}

	protected TiUIScrollableView getView() {
		return (TiUIScrollableView) getOrCreateView();
	}

	public boolean handleMessage(Message msg)
	{
		boolean handled = false;

		switch(msg.what) {
			case MSG_SHOW_PAGER :
				getView().showPager();
				break;
			case MSG_HIDE_PAGER :
				getView().hidePager();
				handled = true;
				break;
			case MSG_MOVE_PREV :
				inScroll.set(true);
				getView().doMovePrevious();
				inScroll.set(false);
				handled = true;
				break;
			case MSG_MOVE_NEXT :
				inScroll.set(true);
				getView().doMoveNext();
				inScroll.set(false);
				handled = true;
				break;
			case MSG_SCROLL_TO :
				inScroll.set(true);
				getView().doScrollToView(msg.obj);
				inScroll.set(false);
				handled = true;
				break;
			case MSG_SET_CURRENT :
				getView().doSetCurrentPage(msg.obj);
				handled = true;
				break;
			case MSG_SET_VIEWS: {
				AsyncResult holder = (AsyncResult) msg.obj;
				Object views = holder.getArg(); 
				getView().setViews(views);
				holder.setResult(null); // signal complete.
				handled = true;
				break;
			}
			case MSG_ADD_VIEW: {
				AsyncResult holder = (AsyncResult) msg.obj;
				Object view = holder.getArg();
				if (view instanceof TiViewProxy) {
					getView().addView((TiViewProxy) view);
					handled = true;
				} else if (view != null) {
					Log.w(TAG, "addView() ignored. Expected a Titanium view object, got " + view.getClass().getSimpleName());
				}
				holder.setResult(null); // signal complete.
				break;
			}
			case MSG_REMOVE_VIEW: {
				AsyncResult holder = (AsyncResult) msg.obj;
				Object view = holder.getArg(); 
				if (view instanceof TiViewProxy) {
					getView().removeView((TiViewProxy) view);
					handled = true;
				} else if (view != null) {
					Log.w(TAG, "removeView() ignored. Expected a Titanium view object, got " + view.getClass().getSimpleName());
				}
				holder.setResult(null); // signal complete.
				break;
			}
			default :
				handled = super.handleMessage(msg);
		}

		return handled;
	}

	@Kroll.getProperty @Kroll.method
	public Object getViews()
	{
		List<TiViewProxy> list = new ArrayList<TiViewProxy>();
		return getView().getViews().toArray(new TiViewProxy[list.size()]);
	}

	@Kroll.setProperty @Kroll.method
	public void setViews(Object viewsObject) {
		sendBlockingUiMessage(MSG_SET_VIEWS, viewsObject);
	}

	@Kroll.method
	public void addView(Object viewObject) {
		sendBlockingUiMessage(MSG_ADD_VIEW, viewObject); 
	}
	
	@Kroll.method
	public void removeView(Object viewObject) {
		sendBlockingUiMessage(MSG_REMOVE_VIEW, viewObject); 
	}

	@Kroll.method
	public void scrollToView(Object view) {
		if (inScroll.get()) return;
		getUIHandler().obtainMessage(MSG_SCROLL_TO, view).sendToTarget();
	}

	@Kroll.method
	public void movePrevious() {
		if (inScroll.get()) return;
		getUIHandler().removeMessages(MSG_MOVE_PREV);
		getUIHandler().sendEmptyMessage(MSG_MOVE_PREV);
	}

	@Kroll.method
	public void moveNext() {
		if (inScroll.get()) return;
		getUIHandler().removeMessages(MSG_MOVE_NEXT);
		getUIHandler().sendEmptyMessage(MSG_MOVE_NEXT);
	}

	public void setPagerTimeout() {
		getUIHandler().removeMessages(MSG_HIDE_PAGER);
		int timeout = DEFAULT_PAGING_CONTROL_TIMEOUT;
		Object o = getProperty(TiC.PROPERTY_PAGING_CONTROL_TIMEOUT);
		if (o != null) {
			timeout = TiConvert.toInt(o);
		}

		if (timeout > 0) {
			getUIHandler().sendEmptyMessageDelayed(MSG_HIDE_PAGER, timeout);
		}
	}

	@Kroll.setProperty @Kroll.method
	public void setShowPagingControl(boolean showPagingControl) {
		getView().setShowPagingControl(showPagingControl);
		if (!showPagingControl) {
			getUIHandler().sendEmptyMessage(MSG_HIDE_PAGER);
		} else {
			getUIHandler().sendEmptyMessage(MSG_SHOW_PAGER);
		}
	}

	public void fireScroll(int to)
	{
		if (hasListeners(TiC.EVENT_SCROLL)) {
			KrollDict options = new KrollDict();
			options.put("index", to);
			options.put("view", this);
			options.put("currentPage", getView().getCurrentPage());
			TiEventHelper.fireViewEvent(this, TiC.EVENT_SCROLL, options);
		}
	}

	@Kroll.getProperty @Kroll.method
	public int getCurrentPage() {
		return getView().getCurrentPage();
	}

	@Kroll.setProperty @Kroll.method
	public void setCurrentPage(Object page) {
		getUIHandler().obtainMessage(MSG_SET_CURRENT, page).sendToTarget();
	}

	@Override
	public void releaseViews()
	{
		getUIHandler().removeMessages(MSG_SHOW_PAGER);
		getUIHandler().removeMessages(MSG_HIDE_PAGER);
		super.releaseViews();
	}
}

/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicBoolean;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.AsyncResult;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiMessenger;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUIScrollableView;
import android.app.Activity;
import android.os.Message;

@Kroll.proxy(creatableInModule = UIModule.class,
	propertyAccessors = {
		TiC.PROPERTY_CACHE_SIZE,
		TiC.PROPERTY_CLIP_VIEWS,
		TiC.PROPERTY_PADDING,
		TiC.PROPERTY_SHOW_PAGING_CONTROL,
		TiC.PROPERTY_OVER_SCROLL_MODE
})
public class ScrollableViewProxy extends TiViewProxy
{
	private static final String TAG = "TiScrollableView";

	private static final int MSG_FIRST_ID = TiViewProxy.MSG_LAST_ID + 1;
	public static final int MSG_HIDE_PAGER = MSG_FIRST_ID + 101;
	public static final int MSG_MOVE_PREV = MSG_FIRST_ID + 102;
	public static final int MSG_MOVE_NEXT = MSG_FIRST_ID + 103;
	public static final int MSG_SCROLL_TO = MSG_FIRST_ID + 104;
	public static final int MSG_SET_VIEWS = MSG_FIRST_ID + 105;
	public static final int MSG_ADD_VIEW = MSG_FIRST_ID + 106;
	public static final int MSG_SET_CURRENT = MSG_FIRST_ID + 107;
	public static final int MSG_REMOVE_VIEW = MSG_FIRST_ID + 108;
	public static final int MSG_SET_ENABLED = MSG_FIRST_ID + 109;
	public static final int MSG_INSERT_VIEWS_AT = MSG_FIRST_ID + 110;
	public static final int MSG_LAST_ID = MSG_FIRST_ID + 999;

	private static final int DEFAULT_PAGING_CONTROL_TIMEOUT = 3000;
	public static final int MIN_CACHE_SIZE = 3;

	protected AtomicBoolean inScroll;

	public ScrollableViewProxy()
	{
		super();
		inScroll = new AtomicBoolean(false);
		defaultValues.put(TiC.PROPERTY_CACHE_SIZE, MIN_CACHE_SIZE);
		defaultValues.put(TiC.PROPERTY_CLIP_VIEWS, true);
		defaultValues.put(TiC.PROPERTY_SHOW_PAGING_CONTROL, false);
		defaultValues.put(TiC.PROPERTY_OVER_SCROLL_MODE, 0);
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUIScrollableView(this);
	}

	protected TiUIScrollableView getView()
	{
		return (TiUIScrollableView) getOrCreateView();
	}

	public boolean handleMessage(Message msg)
	{
		boolean handled = false;
		TiUIScrollableView view = getView();
		switch (msg.what) {
			case MSG_HIDE_PAGER:
				if (view != null) {
					view.hidePager();
					handled = true;
				}
				break;
			case MSG_MOVE_PREV:
				if (view != null) {
					inScroll.set(true);
					view.movePrevious();
					inScroll.set(false);
					handled = true;
				}
				break;
			case MSG_MOVE_NEXT:
				if (view != null) {
					inScroll.set(true);
					view.moveNext();
					inScroll.set(false);
					handled = true;
				}
				break;
			case MSG_SCROLL_TO:
				if (view != null) {
					inScroll.set(true);
					view.scrollTo(msg.obj);
					inScroll.set(false);
					handled = true;
				}
				break;
			case MSG_SET_CURRENT:
				if (view != null) {
					view.setCurrentPage(msg.obj);
					handled = true;
				}
				break;
			case MSG_SET_VIEWS: {
				AsyncResult holder = (AsyncResult) msg.obj;
				if (view != null) {
					view.setViews(holder.getArg());
					handled = true;
				}
				holder.setResult(null);
				break;
			}
			case MSG_ADD_VIEW: {
				AsyncResult holder = (AsyncResult) msg.obj;
				Object childView = holder.getArg();
				if (childView instanceof TiViewProxy) {
					if (view != null) {
						view.addView((TiViewProxy) childView);
						handled = true;
					}
				} else if (childView != null) {
					String message = "addView() ignored. Expected a Titanium view object, got "
									 + childView.getClass().getSimpleName();
					Log.w(TAG, message);
				}
				holder.setResult(null);
				break;
			}
			case MSG_INSERT_VIEWS_AT: {
				AsyncResult holder = (AsyncResult) msg.obj;
				int insertIndex = msg.arg1;
				Object arg = holder.getArg();
				if (arg instanceof TiViewProxy || arg instanceof Object[]) {
					if (view != null) {
						view.insertViewsAt(insertIndex, arg);
						handled = true;
					}
				} else if (arg != null) {
					Log.w(TAG,
						  "insertViewsAt() ignored. Expected a Titanium view object or a Titanium views array, got "
							  + arg.getClass().getSimpleName());
				}
				holder.setResult(null);
				break;
			}
			case MSG_REMOVE_VIEW: {
				AsyncResult holder = (AsyncResult) msg.obj;
				Object object = holder.getArg();
				if (object instanceof Number) {
					if (view != null) {
						view.removeViewByIndex(((Number) object).intValue());
						handled = true;
					}
				} else if (object instanceof TiViewProxy) {
					if (view != null) {
						view.removeView((TiViewProxy) object);
						handled = true;
					}
				} else if (object != null) {
					Log.w(TAG, "removeView() argument ignored. Expected a Titanium view object or integer index. Got "
								   + object.getClass().getSimpleName());
				}
				holder.setResult(null);
				break;
			}
			case MSG_SET_ENABLED:
				if (view != null) {
					view.setEnabled(msg.obj);
					handled = true;
				}
				break;
			default:
				handled = super.handleMessage(msg);
		}

		return handled;
	}

	@Kroll.method
	@Kroll.getProperty
	public Object getViews()
	{
		TiViewProxy[] childViewArray = new TiViewProxy[0];
		TiUIScrollableView view = getView();
		if (view != null) {
			childViewArray = view.getViews().toArray(childViewArray);
		}
		return childViewArray;
	}

	@Kroll.method
	@Kroll.setProperty
	public void setViews(Object viewsObject)
	{
		TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_SET_VIEWS), viewsObject);
	}

	@Kroll.method
	public void addView(Object viewObject)
	{
		TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_ADD_VIEW), viewObject);
	}

	@Kroll.method
	public void insertViewsAt(int insertIndex, Object viewObject)
	{
		TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_INSERT_VIEWS_AT, insertIndex, 0),
											viewObject);
	}

	@Kroll.method
	public void removeView(Object viewObject)
	{
		TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_REMOVE_VIEW), viewObject);
	}

	@Kroll.method
	public void scrollToView(Object view)
	{
		if (inScroll.get()) {
			return;
		}
		getMainHandler().obtainMessage(MSG_SCROLL_TO, view).sendToTarget();
	}

	@Kroll.method
	public void movePrevious()
	{
		if (inScroll.get()) {
			return;
		}
		getMainHandler().removeMessages(MSG_MOVE_PREV);
		getMainHandler().sendEmptyMessage(MSG_MOVE_PREV);
	}

	@Kroll.method
	public void moveNext()
	{
		if (inScroll.get()) {
			return;
		}
		getMainHandler().removeMessages(MSG_MOVE_NEXT);
		getMainHandler().sendEmptyMessage(MSG_MOVE_NEXT);
	}

	public void setPagerTimeout()
	{
		getMainHandler().removeMessages(MSG_HIDE_PAGER);

		int timeout = DEFAULT_PAGING_CONTROL_TIMEOUT;
		Object o = getProperty(TiC.PROPERTY_PAGING_CONTROL_TIMEOUT);
		if (o != null) {
			timeout = TiConvert.toInt(o);
		}

		if (timeout > 0) {
			getMainHandler().sendEmptyMessageDelayed(MSG_HIDE_PAGER, timeout);
		}
	}

	public void fireDragEnd(int currentPage, TiViewProxy currentView)
	{
		if (hasListeners(TiC.EVENT_DRAGEND)) {
			KrollDict options = new KrollDict();
			options.put("view", currentView);
			options.put("currentPage", currentPage);
			fireEvent(TiC.EVENT_DRAGEND, options);
		}
		// TODO: Deprecate old event
		if (hasListeners("dragEnd")) {
			KrollDict options = new KrollDict();
			options.put("view", currentView);
			options.put("currentPage", currentPage);
			fireEvent("dragEnd", options);
		}
	}

	public void fireScrollEnd(int currentPage, TiViewProxy currentView)
	{
		if (hasListeners(TiC.EVENT_SCROLLEND)) {
			KrollDict options = new KrollDict();
			options.put("view", currentView);
			options.put("currentPage", currentPage);
			fireEvent(TiC.EVENT_SCROLLEND, options);
		}
		// TODO: Deprecate old event
		if (hasListeners("scrollEnd")) {
			KrollDict options = new KrollDict();
			options.put("view", currentView);
			options.put("currentPage", currentPage);
			fireEvent("scrollEnd", options);
		}
	}

	public void fireScroll(int currentPage, float currentPageAsFloat, TiViewProxy currentView)
	{
		if (hasListeners(TiC.EVENT_SCROLL)) {
			KrollDict options = new KrollDict();
			options.put("view", currentView);
			options.put("currentPage", currentPage);
			options.put("currentPageAsFloat", currentPageAsFloat);
			fireEvent(TiC.EVENT_SCROLL, options);
		}
	}

	@Kroll.method
	@Kroll.setProperty
	public void setScrollingEnabled(Object enabled)
	{
		getMainHandler().obtainMessage(MSG_SET_ENABLED, enabled).sendToTarget();
	}

	@Kroll.method
	@Kroll.getProperty
	public boolean getScrollingEnabled()
	{
		TiUIScrollableView view = getView();
		return (view != null) ? view.getEnabled() : false;
	}

	@Kroll.method
	@Kroll.getProperty
	public int getCurrentPage()
	{
		TiUIScrollableView view = getView();
		return (view != null) ? view.getCurrentPage() : 0;
	}

	@Kroll.method
	@Kroll.setProperty
	public void setCurrentPage(Object page)
	{
		getMainHandler().obtainMessage(MSG_SET_CURRENT, page).sendToTarget();
	}

	@Override
	public void releaseViews()
	{
		getMainHandler().removeMessages(MSG_HIDE_PAGER);
		super.releaseViews();
	}

	@Override
	public void setActivity(Activity activity)
	{
		super.setActivity(activity);

		TiUIScrollableView view = getView();
		if (view != null) {
			ArrayList<TiViewProxy> list = view.getViews();
			for (TiViewProxy proxy : list) {
				proxy.setActivity(activity);
			}
		}
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.ScrollableView";
	}
}

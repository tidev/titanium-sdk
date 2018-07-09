/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
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
// clang-format off
@Kroll.proxy(creatableInModule = UIModule.class,
	propertyAccessors = {
		TiC.PROPERTY_CURRENT_PAGE,
		TiC.PROPERTY_SCROLLING_ENABLED,
		TiC.PROPERTY_VIEWS,
		TiC.PROPERTY_CACHE_SIZE,
		TiC.PROPERTY_CLIP_VIEWS,
		TiC.PROPERTY_PADDING,
		TiC.PROPERTY_SHOW_PAGING_CONTROL,
		TiC.PROPERTY_OVER_SCROLL_MODE
})
// clang-format on
public class ScrollableViewProxy extends TiViewProxy
{
	private static final String TAG = "TiScrollableView";

	private static final int MSG_FIRST_ID = TiViewProxy.MSG_LAST_ID + 1;
	public static final int MSG_HIDE_PAGER = MSG_FIRST_ID + 101;
	public static final int MSG_MOVE_PREV = MSG_FIRST_ID + 102;
	public static final int MSG_MOVE_NEXT = MSG_FIRST_ID + 103;
	public static final int MSG_SCROLL_TO = MSG_FIRST_ID + 104;
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
		defaultValues.put(TiC.PROPERTY_CURRENT_PAGE, 0);
		defaultValues.put(TiC.PROPERTY_SCROLLING_ENABLED, true);
		defaultValues.put(TiC.PROPERTY_VIEWS, new Object[0]);
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUIScrollableView(this);
	}

	public boolean handleMessage(Message msg)
	{
		boolean handled = false;
		TiUIScrollableView view = (TiUIScrollableView) peekView();
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
			default:
				handled = super.handleMessage(msg);
		}

		return handled;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public Object getViews()
	// clang-format on
	{
		if (hasPropertyAndNotNull(TiC.PROPERTY_VIEWS)) {
			return getProperty(TiC.PROPERTY_VIEWS);
		}
		return new Object[0];
	}

	@Kroll.method
	public void addView(Object viewObject)
	{
		if (viewObject instanceof TiViewProxy) {
			ArrayList<Object> list = getViewsList();
			list.add(viewObject);
			Object viewsObject = list.toArray();
			setPropertyAndFire(TiC.PROPERTY_VIEWS, viewsObject);
		}
	}

	@Kroll.method
	public void insertViewsAt(int insertIndex, Object object)
	{
		if (object instanceof Object[]) {
			ArrayList<Object> list = getViewsList();
			ArrayList<Object> views = new ArrayList<Object>(Arrays.asList((Object[]) object));
			list.addAll(insertIndex, views);
			Object viewsObject = list.toArray();
			setPropertyAndFire(TiC.PROPERTY_VIEWS, viewsObject);
		}
	}

	@Kroll.method
	public void removeView(Object viewObject)
	{
		ArrayList<Object> list = getViewsList();
		if (viewObject instanceof Number) {
			list.remove(TiConvert.toInt(viewObject));
		} else if (viewObject instanceof TiViewProxy) {
			list.remove(viewObject);
		} else if (viewObject != null) {
			Log.w(TAG, "removeView() argument ignored. Expected a Titanium view object or integer index. Got "
						   + viewObject.getClass().getSimpleName());
			return;
		}
		Object viewsObject = list.toArray();
		setPropertyAndFire(TiC.PROPERTY_VIEWS, viewsObject);
	}

	@Kroll.method
	public void scrollToView(Object view)
	{
		if (inScroll.get()) {
			return;
		}
		if (peekView() != null) {
			getMainHandler().obtainMessage(MSG_SCROLL_TO, view).sendToTarget();
			return;
		}
		int count = ((Object[]) getViews()).length;
		int index = -1;
		if (view instanceof Number) {
			index = ((Number) view).intValue();

		} else if (view instanceof TiViewProxy) {
			ArrayList<Object> list = getViewsList();
			index = list.indexOf(view);
		}
		if (index < count - 1 && index > -1) {
			setProperty(TiC.PROPERTY_CURRENT_PAGE, index);
		}
	}

	@Kroll.method
	public void movePrevious()
	{
		if (inScroll.get()) {
			return;
		}
		if (peekView() != null) {
			getMainHandler().removeMessages(MSG_MOVE_PREV);
			getMainHandler().sendEmptyMessage(MSG_MOVE_PREV);
			return;
		}
		int current = 0;
		if (hasPropertyAndNotNull(TiC.PROPERTY_CURRENT_PAGE)) {
			current = TiConvert.toInt(getProperty(TiC.PROPERTY_CURRENT_PAGE));
		}
		if (current > 0) {
			setProperty(TiC.PROPERTY_CURRENT_PAGE, current - 1);
		}
	}

	@Kroll.method
	public void moveNext()
	{
		if (inScroll.get()) {
			return;
		}
		if (peekView() != null) {
			getMainHandler().removeMessages(MSG_MOVE_NEXT);
			getMainHandler().sendEmptyMessage(MSG_MOVE_NEXT);
			return;
		}
		int current = 0;
		if (hasPropertyAndNotNull(TiC.PROPERTY_CURRENT_PAGE)) {
			current = TiConvert.toInt(getProperty(TiC.PROPERTY_CURRENT_PAGE));
		}
		int count = ((Object[]) getViews()).length;
		if (current < count - 1) {
			setProperty(TiC.PROPERTY_CURRENT_PAGE, current + 1);
		}
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

	@Override
	public void setActivity(Activity activity)
	{
		super.setActivity(activity);

		if (hasPropertyAndNotNull(TiC.PROPERTY_VIEWS)) {
			ArrayList<Object> list = getViewsList();
			for (Object proxy : list) {
				((TiViewProxy) proxy).setActivity(activity);
			}
		}
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.ScrollableView";
	}

	private ArrayList<Object> getViewsList()
	{
		return new ArrayList<Object>(Arrays.asList((Object[]) getViews()));
	}
}

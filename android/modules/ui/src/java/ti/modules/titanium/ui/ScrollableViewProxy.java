/**
 * TiDev Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
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
	public static final int MSG_SET_CURRENT = MSG_FIRST_ID + 107;
	public static final int MSG_SET_ENABLED = MSG_FIRST_ID + 109;
	public static final int MSG_LAST_ID = MSG_FIRST_ID + 999;

	private static final int DEFAULT_PAGING_CONTROL_TIMEOUT = 3000;
	public static final int MIN_CACHE_SIZE = 3;

	protected AtomicBoolean inScroll;
	private List<TiViewProxy> views = new ArrayList<>();
	private TiUIScrollableView scrollableView;

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
	public void handleCreationDict(KrollDict properties)
	{
		super.handleCreationDict(properties);

		if (properties.containsKey(TiC.PROPERTY_VIEWS)) {
			setViews(properties.get(TiC.PROPERTY_VIEWS));
		}
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		this.scrollableView = new TiUIScrollableView(this);
		return this.scrollableView;
	}

	public boolean handleMessage(Message msg)
	{
		boolean handled = false;

		switch (msg.what) {
			case MSG_HIDE_PAGER:
				if (scrollableView != null) {
					scrollableView.hidePager();
					handled = true;
				}
				break;
			case MSG_MOVE_PREV:
				if (scrollableView != null) {
					inScroll.set(true);
					scrollableView.movePrevious();
					inScroll.set(false);
					handled = true;
				}
				break;
			case MSG_MOVE_NEXT:
				if (scrollableView != null) {
					inScroll.set(true);
					scrollableView.moveNext();
					inScroll.set(false);
					handled = true;
				}
				break;
			case MSG_SCROLL_TO:
				if (scrollableView != null) {
					inScroll.set(true);
					scrollableView.scrollTo(msg.obj);
					inScroll.set(false);
					handled = true;
				}
				break;
			default:
				handled = super.handleMessage(msg);
		}

		return handled;
	}

	public void removeAllViews()
	{
		for (final TiViewProxy view : this.views) {
			view.releaseViews();
			view.setParent(null);
		}
		this.views.clear();

		if (scrollableView != null) {
			scrollableView.getAdapter().notifyDataSetChanged();
		}
	}

	public ArrayList<TiViewProxy> getViewsList()
	{
		return (ArrayList<TiViewProxy>) this.views;
	}

	@Kroll.getProperty
	public TiViewProxy[] getViews()
	{
		return this.views.toArray(new TiViewProxy[0]);
	}

	@Kroll.setProperty
	public void setViews(Object views)
	{
		// Clone current view list.
		ArrayList<TiViewProxy> oldViewList = new ArrayList<>(this.views);

		// Replace all views with the given view collection.
		this.views.clear();
		if (views instanceof Object[]) {
			for (final Object nextObject : (Object[]) views) {
				if (nextObject instanceof TiViewProxy) {
					TiViewProxy view = (TiViewProxy) nextObject;
					if (!this.views.contains(view)) {
						view.setActivity(getActivity());
						view.setParent(this);
						this.views.add(view);
					}
				}
			}
		}

		// Release all of the views that are no longer attached to this scrollable view.
		// Note: If given collection contains views in old collection, then do not release them.
		for (TiViewProxy oldView : oldViewList) {
			if (!this.views.contains(oldView)) {
				oldView.releaseViews();
				oldView.setParent(null);
			}
		}

		// Notify native scrollable view about the view collection change.
		if (this.scrollableView != null) {
			this.scrollableView.getAdapter().notifyDataSetChanged();
		}
	}

	@Kroll.method
	public void addView(TiViewProxy view)
	{
		// Validate argument.
		if (view == null) {
			return;
		}

		// Do not continue if already added.
		if (this.views.contains(view)) {
			return;
		}

		// Add given view to collection.
		view.setActivity(getActivity());
		view.setParent(this);
		this.views.add(view);

		// Notify native scrollable view about the added child view.
		if (this.scrollableView != null) {
			this.scrollableView.getAdapter().notifyDataSetChanged();
		}
	}

	@Kroll.method
	public void insertViewsAt(int insertIndex, Object viewObject)
	{
		if (viewObject instanceof TiViewProxy) {
			final TiViewProxy view = (TiViewProxy) viewObject;

			if (!this.views.contains(view)) {
				view.setActivity(getActivity());
				view.setParent(this);
				this.views.add(insertIndex, view);
			}

		} else if (viewObject instanceof Object[]) {
			Object[] views = (Object[]) viewObject;

			for (int i = 0; i < views.length; i++) {
				insertViewsAt(insertIndex, views[i]);
			}
		} else {

			// Skip updating adapter.
			return;
		}

		if (scrollableView != null) {
			scrollableView.getAdapter().notifyDataSetChanged();
		}
	}

	@Kroll.method
	public void removeView(Object viewObject)
	{
		if (viewObject instanceof Number) {
			this.views.remove((int) viewObject);

		} else if (viewObject instanceof TiViewProxy) {
			final TiViewProxy view = (TiViewProxy) viewObject;

			this.views.remove(view);

		} else {

			// Skip updating adapter.
			return;
		}

		if (scrollableView != null) {
			final int currentPage = scrollableView.getCurrentPage();

			scrollableView.getAdapter().notifyDataSetChanged();

			if (currentPage >= this.views.size()) {

				// Last view removed, set to valid view.
				scrollableView.setCurrentPage(this.views.size() - 1);
			}
		}
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

	@Kroll.setProperty
	public void setScrollingEnabled(boolean value)
	{
		if (scrollableView != null) {
			scrollableView.setEnabled(value);
		}
	}
	@Kroll.getProperty
	public boolean getScrollingEnabled()
	{
		return (scrollableView != null) ? scrollableView.getEnabled()
			: getProperties().optBoolean(TiC.PROPERTY_SCROLLING_ENABLED, true);
	}

	@Kroll.setProperty
	public void setCurrentPage(int currentPage)
	{
		setProperty(TiC.PROPERTY_CURRENT_PAGE, currentPage);

		if (scrollableView != null) {
			scrollableView.setCurrentPage(currentPage);
		}
	}

	@Kroll.getProperty
	public int getCurrentPage()
	{
		return (scrollableView != null) ? scrollableView.getCurrentPage()
			: getProperties().optInt(TiC.PROPERTY_CURRENT_PAGE, 0);
	}

	@Override
	public void releaseViews()
	{
		getMainHandler().removeMessages(MSG_HIDE_PAGER);

		for (final TiViewProxy view : this.views) {
			view.releaseViews();
		}

		// Remove out-of-date views from proxy.
		// Prevents using old views upon re-creation.
		this.properties.remove(TiC.PROPERTY_VIEWS);

		// Remove reference to scrollable view component.
		// NOTE: This is the same as `this.view`
		this.scrollableView = null;

		super.releaseViews();

	}

	@Override
	public void setActivity(Activity activity)
	{
		super.setActivity(activity);

		for (final TiViewProxy view : this.views) {
			view.setActivity(activity);
		}
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.ScrollableView";
	}
}

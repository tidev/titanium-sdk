/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.util.TiEventHelper;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUIScrollableView;
import android.app.Activity;
import android.os.Message;
import android.view.animation.Animation;
import android.view.animation.Animation.AnimationListener;

public class ScrollableViewProxy extends TiViewProxy
	implements AnimationListener
{

	private static final String EVENT_SCROLL = "scroll";

	private static final int MSG_FIRST_ID = TiViewProxy.MSG_LAST_ID + 1;
	public static final int MSG_SHOW_PAGER = MSG_FIRST_ID + 100;
	public static final int MSG_HIDE_PAGER = MSG_FIRST_ID + 101;
	public static final int MSG_MOVE_PREV = MSG_FIRST_ID + 102;
	public static final int MSG_MOVE_NEXT = MSG_FIRST_ID + 103;
	public static final int MSG_SCROLL_TO = MSG_FIRST_ID + 104;
	public static final int MSG_SET_VIEWS = MSG_FIRST_ID + 105;
	public static final int MSG_ADD_VIEW = MSG_FIRST_ID + 106;
	public static final int MSG_SET_CURRENT = MSG_FIRST_ID + 107;
	public static final int MSG_LAST_ID = MSG_FIRST_ID + 999;

	protected AtomicBoolean inAnimation;
	protected AtomicBoolean inScroll;

	public ScrollableViewProxy(TiContext context, Object[] args)
	{
		super(context, args);
		inAnimation = new AtomicBoolean(false);
		inScroll = new AtomicBoolean(false);
	}

	@Override
	public TiUIView createView(Activity activity) {
		return new TiUIScrollableView(this, getUIHandler());
	}

	protected TiUIScrollableView getView() {
		return (TiUIScrollableView)getView(getTiContext().getActivity());
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
				}
				holder.setResult(null); // signal complete.
				break;
			}
			default :
				handled = super.handleMessage(msg);
		}

		return handled;
	}

	public Object getViews()
	{
		List<TiViewProxy> list = new ArrayList<TiViewProxy>();
		return getView().getViews().toArray(new TiViewProxy[list.size()]);
	}

	public void setViews(Object viewsObject) {
		Message msg = getUIHandler().obtainMessage(MSG_SET_VIEWS);
		AsyncResult result = new AsyncResult(viewsObject);
		msg.obj = result;
		msg.sendToTarget();
		result.getResult(); // Wait for it
	}

	public void addView(Object viewObject) {
		Message msg = getUIHandler().obtainMessage(MSG_ADD_VIEW);
		AsyncResult result = new AsyncResult(viewObject);
		msg.obj = result;
		msg.sendToTarget();
		result.getResult(); // Wait for it 
	}

	public void scrollToView(Object view) {
		if (inScroll.get()) return;
		getUIHandler().obtainMessage(MSG_SCROLL_TO, view).sendToTarget();
	}

	public void movePrevious() {
		if (inScroll.get() || inAnimation.get()) return;
		getUIHandler().removeMessages(MSG_MOVE_PREV);
		getUIHandler().sendEmptyMessage(MSG_MOVE_PREV);
	}

	public void moveNext() {
		// was synchronized(gallery) {
		if (inScroll.get() || inAnimation.get()) return;
		getUIHandler().removeMessages(MSG_MOVE_NEXT);
		getUIHandler().sendEmptyMessage(MSG_MOVE_NEXT);
	}

	public void setPagerTimeout() {
		getUIHandler().removeMessages(MSG_HIDE_PAGER);
		getUIHandler().sendEmptyMessageDelayed(MSG_HIDE_PAGER, 3000);
	}

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
		if (hasListeners(EVENT_SCROLL)) {
			TiDict options = new TiDict();
			options.put("index", to);
			options.put("view", this);
			options.put("currentPage", getView().getCurrentPage());
			TiEventHelper.fireViewEvent(this, EVENT_SCROLL, options);
		}
	}

	public int getCurrentPage() {
		return getView().getCurrentPage();
	}

	public void setCurrentPage(Object page) {
		getUIHandler().obtainMessage(MSG_SET_CURRENT, page).sendToTarget();
	}

	public void onAnimationRepeat(Animation anim) {

	}

	public void onAnimationEnd(Animation anim) {
		inAnimation.set(false);
	}

	public void onAnimationStart(Animation anim) {
		inAnimation.set(true);
	}
}

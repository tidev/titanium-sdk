/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiAnimation;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.os.Message;

public abstract class TiWindowProxy extends TiViewProxy
{
	private static final String LCAT = "TiWindowProxy";
	private static final boolean DBG = TiConfig.LOGD;

	private static final int MSG_FIRST_ID = TiProxy.MSG_LAST_ID + 1;

	private static final int MSG_OPEN = MSG_FIRST_ID + 100;
	private static final int MSG_CLOSE = MSG_FIRST_ID + 101;

	protected static final int MSG_LAST_ID = MSG_FIRST_ID + 999;

	protected boolean opened;
	protected boolean focused;
	protected boolean fullscreen;
	protected boolean modal;
	protected boolean restoreFullscreen;

	protected TiViewProxy tabGroup;
	protected TiViewProxy tab;
	protected boolean inTab;

	public TiWindowProxy(TiContext tiContext, Object[] args)
	{
		super(tiContext, args);
		inTab = false;
	}

	@Override
	public TiUIView createView(Activity activity) {
		throw new IllegalStateException("Windows are created during open");
	}

	@Override
	public boolean handleMessage(Message msg)
	{
		switch(msg.what) {
			case MSG_OPEN : {
				AsyncResult result = (AsyncResult) msg.obj;
				handleOpen((TiDict) result.getArg());
				result.setResult(null); // signal opened
				return true;
			}
			case MSG_CLOSE : {
				AsyncResult result = (AsyncResult) msg.obj;
				handleClose((TiDict) result.getArg());
				result.setResult(null); // signal closed
				return true;
			}
			default : {
				return super.handleMessage(msg);
			}
		}
	}

	public void open(Object arg)
	{
		if (opened) {
			return;
		}

		TiDict options = null;
		TiAnimation animation = null;

		if (arg != null) {
			if (arg instanceof TiDict) {
				options = (TiDict) arg;
			} else if (arg instanceof TiAnimation) {
				options = new TiDict();
				options.put("_anim", animation);
			}
		}

		if (getTiContext().isUIThread()) {
			handleOpen(options);
			return;
		}

		AsyncResult result = new AsyncResult(options);
		Message msg = getUIHandler().obtainMessage(MSG_OPEN, result);
		msg.sendToTarget();
		result.getResult(); // Don't care about result, just synchronizing.
	}

	public void close(Object arg)
	{
		if (!opened) {
			return;
		}

		TiDict options = null;
		TiAnimation animation = null;

		if (arg != null) {
			if (arg instanceof TiDict) {
				options = (TiDict) arg;
			} else if (arg instanceof TiAnimation) {
				options = new TiDict();
				options.put("_anim", animation);
			}
		}

		if (getTiContext().isUIThread()) {
			handleClose(options);
			return;
		}

		AsyncResult result = new AsyncResult(options);
		Message msg = getUIHandler().obtainMessage(MSG_CLOSE, result);
		msg.sendToTarget();
		result.getResult(); // Don't care about result, just synchronizing.
	}

	public void closeFromActivity() {
		opened = false;
	}
	
	public void setTabProxy(TiViewProxy tabProxy) {
		this.tab = tabProxy;
	}

	public TiViewProxy getTabProxy() {
		return this.tab;
	}

	public void setTabGroupProxy(TiViewProxy tabGroupProxy) {
		this.tabGroup = tabGroupProxy;
	}
	public TiViewProxy getTabGroupProxy() {
		return this.tabGroup;
	}

	public void hideTabBar() {
		// iPhone only right now.
	}

	public TiDict handleToImage() {
		return TiUIHelper.viewToImage(getTiContext(), getTiContext().getActivity().getWindow().getDecorView());
	}
	
	protected abstract void handleOpen(TiDict options);
	//public abstract void handlePostOpen(Activity activity);
	protected abstract void handleClose(TiDict options);
}

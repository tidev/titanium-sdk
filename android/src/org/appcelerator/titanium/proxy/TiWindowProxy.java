/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import org.appcelerator.titanium.TiActivity;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.content.Intent;
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

	protected TiWindowProxy tabGroup;
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

	public void open(TiDict options)
	{
		if (opened) {
			return;
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

	public void close(TiDict options)
	{
		if (!opened) {
			return;
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

	public void setTabProxy(TiViewProxy tabProxy) {
		this.tab = tabProxy;
	}

	public TiViewProxy getTabProxy() {
		return this.tab;
	}

	protected boolean requiresNewActivity(TiDict options)
	{
		boolean activityRequired = false;

		if (options != null) {
			if (options.containsKey("fullscreen") ||
					options.containsKey("navBarHidden") ||
					options.containsKey("tabOben"))
			{
				activityRequired = true;
			}
		}

		return activityRequired;
	}

	protected void fillIntent(Intent intent)
	{
		TiDict props = getDynamicProperties();

		if (requiresNewActivity(props))
		{
			if (props.containsKey("fullscreen")) {
				intent.putExtra("fullscreen", TiConvert.toBoolean(props, "fullscreen"));
			}
			if (props.containsKey("navBarHidden")) {
				intent.putExtra("navBarHidden", TiConvert.toBoolean(props, "navBarHidden"));
			}
			if (props.containsKey("url")) {
				intent.putExtra("url", TiConvert.toString(props, "url"));
			}
		} else {
			if (props != null) {
				if (props.containsKey("url")) {
					intent.putExtra("url", TiConvert.toString(props, "url"));
				}
			}
		}
		intent.putExtra("proxyId", proxyId);
	}

	protected abstract void handleOpen(TiDict options);
	public abstract void handlePostOpen(Activity activity);
	protected abstract void handleClose(TiDict options);
}

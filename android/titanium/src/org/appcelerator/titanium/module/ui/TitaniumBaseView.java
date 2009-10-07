/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.module.ui;

import java.util.concurrent.Semaphore;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumLifecycle;
import org.appcelerator.titanium.api.ITitaniumView;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumJSEventManager;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Handler;
import android.os.Message;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.FrameLayout;

public abstract class TitaniumBaseView extends FrameLayout
	implements ITitaniumView, Handler.Callback
{
	private static final String LCAT = "TiBaseView";
	private static final boolean DBG = TitaniumConfig.LOGD;

	public static final String EVENT_FOCUSED = "focused";
	public static final String EVENT_FOCUSED_JSON = "{type:'" + EVENT_FOCUSED + "'}";
	public static final String EVENT_UNFOCUSED = "unfocused";
	public static final String EVENT_UNFOCUSED_JSON = "{type:'" + EVENT_UNFOCUSED + "'}";

	protected static final int MSG_OPEN = 200;
	protected static final int MSG_CLOSE = 201;

	protected static final String MSG_EXTRA_CALLBACK = "cb";

	protected TitaniumModuleManager tmm;
	protected Handler handler;
	protected TitaniumJSEventManager eventManager;
	protected String key;
	protected String name;
	protected boolean hasBeenOpened;
	protected boolean openViewAfterOptions;
	protected int openViewDelay;


	public TitaniumBaseView(TitaniumModuleManager tmm)
	{
		super(tmm.getAppContext());
		init(tmm);
	}

	public TitaniumBaseView(TitaniumModuleManager tmm, int defStyle) {
		super(tmm.getAppContext(), null, defStyle);
		init(tmm);
	}

	private void init(TitaniumModuleManager tmm)
	{
		this.tmm = tmm;

		this.handler = new Handler(this);

		this.eventManager = new TitaniumJSEventManager(tmm);
		this.eventManager.supportEvent(EVENT_FOCUSED);
		this.eventManager.supportEvent(EVENT_UNFOCUSED);

		this.hasBeenOpened = false;
		openViewAfterOptions = true;
		openViewDelay = 1000;

		// Chicken and egg, so use the Activity to get the UserWindow
		tmm.getActivity().getCurrentWindow().registerView(this);
	}

	public boolean handleMessage(Message msg)
	{
		boolean handled = false;

		switch(msg.what)
		{
			case MSG_OPEN : {
				if (!hasBeenOpened) {
					doPreOpen();
					doOpen();
					doPostOpen();
					if (msg.obj != null) {
						Semaphore lock = (Semaphore) msg.obj;
						lock.release();
					}
				}
				handled = true;
				break;
			}
			case MSG_CLOSE : {
				doClose();
				handled = true;
				break;
			}
		}

		return handled;
	}

	public View getNativeView() {
		return this;
	}

	public String getKey() {
		return key;
	}

	public void setKey(String key) {
		this.key = key;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	protected ITitaniumView findViewByKey(String key) {
		return tmm.getCurrentWindow().getViewFromKey(key);
	}

	public int addEventListener(String eventName, String listener) {
		return eventManager.addListener(eventName, listener);
	}

	public void removeEventListener(String eventName, int listenerId) {
		eventManager.removeListener(eventName, listenerId);
	}

	public void dispatchWindowEvent(String eventName, String eventData) {
	}

	public void dispatchApplicationEvent(String eventName, String data) {
	}

	public void dispatchWindowFocusChanged(boolean hasFocus) {
		if (hasFocus) {
			eventManager.invokeSuccessListeners(EVENT_FOCUSED, EVENT_FOCUSED_JSON);
		} else {
			eventManager.invokeSuccessListeners(EVENT_UNFOCUSED, EVENT_UNFOCUSED_JSON);
		}
	}

	public void dispatchConfigurationChange(Configuration newConfig) {
	}

	// Called on the current view, so forward to our controller
	public boolean dispatchOptionsItemSelected(MenuItem item) {
		return tmm.getCurrentView().dispatchOptionsItemSelected(item);
	}

	// Called on the current view, so forward to our controller
	public boolean dispatchPrepareOptionsMenu(Menu menu) {
		return tmm.getCurrentView().dispatchPrepareOptionsMenu(menu);
	}

	public ITitaniumLifecycle getLifecycle() {
		// TODO Auto-generated method stub
		return null;
	}

	public void showing() {
		if (!hasBeenOpened) {
			handler.obtainMessage(MSG_OPEN).sendToTarget();
		} else {
			eventManager.invokeSuccessListeners(EVENT_FOCUSED, EVENT_FOCUSED_JSON);
		}
	}

	public void hiding() {
		eventManager.invokeSuccessListeners(EVENT_UNFOCUSED, EVENT_UNFOCUSED_JSON);
	}

	public void processOptions(String options)
	{
		if (DBG) {
			Log.d(LCAT, "JSON Options: " + options);
		}
		try {
			JSONObject o = new JSONObject(options);

			if (o.has("name")) {
				setName(o.getString("name"));
			}

			processLocalOptions(o);

		} catch (JSONException e) {
			Log.e(LCAT,"Error processing options: " + options, e);
		}

		if (openViewAfterOptions) {
			Semaphore lock = new Semaphore(0);
			handler.obtainMessage(MSG_OPEN, openViewDelay, -1, lock).sendToTarget();
			try {
				lock.acquire();
			} catch (InterruptedException e) {
				// Ignore
			}
		}
	}

	protected void doPreOpen() {
		FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.WRAP_CONTENT);
		setLayoutParams(params);
		setPadding(0,0,0,0);
		setFocusable(false);
		setFocusableInTouchMode(false);
		setClickable(false);
		setBackgroundColor(Color.TRANSPARENT);
	}

	protected void doPostOpen() {
		View contentView = getContentView();
		if (contentView != null) {
			FrameLayout.LayoutParams params = getContentLayoutParams();
			if (params == null) {
				params = new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.WRAP_CONTENT);
			}
			addView(getContentView(), params);
		}
		eventManager.invokeSuccessListeners(EVENT_FOCUSED, EVENT_FOCUSED_JSON);
		hasBeenOpened = true;
	}

	protected void doClose() {
		destroyDrawingCache();
		removeAllViews();
	}

	public void postOpen() {
		handler.sendEmptyMessageDelayed(MSG_OPEN, openViewDelay);
	}

	protected FrameLayout.LayoutParams getContentLayoutParams() {
		return new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.WRAP_CONTENT);
	}

	protected abstract void processLocalOptions(JSONObject o) throws JSONException;
	protected abstract void doOpen();
	protected abstract View getContentView();
}

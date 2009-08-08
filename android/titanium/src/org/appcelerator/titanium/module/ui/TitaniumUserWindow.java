/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module.ui;

import java.lang.ref.SoftReference;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.TitaniumActivity;
import org.appcelerator.titanium.TitaniumApplication;
import org.appcelerator.titanium.api.ITitaniumLifecycle;
import org.appcelerator.titanium.api.ITitaniumUserWindow;
import org.appcelerator.titanium.api.ITitaniumView;
import org.appcelerator.titanium.config.TitaniumAppInfo;
import org.appcelerator.titanium.config.TitaniumWindowInfo;
import org.appcelerator.titanium.module.TitaniumUI;
import org.appcelerator.titanium.util.TitaniumIntentWrapper;
import org.appcelerator.titanium.util.TitaniumJSEventManager;

import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.Log;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Handler;
import android.os.Message;
import android.webkit.URLUtil;

public class TitaniumUserWindow
	implements ITitaniumUserWindow, ITitaniumLifecycle, Handler.Callback
{
	private static final String LCAT = "TiUserWindow";
	private static final boolean DBG = TitaniumConfig.LOGD;

	public static final String EVENT_FOCUSED = "focused";
	public static final String EVENT_FOCUSED_JSON = "{type:'" + EVENT_FOCUSED + "'}";
	public static final String EVENT_UNFOCUSED = "unfocused";
	public static final String EVENT_UNFOCUSED_JSON = "{type:'" + EVENT_UNFOCUSED + "'}";


	protected static final int MSG_CLOSE = 300;
	protected static final int MSG_OPEN = 301;
	protected static final int MSG_SET_TITLE = 302;

	protected static AtomicInteger activityCounter;
	protected SoftReference<TitaniumUI> softUIModule;
	protected Handler handler;

	protected String windowId;
	protected String title;
	protected String titleImageUrl;
	protected String url;
	protected String type;
	protected boolean fullscreen;

	protected TitaniumJSEventManager eventListeners;

	protected boolean child;
	protected boolean isOpen;

	public TitaniumUserWindow(TitaniumUI uiModule, boolean child)
	{
		this.handler = new Handler(this);
		this.softUIModule = new SoftReference<TitaniumUI>(uiModule);
		isOpen = false;

		if (activityCounter == null) {
			activityCounter = new AtomicInteger();
		}

		if (!child) {
			isOpen = true;
			this.eventListeners = new TitaniumJSEventManager(uiModule);
			this.eventListeners.supportEvent(EVENT_FOCUSED);
			this.eventListeners.supportEvent(EVENT_UNFOCUSED);

			uiModule.addLifecycleListener(this);
		}
	}

	public boolean handleMessage(Message msg)
	{
		TitaniumActivity activity = getActivity();
		switch(msg.what) {
			case MSG_CLOSE : {
				if (activity != null) {
					isOpen = false;
					activity.finish();
				}
				return true;
			} // MSG_CLOSE
			case MSG_OPEN : {
				if (activity != null) {

					if (url != null && URLUtil.isNetworkUrl(url)) {
						Uri uri = Uri.parse(url);
						Intent intent = new Intent(Intent.ACTION_VIEW, uri);
						try {
							activity.startActivity(intent);
						} catch (ActivityNotFoundException e) {
							Log.e(LCAT,"Activity not found: " + url, e);
						}
					} else {

						TitaniumIntentWrapper intent = TitaniumIntentWrapper.createUsing(activity.getIntent());
						if (title != null) {
							intent.setTitle(title);
						}
						if (titleImageUrl != null) {
							intent.setIconUrl(titleImageUrl);
						}
						if (url != null) {
							intent.setData(url);
						}
						if (type != null) {
							intent.setActivityType(type);
						}
						intent.setFullscreen(fullscreen);
						if (windowId == null) {
							intent.setWindowId(TitaniumIntentWrapper.createActivityName("UW-" + activityCounter.incrementAndGet()));
						} else {
							TitaniumAppInfo appInfo = ((TitaniumApplication)activity.getApplication()).getAppInfo();
							TitaniumWindowInfo windowInfo = appInfo.findWindowInfo(windowId);
							intent.updateUsing(windowInfo);
						}

						activity.launchTitaniumActivity(intent);

						softUIModule = null;
					}
				} else {
					if (DBG) {
						Log.d(LCAT, "Activity Reference has been garbage collected");
					}
				}
			} // MSG_OPEN
			case MSG_SET_TITLE : {
				if (activity != null) {
					activity.setTitle((String) msg.obj);
				}
				return true;
			} // MSG_SET_TITLE
		}
		return false;
	}

	public void close() {
		if (!isOpen) {
			String msg = "UserWindow.close: Window is already open.";
			Log.e(LCAT, msg);
			throw new IllegalStateException(msg);
		}
		handler.obtainMessage(MSG_CLOSE).sendToTarget();
	}

	public void open()
	{
		if (isOpen) {
			String msg = "UserWindow.open: Window is already open.";
			Log.e(LCAT, msg);
			throw new IllegalStateException(msg);
		}
		handler.obtainMessage(MSG_OPEN).sendToTarget();
	}

	public void setWindowId(String windowId) {
		if(!isOpen) {
			this.windowId = windowId;
		} else {
			Log.w(LCAT, "windowId cannot be changed after a UserWindow has been opened.");
		}
	}

	public void setFullscreen(boolean fullscreen) {
		if (!isOpen) {
			this.fullscreen = fullscreen;
		} else {
			Log.w(LCAT, "fullscreen cannot be changed after a UserWindow has been opened");
		}
	}

	public void setTitle(String title) {
		this.title = title;
		if (isOpen) {
			handler.obtainMessage(MSG_SET_TITLE, title);
		}
	}

	public void setTitleImage(String titleImageUrl) {
		this.titleImageUrl = titleImageUrl;
	}

	public void setUrl(String url) {
		if (!isOpen) {
			this.url = url;
		} else {
			Log.w(LCAT, "Window url cannot be changed after a UserWindow has been opened");
		}
	}

	public void setType(String type) {
		if (!isOpen) {
			this.type = type;
		} else {
			Log.w(LCAT, "Window type cannot be changed after a UserWindow has been opened");
		}
	}

	public int addEventListener(String eventName, String listener) {
		if (!isOpen) {
			String msg = "UserWindow.addEventListener: addEventListener is not supported on a closed window.";
			Log.e(LCAT, msg);
			throw new IllegalStateException(msg);
		}
		int listenerId = -1;
		if (!child) {
			listenerId = eventListeners.addListener(eventName, listener);
		} else {
			Log.w(LCAT, "Attempt to add listener to child ignored.");
		}
		return listenerId;
	}

	public void removeEventListener(String eventName, int listenerId) {
		if (!child) {
			if (!isOpen) {
				String msg = "UserWindow.removeEventListener: removeEventListener is not supported on a closed window.";
				Log.e(LCAT, msg);
				throw new IllegalStateException(msg);
			}

			eventListeners.removeListener(eventName, listenerId);
		}
	}

	public void addView(ITitaniumView view)
	{
		TitaniumActivity activity = getActivity();
		if (activity != null) {
			activity.addView(view);
		}
	}

	public ITitaniumView getView(int i) {
		ITitaniumView view = null;
		TitaniumActivity activity = getActivity();
		if (activity != null) {
			view =  activity.getViewAt(i);
		}
		return view;
	}

	public ITitaniumView getViewByName(String name) {
		ITitaniumView view = null;
		TitaniumActivity activity = getActivity();
		if (activity != null) {
			view =  activity.getViewByName(name);
		}
		return view;
	}

	public int getActiveViewIndex() {
		int index = -1;
		TitaniumActivity activity = getActivity();
		if (activity != null) {
			index =  activity.getActiveViewIndex();
		}
		return index;
	}

	public int getViewCount() {
		int count = 0;

		TitaniumActivity activity = getActivity();
		if (activity != null) {
			count =  activity.getViewCount();
		}
		return count;
	}

	public void setActiveViewIndex(int index, String options)
	{
		TitaniumActivity activity = getActivity();
		if (activity != null) {
			activity.setActiveView(index, options);
		}
	}

	public void showView(ITitaniumView tiView, String options) {
		TitaniumActivity activity = getActivity();
		if (activity != null) {
			activity.setActiveView(tiView, options);
		}
	}

	public void onWindowFocusChanged(boolean hasFocus)
	{
		if (hasFocus) {
			if (eventListeners.hasListeners(EVENT_FOCUSED)) {
				eventListeners.invokeSuccessListeners(EVENT_FOCUSED, EVENT_FOCUSED_JSON);
			}
		} else {
			if (eventListeners.hasListeners(EVENT_UNFOCUSED)) {
				eventListeners.invokeSuccessListeners(EVENT_UNFOCUSED, EVENT_UNFOCUSED_JSON);
			}
		}
	}

	/**
	 * This method will return null if the activity has been GC'd.
	 */
	public TitaniumActivity getActivity() {
		TitaniumActivity activity = null;
		TitaniumUI uiModule = softUIModule.get();
		if (uiModule != null) {
			activity = uiModule.getActivity();
		}
		return activity;
	}

	public void onDestroy() {
		TitaniumUI uiModule = softUIModule.get();
		if (uiModule != null) {
			uiModule.removeLifecyleListener(this);
		}

		this.eventListeners.clear();
	}

	public void onPause() {
	}

	public void onResume() {
	}
}

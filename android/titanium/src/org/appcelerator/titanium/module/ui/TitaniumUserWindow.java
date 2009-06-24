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
import org.appcelerator.titanium.config.TitaniumAppInfo;
import org.appcelerator.titanium.config.TitaniumWindowInfo;
import org.appcelerator.titanium.module.TitaniumUI;
import org.appcelerator.titanium.util.TitaniumIntentWrapper;
import org.appcelerator.titanium.util.TitaniumJSEventManager;

import org.appcelerator.titanium.config.TitaniumConfig;
import android.util.Log;

public class TitaniumUserWindow implements ITitaniumUserWindow, ITitaniumLifecycle
{
	private static final String LCAT = "TiUserWindow";
	private static final boolean DBG = TitaniumConfig.LOGD;

	public static final String EVENT_FOCUSED = "focused";
	public static final String EVENT_FOCUSED_JSON = "{type:'" + EVENT_FOCUSED + "'}";
	public static final String EVENT_UNFOCUSED = "unfocused";
	public static final String EVENT_UNFOCUSED_JSON = "{type:'" + EVENT_UNFOCUSED + "'}";

	protected static AtomicInteger activityCounter;
	protected SoftReference<TitaniumUI> softUIModule;

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
		this.softUIModule = new SoftReference<TitaniumUI>(uiModule);
		isOpen = false;
		if (activityCounter == null) {
			activityCounter = new AtomicInteger();
		}

		if (!child) {
			this.eventListeners = new TitaniumJSEventManager(uiModule);
			this.eventListeners.supportEvent(EVENT_FOCUSED);
			this.eventListeners.supportEvent(EVENT_UNFOCUSED);

			uiModule.addLifecycleListener(this);
		}
	}

	public void close() {
		final TitaniumActivity activity = getActivity();
		if (activity != null) {
			activity.runOnUiThread(new Runnable() {

				public void run() {
					activity.finish();				}

				});

			isOpen = false;
		}
	}

	public void open()
	{
		if (isOpen) {
			throw new IllegalStateException("Window is already open.");
		}

		TitaniumActivity activity = getActivity();
		if (activity != null) {
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
		} else {
			if (DBG) {
				Log.d(LCAT, "Activity Reference has been garbage collected");
			}
		}
	}

	public void setWindowId(String windowId) {
		this.windowId = windowId;
	}

	public void setFullscreen(boolean fullscreen) {
		this.fullscreen = fullscreen;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public void setTitleImage(String titleImageUrl) {
		this.titleImageUrl = titleImageUrl;
	}

	public void setUrl(String url) {
		this.url = url;
	}

	public void setType(String type) {
		this.type = type;
	}

	public int addEventListener(String eventName, String listener) {
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
			eventListeners.removeListener(eventName, listenerId);
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
		if (eventListeners.hasListeners(EVENT_UNFOCUSED)) {
			eventListeners.invokeSuccessListeners(EVENT_UNFOCUSED, EVENT_UNFOCUSED_JSON);
		}
	}

	public void onResume() {
		if (eventListeners.hasListeners(EVENT_UNFOCUSED)) {
			eventListeners.invokeSuccessListeners(EVENT_FOCUSED, EVENT_FOCUSED_JSON);
		}
	}
}

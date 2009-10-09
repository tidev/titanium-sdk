/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.module.ui;

import java.lang.ref.WeakReference;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.TitaniumActivity;
import org.appcelerator.titanium.TitaniumApplication;
import org.appcelerator.titanium.api.ITitaniumUserWindowBuilder;
import org.appcelerator.titanium.config.TitaniumAppInfo;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.config.TitaniumWindowInfo;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumIntentWrapper;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Handler;
import android.os.Message;
import android.webkit.URLUtil;

public class TitaniumUserWindowBuilder
	implements ITitaniumUserWindowBuilder, Handler.Callback
{
	private static final String LCAT = "TiUserWindowBuilder";
	private static final boolean DBG = TitaniumConfig.LOGD;

	protected static final int MSG_OPEN = 300;

	protected String windowId;
	protected String title;
	protected String titleImageUrl;
	protected String url;
	protected String type;
	protected boolean fullscreen;
	protected String backgroundColor;
	protected String orientation;

	protected WeakReference<TitaniumActivity> weakActivity;
	protected static AtomicInteger activityCounter;

	protected Handler handler;
	protected boolean isOpen;

	public TitaniumUserWindowBuilder(TitaniumActivity activity)
	{
		this.weakActivity = new WeakReference<TitaniumActivity>(activity);
		isOpen = false;
		handler = new Handler(this);

		if (activityCounter == null) {
			activityCounter = new AtomicInteger();
		}
	}

	public boolean handleMessage(Message msg) {
		switch(msg.what) {
			case MSG_OPEN : {
				TitaniumActivity activity = weakActivity.get();
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
						if (backgroundColor != null) {
							intent.setBackgroundColor(backgroundColor);
						}
						if (orientation != null) {
							intent.setOrientation(orientation);
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
						isOpen = true;
					}
				} else {
					if (DBG) {
						Log.d(LCAT, "Activity Reference has been garbage collected");
					}
				}
				return true;
			} // MSG_OPEN
		}
		return false;
	}

	public void open() {
		handler.obtainMessage(MSG_OPEN).sendToTarget();
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

	public void setWindowId(String windowId) {
		this.windowId = windowId;
	}

	public void setBackgroundColor(String backgroundColor) {
		this.backgroundColor = backgroundColor;
	}

	public void setOrientation(String orientation) {
		this.orientation = orientation;
	}
}

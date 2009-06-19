/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.util;

import java.io.Serializable;

import org.appcelerator.titanium.TitaniumApplication;
import org.appcelerator.titanium.config.TitaniumAppInfo;
import org.appcelerator.titanium.config.TitaniumWindowInfo;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

public class TitaniumIntentWrapper implements Serializable
{
	private static final long serialVersionUID = 1L;

	public static final String ACTIVITY_PREFIX = "TA-";

	public static final String EXTRA_APP_INFO = "appinfo";
	public static final String EXTRA_WINDOW_ID = "windowId";
	public static final String EXTRA_IS_FULLSCREEN = "isFullscreen";
	public static final String EXTRA_ICON_URL = "iconUrl";
	public static final String EXTRA_ACTIVITY_TYPE = "activityType";

	private Intent intent;

	public TitaniumIntentWrapper(Intent intent) {
		if (intent == null) {
			//intent = TitaniumApplication.getAppMgr().createDefaultIntent();
		}
		this.intent = intent;
	}

	public static TitaniumIntentWrapper createUsing(Intent prototype) {
		return createUsing(new TitaniumIntentWrapper(prototype));
	}

	public static TitaniumIntentWrapper createUsing(TitaniumIntentWrapper prototype) {
		TitaniumIntentWrapper result = new TitaniumIntentWrapper(new Intent());
		result.setAppInfoId(prototype.getAppInfoId()); // Same Titanium "context"
		// Set defaults. Can be overwritten after finished.
		result.setFullscreen(false);
		result.setActivityType("single");

		return result;
	}

	public void updateUsing(TitaniumWindowInfo window)
	{
		setWindowId(window.getWindowId());
		setTitle(window.getWindowTitle());
		setData(window.getWindowUrl());
		setActivityType(window.getWindowType());
		setIconUrl(window.getWindowIconUrl());
		//TODO windowsize
		// TODO references
	}

	public Intent getIntent() {
		return intent;
	}

	public String getAppInfoId() {
		return intent.getExtras().getString(EXTRA_APP_INFO);
	}

	public TitaniumAppInfo getAppInfo(Activity activity) {
		return ((TitaniumApplication) activity.getApplication()).getAppInfo();
	}

	public void setAppInfoId(String id) {
		intent.putExtra(EXTRA_APP_INFO, id);
	}

	public TitaniumWindowInfo getWindowInfo(TitaniumAppInfo appInfo) {
		return appInfo.findWindowInfo(getWindowId());
	}

	public String getWindowId() {
		return intent.getExtras().getString(EXTRA_WINDOW_ID);
	}
	public void setWindowId(String id) {
		intent.putExtra(EXTRA_WINDOW_ID, id);
	}

	public boolean isFullscreen() {
		Bundle b = intent.getExtras();
		if (b != null && b.get(EXTRA_IS_FULLSCREEN) != null) {
			return b.getBoolean(EXTRA_IS_FULLSCREEN);
		} else {
			return false;
		}
	}

	public void setFullscreen(boolean fullscreen) {
		intent.putExtra(EXTRA_IS_FULLSCREEN, fullscreen);
	}

	public String getIconUrl() {
		return intent.getExtras().getString(EXTRA_ICON_URL);
	}

	public void setIconUrl(String iconUrl) {
		intent.putExtra(EXTRA_ICON_URL, iconUrl);
	}

	public String getActivityType() {
		return intent.getExtras().getString(EXTRA_ACTIVITY_TYPE);
	}

	public void setActivityType(String activityType) {
		intent.putExtra(EXTRA_ACTIVITY_TYPE, activityType);
	}

	public String getTitle() {
		return intent.getExtras().getString(Intent.EXTRA_TITLE);
	}

	public void setTitle(String title) {
		intent.putExtra(Intent.EXTRA_TITLE, title);
	}

	public Uri getData() {
		return intent.getData();
	}

	public void setData(String url) {
		intent.setData(Uri.parse(url));
	}

	public boolean isAutoNamed() {
		boolean result = true;

		if (getWindowId() != null) {
			result = getWindowId().startsWith(ACTIVITY_PREFIX);
		}
		return result;
	}
}

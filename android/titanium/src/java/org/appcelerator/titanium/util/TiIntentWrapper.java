/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.util;

import java.io.Serializable;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

public class TiIntentWrapper implements Serializable
{
	private static final long serialVersionUID = 1L;

	protected static final String ACTIVITY_PREFIX = "TA-";

	public static final String EXTRA_WINDOW_ID = "windowId";
	public static final String EXTRA_IS_FULLSCREEN = "isFullscreen";
	public static final String EXTRA_ICON_URL = "iconUrl";
	public static final String EXTRA_ACTIVITY_TYPE = "activityType";
	public static final String EXTRA_BACKGROUND_COLOR = "backgroundColor";
	public static final String EXTRA_ORIENTATION = "orientation";
	public static final String EXTRA_BACKGROUND_IMAGE = "backgroundImage";
	public static final String EXTRA_SHOW_ACTIVITY_ON_LOAD = "showActivityOnLoad";

	private Intent intent;

	public TiIntentWrapper(Intent intent) {
		if (intent == null) {
			//intent = TitaniumApplication.getAppMgr().createDefaultIntent();
		}
		this.intent = intent;
	}

	public static TiIntentWrapper createUsing(Intent prototype) {
		return createUsing(new TiIntentWrapper(prototype));
	}

	public static TiIntentWrapper createUsing(TiIntentWrapper prototype) {
		TiIntentWrapper result = new TiIntentWrapper(new Intent());
		// Set defaults. Can be overwritten after finished.
		result.setFullscreen(false);
		result.setActivityType("single");
		result.setShowActivityOnLoad(true);

		return result;
	}

	public static String createActivityName(String name) {
		return ACTIVITY_PREFIX + name;
	}

//	public void updateUsing(TitaniumWindowInfo window)
//	{
//		setWindowId(window.getWindowId());
//		setTitle(window.getWindowTitle());
//		setData(window.getWindowUrl());
//		setActivityType(window.getWindowType());
//		setIconUrl(window.getWindowIconUrl());
//		setBackgroundColor(window.getBackgroundColor());
//		setOrientation(window.getWindowOrientation());
//		setBackgroundImage(window.getWindowBackgroundImage());
//		setShowActivityOnLoad(window.isWindowShowActivityOnLoad());
//		//TODO windowsize
//	}

	public Intent getIntent() {
		return intent;
	}

//	public TitaniumAppInfo getAppInfo(Activity activity) {
//		return ((TitaniumApplication) activity.getApplication()).getAppInfo();
//	}
//
//	public TitaniumWindowInfo getWindowInfo(TitaniumAppInfo appInfo) {
//		return appInfo.findWindowInfo(getWindowId());
//	}

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

	public boolean isShowActivityOnLoad() {
		Bundle b = intent.getExtras();
		if (b != null && b.get(EXTRA_SHOW_ACTIVITY_ON_LOAD) != null) {
			return b.getBoolean(EXTRA_SHOW_ACTIVITY_ON_LOAD);
		} else {
			return true; // default
		}
	}

	public void setShowActivityOnLoad(boolean showActivityOnLoad) {
		intent.putExtra(EXTRA_SHOW_ACTIVITY_ON_LOAD, showActivityOnLoad);
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

	public boolean hasBackgroundColor() {
		return intent.getExtras().containsKey(EXTRA_BACKGROUND_COLOR);
	}

	public int getBackgroundColor() {
		return intent.getExtras().getInt(EXTRA_BACKGROUND_COLOR);
	}
	public void setBackgroundColor(int color) {
		intent.putExtra(EXTRA_BACKGROUND_COLOR, color);
	}
	public void setBackgroundColor(String colorCode) {
		intent.putExtra(EXTRA_BACKGROUND_COLOR, TiColorHelper.parseColor(colorCode));
	}
	public String getOrientation() {
		return intent.getExtras().getString(EXTRA_ORIENTATION);
	}
	public void setOrientation(String orientation) {
		intent.putExtra(EXTRA_ORIENTATION, orientation);
	}

	public boolean hasBackgroundImage() {
		return intent.getExtras().containsKey(EXTRA_BACKGROUND_IMAGE);
	}

	public String getBackgroundImage() {
		return intent.getExtras().getString(EXTRA_BACKGROUND_IMAGE);
	}

	public void setBackgroundImage(String backgroundImage) {
		intent.putExtra(EXTRA_BACKGROUND_IMAGE, backgroundImage);
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

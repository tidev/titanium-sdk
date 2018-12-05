/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiUrl;

import android.graphics.drawable.Drawable;
import android.os.Message;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AppCompatActivity;

@SuppressWarnings("deprecation")
@Kroll.proxy(propertyAccessors = { TiC.PROPERTY_ON_HOME_ICON_ITEM_SELECTED, TiC.PROPERTY_CUSTOM_VIEW })
public class ActionBarProxy extends KrollProxy
{
	private static final String TAG = "ActionBarProxy";

	private ActionBar actionBar;
	private boolean showTitleEnabled = true;

	public ActionBarProxy(AppCompatActivity activity)
	{
		super();
		actionBar = activity.getSupportActionBar();
		// Guard against calls to ActionBar made before inflating the ActionBarView
		if (actionBar != null) {
			actionBar.setDisplayOptions(ActionBar.DISPLAY_USE_LOGO | ActionBar.DISPLAY_SHOW_HOME
										| ActionBar.DISPLAY_SHOW_TITLE);
		} else {
			Log.w(TAG, "Trying to get a reference to ActionBar before its container was inflated.");
		}
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setDisplayHomeAsUp(boolean showHomeAsUp)
	// clang-format on
	{
		if (actionBar != null) {
			actionBar.setDisplayHomeAsUpEnabled(showHomeAsUp);
		} else {
			Log.w(TAG, "ActionBar is not enabled");
		}
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setHomeButtonEnabled(boolean homeButtonEnabled)
	// clang-format on
	{
		if (actionBar != null) {
			actionBar.setHomeButtonEnabled(homeButtonEnabled);
		} else {
			Log.w(TAG, "ActionBar is not enabled");
		}
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setNavigationMode(int navigationMode)
	// clang-format on
	{
		actionBar.setNavigationMode(navigationMode);
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setBackgroundImage(String url)
	// clang-format on
	{
		if (actionBar == null) {
			Log.w(TAG, "ActionBar is not enabled");
			return;
		}

		Drawable backgroundImage = getDrawableFromUrl(url);
		//This is a workaround due to https://code.google.com/p/styled-action-bar/issues/detail?id=3. [TIMOB-12148]
		if (backgroundImage != null) {
			actionBar.setDisplayShowTitleEnabled(!showTitleEnabled);
			actionBar.setDisplayShowTitleEnabled(showTitleEnabled);
			actionBar.setBackgroundDrawable(backgroundImage);
		}
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setTitle(String title)
	// clang-format on
	{
		if (actionBar != null) {
			actionBar.setTitle(title);
		} else {
			Log.w(TAG, "ActionBar is not enabled");
		}
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setSubtitle(String subTitle)
	// clang-format on
	{
		if (actionBar != null) {
			actionBar.setDisplayShowTitleEnabled(true);
			actionBar.setSubtitle(subTitle);
		} else {
			Log.w(TAG, "ActionBar is not enabled");
		}
	}

	@Kroll.method
	public void setDisplayShowHomeEnabled(boolean show)
	{
		if (actionBar != null) {
			actionBar.setDisplayShowHomeEnabled(show);
		}
	}

	@Kroll.method
	public void setDisplayShowTitleEnabled(boolean show)
	{
		if (actionBar != null) {
			actionBar.setDisplayShowTitleEnabled(show);
			showTitleEnabled = show;
		}
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getSubtitle()
	// clang-format on
	{
		if (actionBar == null) {
			return null;
		}
		return (String) actionBar.getSubtitle();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getTitle()
	// clang-format on
	{
		if (actionBar == null) {
			return null;
		}
		return (String) actionBar.getTitle();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getNavigationMode()
	// clang-format on
	{
		if (actionBar == null) {
			return 0;
		}
		return (int) actionBar.getNavigationMode();
	}

	@Kroll.method
	public void show()
	{
		if (actionBar != null) {
			actionBar.show();
		} else {
			Log.w(TAG, "ActionBar is not enabled");
		}
	}

	@Kroll.method
	public void hide()
	{
		if (actionBar != null) {
			actionBar.hide();
		} else {
			Log.w(TAG, "ActionBar is not enabled");
		}
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setLogo(String url)
	// clang-format on
	{
		if (actionBar == null) {
			Log.w(TAG, "ActionBar is not enabled");
			return;
		}

		Drawable logo = getDrawableFromUrl(url);
		if (logo != null) {
			actionBar.setLogo(logo);
		}
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setIcon(String url)
	// clang-format on
	{
		if (actionBar == null) {
			Log.w(TAG, "ActionBar is not enabled");
			return;
		}

		Drawable icon = getDrawableFromUrl(url);
		if (icon != null) {
			actionBar.setIcon(icon);
		}
	}

	private Drawable getDrawableFromUrl(String url)
	{
		TiUrl imageUrl = new TiUrl((String) url);
		TiFileHelper tfh = new TiFileHelper(TiApplication.getInstance());
		return tfh.loadDrawable(imageUrl.resolve(), false);
	}

	@Override
	public void onPropertyChanged(String name, Object value)
	{
		if (TiC.PROPERTY_ON_HOME_ICON_ITEM_SELECTED.equals(name)) {
			// If we have a listener on the home icon item, then enable the home button
			if (actionBar != null) {
				actionBar.setHomeButtonEnabled(true);
			}
		} else if (TiC.PROPERTY_CUSTOM_VIEW.equals(name)) {
			if (actionBar != null) {
				if (value != null) {
					if (value instanceof TiViewProxy) {
						actionBar.setDisplayShowCustomEnabled(true);
						actionBar.setCustomView(((TiViewProxy) value).getOrCreateView().getNativeView());
					} else {
						Log.w(TAG, "Invalid value passed for a custom view. Expected Ti.UI.View or null");
					}
				} else {
					actionBar.setCustomView(null);
				}
			}
		}
		super.onPropertyChanged(name, value);
	}

	@Override
	public String getApiName()
	{
		return "Ti.Android.ActionBar";
	}
}

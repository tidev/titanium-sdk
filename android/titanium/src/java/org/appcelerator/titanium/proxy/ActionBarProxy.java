/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import android.graphics.drawable.Drawable;
import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AppCompatActivity;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;

@SuppressWarnings("deprecation")
@Kroll.proxy(propertyAccessors = { TiC.PROPERTY_ON_HOME_ICON_ITEM_SELECTED, TiC.PROPERTY_CUSTOM_VIEW })
public class ActionBarProxy extends KrollProxy
{
	private static final String TAG = "ActionBarProxy";
	private static final String ACTION_BAR_NOT_AVAILABLE_MESSAGE = "ActionBar is not enabled";

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

	@Kroll.setProperty
	public void setDisplayHomeAsUp(boolean showHomeAsUp)
	{
		if (actionBar != null) {
			actionBar.setDisplayHomeAsUpEnabled(showHomeAsUp);
		} else {
			Log.w(TAG, ACTION_BAR_NOT_AVAILABLE_MESSAGE);
		}
	}

	@Kroll.setProperty
	public void setHomeAsUpIndicator(Object icon)
	{
		if (this.actionBar == null) {
			Log.w(TAG, ACTION_BAR_NOT_AVAILABLE_MESSAGE);
			return;
		}

		if (icon instanceof Number) {
			this.actionBar.setHomeAsUpIndicator(TiConvert.toInt(icon));
		} else if (icon != null) {
			this.actionBar.setHomeAsUpIndicator(TiUIHelper.getResourceDrawable(icon));
		} else {
			this.actionBar.setHomeAsUpIndicator(null);
		}
	}

	@Kroll.setProperty
	public void setHomeButtonEnabled(boolean homeButtonEnabled)
	{
		if (actionBar != null) {
			actionBar.setHomeButtonEnabled(homeButtonEnabled);
		} else {
			Log.w(TAG, ACTION_BAR_NOT_AVAILABLE_MESSAGE);
		}
	}

	@Kroll.setProperty
	public void setNavigationMode(int navigationMode)
	{
		if (actionBar != null) {
			actionBar.setNavigationMode(navigationMode);
		} else {
			Log.w(TAG, ACTION_BAR_NOT_AVAILABLE_MESSAGE);
		}
	}

	@Kroll.setProperty
	public void setBackgroundImage(String url)
	{
		if (actionBar == null) {
			Log.w(TAG, ACTION_BAR_NOT_AVAILABLE_MESSAGE);
			return;
		}

		Drawable backgroundImage = TiUIHelper.getResourceDrawable(url);
		if (backgroundImage != null) {
			// Work-around Android OS bug where you can't change background image unless you update title.
			// See: https://code.google.com/p/styled-action-bar/issues/detail?id=3
			actionBar.setDisplayShowTitleEnabled(!showTitleEnabled);
			actionBar.setDisplayShowTitleEnabled(showTitleEnabled);

			actionBar.setBackgroundDrawable(backgroundImage);
		}
	}

	@Kroll.setProperty
	public void setTitle(String title)
	{
		if (actionBar != null) {
			actionBar.setTitle(title);
		} else {
			Log.w(TAG, ACTION_BAR_NOT_AVAILABLE_MESSAGE);
		}
	}

	@Kroll.setProperty
	public void setSubtitle(String subTitle)
	{
		if (actionBar != null) {
			actionBar.setDisplayShowTitleEnabled(true);
			actionBar.setSubtitle(subTitle);
		} else {
			Log.w(TAG, ACTION_BAR_NOT_AVAILABLE_MESSAGE);
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

	@Kroll.getProperty
	public String getSubtitle()
	{
		if (actionBar == null) {
			return null;
		}
		return (String) actionBar.getSubtitle();
	}

	@Kroll.getProperty
	public String getTitle()
	{
		if (actionBar == null) {
			return null;
		}
		return (String) actionBar.getTitle();
	}

	@Kroll.getProperty
	public int getNavigationMode()
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
			Log.w(TAG, ACTION_BAR_NOT_AVAILABLE_MESSAGE);
		}
	}

	@Kroll.method
	public void hide()
	{
		if (actionBar != null) {
			actionBar.hide();
		} else {
			Log.w(TAG, ACTION_BAR_NOT_AVAILABLE_MESSAGE);
		}
	}

	@Kroll.getProperty
	public boolean getVisible()
	{
		if (this.actionBar == null) {
			return false;
		}
		return this.actionBar.isShowing();
	}

	@Kroll.setProperty
	public void setVisible(boolean value)
	{
		if (value) {
			show();
		} else {
			hide();
		}
	}

	@Kroll.setProperty
	public void setLogo(Object image)
	{
		if (this.actionBar == null) {
			Log.w(TAG, ACTION_BAR_NOT_AVAILABLE_MESSAGE);
			return;
		}

		if (image instanceof Number) {
			this.actionBar.setLogo(TiConvert.toInt(image));
		} else if (image != null) {
			this.actionBar.setLogo(TiUIHelper.getResourceDrawable(image));
		} else {
			this.actionBar.setLogo(null);
		}
	}

	@Kroll.setProperty
	public void setIcon(Object image)
	{
		if (this.actionBar == null) {
			Log.w(TAG, ACTION_BAR_NOT_AVAILABLE_MESSAGE);
			return;
		}

		if (image instanceof Number) {
			this.actionBar.setIcon(TiConvert.toInt(image));
		} else if (image != null) {
			this.actionBar.setIcon(TiUIHelper.getResourceDrawable(image));
		} else {
			this.actionBar.setIcon(null);
		}
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

/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import android.content.Context;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.InsetDrawable;
import android.view.View;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiDrawableReference;

@SuppressWarnings("deprecation")
@Kroll.proxy(propertyAccessors = { TiC.PROPERTY_ON_HOME_ICON_ITEM_SELECTED, TiC.PROPERTY_CUSTOM_VIEW })
public class ActionBarProxy extends KrollProxy
{
	private static final String TAG = "ActionBarProxy";
	private static final String ACTION_BAR_NOT_AVAILABLE_MESSAGE = "ActionBar is not enabled";

	private final Toolbar toolbar;
	private boolean showTitleEnabled = true;

	public ActionBarProxy(AppCompatActivity activity)
	{
		super();
		toolbar = findActionBarToolbar(activity);
	}

	private Toolbar findActionBarToolbar(AppCompatActivity activity)
	{
		if (activity == null) {
			return null;
		}
		int actionBarId = 0;
		try {
			actionBarId = org.appcelerator.titanium.util.TiRHelper.getResource("id.action_bar");
		} catch (Exception e) {
			Log.d(TAG, "Could not find action_bar resource id");
		}
		if (actionBarId != 0) {
			View view = activity.findViewById(actionBarId);
			if (view instanceof Toolbar) {
				return (Toolbar) view;
			}
		}
		return null;
	}

	@Kroll.setProperty
	public void setDisplayHomeAsUp(boolean showHomeAsUp)
	{
		if (toolbar != null) {
			toolbar.setNavigationIcon(getHomeAsUpIcon(showHomeAsUp));
		} else {
			Log.w(TAG, ACTION_BAR_NOT_AVAILABLE_MESSAGE);
		}
	}

	private Drawable getHomeAsUpIcon(boolean showHomeAsUp)
	{
		if (!showHomeAsUp || toolbar == null) {
			return null;
		}
		Context context = toolbar.getContext();
		if (context == null) {
			return null;
		}
		return context.getDrawable(androidx.appcompat.R.drawable.abc_ic_ab_back_material);
	}

	@Kroll.setProperty
	public void setHomeAsUpIndicator(Object icon)
	{
		if (this.toolbar == null) {
			Log.w(TAG, ACTION_BAR_NOT_AVAILABLE_MESSAGE);
			return;
		}
		if (icon instanceof Number) {
			this.toolbar.setNavigationIcon(TiConvert.toInt(icon));
		} else if (icon != null) {
			this.toolbar.setNavigationIcon(TiUIHelper.getResourceDrawable(icon));
		} else {
			this.toolbar.setNavigationIcon(null);
		}
	}

	@Kroll.setProperty
	public void setHomeButtonEnabled(boolean homeButtonEnabled)
	{
		if (toolbar != null) {
			toolbar.setNavigationIcon(homeButtonEnabled ? getHomeAsUpIcon(true) : null);
		} else {
			Log.w(TAG, ACTION_BAR_NOT_AVAILABLE_MESSAGE);
		}
	}

	@Kroll.setProperty
	public void setBackgroundImage(String url)
	{
		if (toolbar == null) {
			Log.w(TAG, ACTION_BAR_NOT_AVAILABLE_MESSAGE);
			return;
		}
		Drawable backgroundImage = TiUIHelper.getResourceDrawable(url);
		if (backgroundImage != null) {
			toolbar.setBackground(backgroundImage);
		} else {
			TiDrawableReference source = TiDrawableReference.fromUrl(this, url);
			if (source.getDrawable() != null) {
				toolbar.setBackground(source.getDrawable());
			} else {
				Log.e(TAG, "Image " + url + " not found");
			}
		}
	}

	@Kroll.method
	public void setDisplayShowHomeEnabled(boolean show)
	{
		if (toolbar != null) {
			if (show) {
				toolbar.setNavigationIcon(getHomeAsUpIcon(true));
			} else {
				toolbar.setNavigationIcon(null);
			}
		}
	}

	@Kroll.method
	public void setDisplayShowTitleEnabled(boolean show)
	{
		if (toolbar != null) {
			toolbar.setTitle(show ? toolbar.getTitle() : "");
			showTitleEnabled = show;
		}
	}

	@Kroll.getProperty
	public String getSubtitle()
	{
		if (toolbar == null) {
			return null;
		}
		CharSequence subtitle = toolbar.getSubtitle();
		return subtitle != null ? subtitle.toString() : null;
	}

	@Kroll.setProperty
	public void setSubtitle(String subTitle)
	{
		if (toolbar != null) {
			toolbar.setSubtitle(subTitle);
		} else {
			Log.w(TAG, ACTION_BAR_NOT_AVAILABLE_MESSAGE);
		}
	}

	@Kroll.getProperty
	public String getTitle()
	{
		if (toolbar == null) {
			return null;
		}
		CharSequence title = toolbar.getTitle();
		return title != null ? title.toString() : null;
	}

	@Kroll.setProperty
	public void setTitle(String title)
	{
		if (toolbar != null) {
			toolbar.setTitle(title);
		} else {
			Log.w(TAG, ACTION_BAR_NOT_AVAILABLE_MESSAGE);
		}
	}

	@Kroll.getProperty
	public int getNavigationMode()
	{
		return 0;
	}

	@Kroll.setProperty
	public void setNavigationMode(int navigationMode)
	{
		Log.w(TAG, "Navigation mode with tabs is not supported. Use Ti.UI.TabGroup instead.");
	}

	@Kroll.method
	public void show()
	{
		if (toolbar != null) {
			toolbar.setVisibility(View.VISIBLE);
		} else {
			Log.w(TAG, ACTION_BAR_NOT_AVAILABLE_MESSAGE);
		}
	}

	@Kroll.method
	public void hide()
	{
		if (toolbar != null) {
			toolbar.setVisibility(View.GONE);
		} else {
			Log.w(TAG, ACTION_BAR_NOT_AVAILABLE_MESSAGE);
		}
	}

	@Kroll.getProperty
	public boolean getVisible()
	{
		if (this.toolbar == null) {
			return false;
		}
		return this.toolbar.getVisibility() == View.VISIBLE;
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
		if (this.toolbar == null) {
			Log.w(TAG, ACTION_BAR_NOT_AVAILABLE_MESSAGE);
			return;
		}
		if (image != null) {
			Drawable logo;
			if (image instanceof Number) {
				logo = TiUIHelper.getResourceDrawable(TiConvert.toInt(image));
			} else {
				logo = TiUIHelper.getResourceDrawable(image);
			}
			logo.setBounds(0, 0, logo.getIntrinsicWidth(), logo.getIntrinsicHeight());
			InsetDrawable insetLogo = new InsetDrawable(logo, 24, 0, 14, 0);
			this.toolbar.setContentInsetsRelative(0, 0);
			this.toolbar.setLogo(insetLogo);
		} else {
			this.toolbar.setLogo(null);
		}
	}

	@Kroll.setProperty
	public void setIcon(Object image)
	{
		if (this.toolbar == null) {
			Log.w(TAG, ACTION_BAR_NOT_AVAILABLE_MESSAGE);
			return;
		}
		if (image instanceof Number) {
			this.toolbar.setNavigationIcon(TiConvert.toInt(image));
		} else if (image != null) {
			this.toolbar.setNavigationIcon(TiUIHelper.getResourceDrawable(image));
		} else {
			this.toolbar.setNavigationIcon(null);
		}
	}

	@Override
	public void onPropertyChanged(String name, Object value)
	{
		if (TiC.PROPERTY_ON_HOME_ICON_ITEM_SELECTED.equals(name)) {
			if (toolbar != null) {
				toolbar.setNavigationIcon(getHomeAsUpIcon(true));
			}
		} else if (TiC.PROPERTY_CUSTOM_VIEW.equals(name)) {
			if (toolbar != null && value != null && value instanceof TiViewProxy) {
				Log.w(TAG, "Use Ti.UI.Toolbar for custom view.");
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

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

import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiDrawableReference;

import java.lang.ref.WeakReference;
import java.util.LinkedHashMap;
import java.util.Map;

@SuppressWarnings("deprecation")
@Kroll.proxy(propertyAccessors = { TiC.PROPERTY_ON_HOME_ICON_ITEM_SELECTED, TiC.PROPERTY_CUSTOM_VIEW })
public class ActionBarProxy extends KrollProxy
{
	private static final String TAG = "ActionBarProxy";
	private static final String ACTION_BAR_NOT_AVAILABLE_MESSAGE = "ActionBar is not enabled";

	// Weak references so a proxy kept alive by JS cannot leak a destroyed activity
	// or its view hierarchy (the toolbar's context is the activity).
	private final WeakReference<AppCompatActivity> activityRef;
	private final WeakReference<Toolbar> toolbarRef;
	private boolean showTitleEnabled = true;

	// Keys for state that is not a Titanium property name.
	private static final String STATE_DISPLAY_HOME_AS_UP = "displayHomeAsUp";
	private static final String STATE_HOME_AS_UP_INDICATOR = "homeAsUpIndicator";
	private static final String STATE_HOME_BUTTON_ENABLED = "homeButtonEnabled";
	private static final String STATE_DISPLAY_SHOW_HOME = "displayShowHomeEnabled";
	private static final String STATE_DISPLAY_SHOW_TITLE = "displayShowTitleEnabled";

	// Values applied via this proxy, in the order they were applied. The activity owning the
	// toolbar is destroyed and recreated on a dark/light theme switch, which drops this proxy.
	// The window proxy survives and uses this state to restore the toolbar on the new activity.
	// The "onHomeIconItemSelected" callback is recorded here too, because assigning it installs
	// the default up arrow. Restoring it out of order would overwrite a later icon setting.
	private final LinkedHashMap<String, Object> appliedState = new LinkedHashMap<>();

	public ActionBarProxy(AppCompatActivity activity)
	{
		super();
		this.activityRef = new WeakReference<>(activity);
		this.toolbarRef = new WeakReference<>(findActionBarToolbar(activity));
	}

	private Toolbar getToolbar()
	{
		return this.toolbarRef.get();
	}

	private void recordState(String key, Object value)
	{
		// Remove first so the key moves to the end. The last applied value must win on restore.
		this.appliedState.remove(key);
		this.appliedState.put(key, value);
	}

	/**
	 * Returns a copy of everything applied via this proxy, so it can be re-applied to the
	 * ActionBarProxy of a recreated activity via restoreState().
	 */
	public Map<String, Object> getStateToRestore()
	{
		return new LinkedHashMap<>(this.appliedState);
	}

	/**
	 * Re-applies state captured by getStateToRestore() from a previous activity's ActionBarProxy.
	 */
	public void restoreState(Map<String, Object> state)
	{
		if (state == null) {
			return;
		}
		for (Map.Entry<String, Object> entry : state.entrySet()) {
			String key = entry.getKey();
			Object value = entry.getValue();
			switch (key) {
				case STATE_DISPLAY_HOME_AS_UP:
					setDisplayHomeAsUp(TiConvert.toBoolean(value));
					break;
				case STATE_HOME_AS_UP_INDICATOR:
					setHomeAsUpIndicator(value);
					break;
				case STATE_HOME_BUTTON_ENABLED:
					setHomeButtonEnabled(TiConvert.toBoolean(value));
					break;
				case STATE_DISPLAY_SHOW_HOME:
					setDisplayShowHomeEnabled(TiConvert.toBoolean(value));
					break;
				case STATE_DISPLAY_SHOW_TITLE:
					setDisplayShowTitleEnabled(TiConvert.toBoolean(value));
					break;
				case TiC.PROPERTY_BACKGROUND_IMAGE:
					setBackgroundImage(TiConvert.toString(value));
					break;
				case TiC.PROPERTY_SUBTITLE:
					setSubtitle(TiConvert.toString(value));
					break;
				case TiC.PROPERTY_TITLE:
					setTitle(TiConvert.toString(value));
					break;
				case TiC.PROPERTY_VISIBLE:
					setVisible(TiConvert.toBoolean(value));
					break;
				case TiC.PROPERTY_LOGO:
					setLogo(value);
					break;
				case TiC.PROPERTY_ICON:
					setIcon(value);
					break;
				case TiC.PROPERTY_ON_HOME_ICON_ITEM_SELECTED:
					setProperty(key, value);
					onPropertyChanged(key, value);
					break;
				default:
					break;
			}
		}
	}

	private ActionBar getSupportActionBar()
	{
		AppCompatActivity activity = this.activityRef.get();
		return (activity != null) ? activity.getSupportActionBar() : null;
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
		recordState(STATE_DISPLAY_HOME_AS_UP, showHomeAsUp);
		Toolbar toolbar = getToolbar();
		if (toolbar != null) {
			toolbar.setNavigationIcon(getHomeAsUpIcon(showHomeAsUp));
		} else {
			Log.w(TAG, ACTION_BAR_NOT_AVAILABLE_MESSAGE);
		}
	}

	private Drawable getHomeAsUpIcon(boolean showHomeAsUp)
	{
		Toolbar toolbar = getToolbar();
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
		recordState(STATE_HOME_AS_UP_INDICATOR, icon);
		Toolbar toolbar = getToolbar();
		if (toolbar == null) {
			Log.w(TAG, ACTION_BAR_NOT_AVAILABLE_MESSAGE);
			return;
		}
		if (icon instanceof Number) {
			toolbar.setNavigationIcon(TiConvert.toInt(icon));
		} else if (icon != null) {
			toolbar.setNavigationIcon(TiUIHelper.getResourceDrawable(icon));
		} else {
			toolbar.setNavigationIcon(null);
		}
	}

	@Kroll.setProperty
	public void setHomeButtonEnabled(boolean homeButtonEnabled)
	{
		recordState(STATE_HOME_BUTTON_ENABLED, homeButtonEnabled);
		Toolbar toolbar = getToolbar();
		if (toolbar != null) {
			toolbar.setNavigationIcon(homeButtonEnabled ? getHomeAsUpIcon(true) : null);
		} else {
			Log.w(TAG, ACTION_BAR_NOT_AVAILABLE_MESSAGE);
		}
	}

	@Kroll.setProperty
	public void setBackgroundImage(String url)
	{
		recordState(TiC.PROPERTY_BACKGROUND_IMAGE, url);
		Toolbar toolbar = getToolbar();
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
		recordState(STATE_DISPLAY_SHOW_HOME, show);
		Toolbar toolbar = getToolbar();
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
		recordState(STATE_DISPLAY_SHOW_TITLE, show);
		Toolbar toolbar = getToolbar();
		if (toolbar != null) {
			toolbar.setTitle(show ? toolbar.getTitle() : "");
			showTitleEnabled = show;
		}
	}

	@Kroll.getProperty
	public String getSubtitle()
	{
		Toolbar toolbar = getToolbar();
		if (toolbar == null) {
			return null;
		}
		CharSequence subtitle = toolbar.getSubtitle();
		return subtitle != null ? subtitle.toString() : null;
	}

	@Kroll.setProperty
	public void setSubtitle(String subTitle)
	{
		recordState(TiC.PROPERTY_SUBTITLE, subTitle);
		Toolbar toolbar = getToolbar();
		if (toolbar != null) {
			toolbar.setSubtitle(subTitle);
		} else {
			Log.w(TAG, ACTION_BAR_NOT_AVAILABLE_MESSAGE);
		}
	}

	@Kroll.getProperty
	public String getTitle()
	{
		Toolbar toolbar = getToolbar();
		if (toolbar == null) {
			return null;
		}
		CharSequence title = toolbar.getTitle();
		return title != null ? title.toString() : null;
	}

	@Kroll.setProperty
	public void setTitle(String title)
	{
		recordState(TiC.PROPERTY_TITLE, title);
		Toolbar toolbar = getToolbar();
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
		recordState(TiC.PROPERTY_VISIBLE, true);
		// Show via ActionBar so the decor's ActionBarContainer becomes visible again,
		// not just the Toolbar child within it.
		ActionBar actionBar = getSupportActionBar();
		Toolbar toolbar = getToolbar();
		if (actionBar != null) {
			actionBar.show();
		} else if (toolbar != null) {
			toolbar.setVisibility(View.VISIBLE);
		} else {
			Log.w(TAG, ACTION_BAR_NOT_AVAILABLE_MESSAGE);
		}
	}

	@Kroll.method
	public void hide()
	{
		recordState(TiC.PROPERTY_VISIBLE, false);
		// Hide via ActionBar so the decor's ActionBarContainer is hidden as a whole.
		// Hiding only the Toolbar child leaves the container behind as a transparent
		// bar-height strip that still casts its elevation shadow.
		ActionBar actionBar = getSupportActionBar();
		Toolbar toolbar = getToolbar();
		if (actionBar != null) {
			actionBar.hide();
		} else if (toolbar != null) {
			toolbar.setVisibility(View.GONE);
		} else {
			Log.w(TAG, ACTION_BAR_NOT_AVAILABLE_MESSAGE);
		}
	}

	@Kroll.getProperty
	public boolean getVisible()
	{
		ActionBar actionBar = getSupportActionBar();
		if (actionBar != null) {
			return actionBar.isShowing();
		}
		Toolbar toolbar = getToolbar();
		if (toolbar == null) {
			return false;
		}
		return toolbar.getVisibility() == View.VISIBLE;
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
		recordState(TiC.PROPERTY_LOGO, image);
		Toolbar toolbar = getToolbar();
		if (toolbar == null) {
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
			toolbar.setContentInsetsRelative(0, 0);
			toolbar.setLogo(insetLogo);
		} else {
			toolbar.setLogo(null);
		}
	}

	@Kroll.setProperty
	public void setIcon(Object image)
	{
		recordState(TiC.PROPERTY_ICON, image);
		Toolbar toolbar = getToolbar();
		if (toolbar == null) {
			Log.w(TAG, ACTION_BAR_NOT_AVAILABLE_MESSAGE);
			return;
		}
		if (image instanceof Number) {
			toolbar.setNavigationIcon(TiConvert.toInt(image));
		} else if (image != null) {
			toolbar.setNavigationIcon(TiUIHelper.getResourceDrawable(image));
		} else {
			toolbar.setNavigationIcon(null);
		}
	}

	@Override
	public void onPropertyChanged(String name, Object value)
	{
		Toolbar toolbar = getToolbar();
		if (TiC.PROPERTY_ON_HOME_ICON_ITEM_SELECTED.equals(name)) {
			recordState(name, value);
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

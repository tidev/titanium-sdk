/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiUrl;

import android.app.ActionBar;
import android.app.Activity;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.os.Message;

@Kroll.proxy(propertyAccessors = {
	TiC.PROPERTY_ON_HOME_ICON_ITEM_SELECTED
})
public class ActionBarProxy extends KrollProxy
{
	private static final int MSG_FIRST_ID = KrollProxy.MSG_LAST_ID + 1;
	private static final int MSG_DISPLAY_HOME_AS_UP = MSG_FIRST_ID + 100;
	private static final int MSG_SET_BACKGROUND_IMAGE = MSG_FIRST_ID + 101;
	private static final int MSG_SET_TITLE = MSG_FIRST_ID + 102;
	private static final int MSG_SHOW = MSG_FIRST_ID + 103;
	private static final int MSG_HIDE = MSG_FIRST_ID + 104;
	private static final int MSG_SET_LOGO = MSG_FIRST_ID + 105;
	private static final int MSG_SET_ICON = MSG_FIRST_ID + 106;

	private static final String SHOW_HOME_AS_UP = "showHomeAsUp";
	private static final String BACKGROUND_IMAGE = "backgroundImage";
	private static final String TITLE = "title";
	private static final String LOGO = "logo";
	private static final String ICON = "icon";

	private ActionBar actionBar;

	public ActionBarProxy(Activity activity)
	{
		super();
		actionBar = activity.getActionBar();
	}

	@Kroll.method @Kroll.setProperty
	public void setDisplayHomeAsUp(boolean showHomeAsUp)
	{
		if(TiApplication.isUIThread()) {
			handlesetDisplayHomeAsUp(showHomeAsUp);
		} else {
			Message message = getMainHandler().obtainMessage(MSG_DISPLAY_HOME_AS_UP, showHomeAsUp);
			message.getData().putBoolean(SHOW_HOME_AS_UP, showHomeAsUp);
			message.sendToTarget();
		}
	}

	@Kroll.method @Kroll.setProperty
	public void setBackgroundImage(String url)
	{
		if (TiApplication.isUIThread()) {
			handleSetBackgroundImage(url);
		} else {
			Message message = getMainHandler().obtainMessage(MSG_SET_BACKGROUND_IMAGE, url);
			message.getData().putString(BACKGROUND_IMAGE, url);
			message.sendToTarget();
		}
	}

	@Kroll.method @Kroll.setProperty
	public void setTitle(String title)
	{
		if (TiApplication.isUIThread()) {
			handleSetTitle(title);
		} else {
			Message message = getMainHandler().obtainMessage(MSG_SET_TITLE, title);
			message.getData().putString(TITLE, title);
			message.sendToTarget();
		}
	}

	@Kroll.method @Kroll.getProperty
	public String getTitle()
	{
		return (String) actionBar.getTitle();
	}

	@Kroll.method
	public void show()
	{
		if (TiApplication.isUIThread()) {
			handleShow();
		} else {
			getMainHandler().obtainMessage(MSG_SHOW).sendToTarget();
		}
	}

	@Kroll.method
	public void hide()
	{
		if (TiApplication.isUIThread()) {
			handleHide();
		} else {
			getMainHandler().obtainMessage(MSG_HIDE).sendToTarget();
		}
	}

	@Kroll.method @Kroll.setProperty
	public void setLogo(String url)
	{
		if (Build.VERSION.SDK_INT >= TiC.API_LEVEL_ICE_CREAM_SANDWICH) {
			if (TiApplication.isUIThread()) {
				handleSetLogo(url);
			} else {
				Message message = getMainHandler().obtainMessage(MSG_SET_LOGO, url);
				message.getData().putString(LOGO, url);
				message.sendToTarget();
			}
		}
	}

	@Kroll.method @Kroll.setProperty
	public void setIcon(String url)
	{
		if (Build.VERSION.SDK_INT >= TiC.API_LEVEL_ICE_CREAM_SANDWICH) {
			if (TiApplication.isUIThread()) {
				handleSetIcon(url);
			} else {
				Message message = getMainHandler().obtainMessage(MSG_SET_ICON, url);
				message.getData().putString(ICON, url);
				message.sendToTarget();
			}
		}
	}

	private void handleSetIcon(String url)
	{
		Drawable icon = getDrawableFromUrl(url);
		if (icon != null) {
			actionBar.setIcon(icon);
		}
	}

	private void handleSetTitle(String title)
	{
		actionBar.setTitle(title);
	}

	private void handleShow()
	{
		actionBar.show();
	}

	private void handleHide()
	{
		actionBar.hide();
	}

	private void handleSetBackgroundImage(String url)
	{
		Drawable backgroundImage = getDrawableFromUrl(url);
		if (backgroundImage != null) {
			actionBar.setBackgroundDrawable(backgroundImage);
		}
	}

	private void handlesetDisplayHomeAsUp(boolean showHomeAsUp)
	{
		actionBar.setDisplayHomeAsUpEnabled(showHomeAsUp);
	}

	private void handleSetLogo(String url)
	{
		Drawable logo = getDrawableFromUrl(url);
		if (logo != null) {
			actionBar.setLogo(logo);
		}
	}

	private Drawable getDrawableFromUrl(String url)
	{
		TiUrl imageUrl = new TiUrl((String) url);
		TiFileHelper tfh = new TiFileHelper(TiApplication.getInstance());
		return tfh.loadDrawable(imageUrl.resolve(), false);
	}

	@Override
	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_DISPLAY_HOME_AS_UP:
				handlesetDisplayHomeAsUp(msg.getData().getBoolean(SHOW_HOME_AS_UP));
				return true;
			case MSG_SET_BACKGROUND_IMAGE:
				handleSetBackgroundImage(msg.getData().getString(BACKGROUND_IMAGE));
				return true;
			case MSG_SET_TITLE:
				handleSetTitle(msg.getData().getString(TITLE));
				return true;
			case MSG_SHOW:
				handleShow();
				return true;
			case MSG_HIDE:
				handleHide();
				return true;
			case MSG_SET_LOGO:
				handleSetLogo(msg.getData().getString(LOGO));
				return true;
			case MSG_SET_ICON:
				handleSetIcon(msg.getData().getString(ICON));
				return true;
		}
		return super.handleMessage(msg);
	}

	@Override
	public void onPropertyChanged(String name, Object value)
	{
		if (Build.VERSION.SDK_INT >= TiC.API_LEVEL_ICE_CREAM_SANDWICH
			&& TiC.PROPERTY_ON_HOME_ICON_ITEM_SELECTED.equals(name)) {
			// If we have a listener on the home icon item, then enable the home button (we need to do this for ICS and
			// above)
			actionBar.setHomeButtonEnabled(true);
		}
		super.onPropertyChanged(name, value);
	}

}
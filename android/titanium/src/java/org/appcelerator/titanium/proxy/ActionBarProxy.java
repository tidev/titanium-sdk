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
import android.os.Message;

@Kroll.proxy(propertyAccessors = {
	TiC.PROPERTY_ON_HOME_ICON_ITEM_SELECTED
})
public class ActionBarProxy extends KrollProxy
{
	private static final int MSG_FIRST_ID = KrollProxy.MSG_LAST_ID + 1;
	private static final int MSG_DISPLAY_HOME_AS_UP = MSG_FIRST_ID + 100;
	private static final int MSG_SET_BACKGROUND_IMAGE = MSG_FIRST_ID + 101;

	private static final String SHOW_HOME_AS_UP = "showHomeAsUp";
	private static final String BACKGROUND_IMAGE = "backgroundImage";

	private ActionBar actionBar;
	
	public ActionBarProxy(Activity activity)
	{
		actionBar = activity.getActionBar();
	}

	@Kroll.method
	public void setDisplayHomeAsUp(boolean showHomeAsUp)
	{
		if(TiApplication.isUIThread()) {
			handleSetDisplayHomeAsUpEnabled(showHomeAsUp);
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

	private void handleSetBackgroundImage(String url)
	{
		Drawable backgroundImage = getDrawableFromUrl(url);
		if (backgroundImage != null) {
			actionBar.setBackgroundDrawable(backgroundImage);
		}
	}

	private void handleSetDisplayHomeAsUpEnabled(boolean showHomeAsUp)
	{
		actionBar.setDisplayHomeAsUpEnabled(showHomeAsUp);
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
				handleSetDisplayHomeAsUpEnabled(msg.getData().getBoolean(SHOW_HOME_AS_UP));
				return true;
			case MSG_SET_BACKGROUND_IMAGE:
				handleSetBackgroundImage(msg.getData().getString(BACKGROUND_IMAGE));
				return true;
		}
		return super.handleMessage(msg);
	}

}
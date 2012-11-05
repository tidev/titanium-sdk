/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;

import android.app.ActionBar;
import android.app.Activity;

@Kroll.proxy(propertyAccessors = {
	TiC.PROPERTY_ON_APP_ICON_ITEM_SELECTED
})
public class ActionBarProxy extends KrollProxy
{
	private ActionBar actionBar;
	
	public ActionBarProxy(Activity activity)
	{
		actionBar = activity.getActionBar();
	}
	
}
/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.ActivityProxy;
import org.appcelerator.titanium.proxy.MenuItemProxy;
import org.appcelerator.titanium.proxy.MenuProxy;

import android.view.Menu;
import android.view.MenuItem;

public class TiMenuSupport
{
	protected MenuProxy menuProxy;
	protected ActivityProxy activityProxy;

	public TiMenuSupport(ActivityProxy activityProxy)
	{
		this.activityProxy = activityProxy;
	}

	public boolean onCreateOptionsMenu(boolean created, Menu menu)
	{
		KrollFunction onCreate = (KrollFunction) activityProxy.getProperty(TiC.PROPERTY_ON_CREATE_OPTIONS_MENU);
		KrollFunction onPrepare = (KrollFunction) activityProxy.getProperty(TiC.PROPERTY_ON_PREPARE_OPTIONS_MENU);
		if (onCreate != null) {
			KrollDict event = new KrollDict();
			if (menuProxy != null) {
				if (!menuProxy.getMenu().equals(menu)) {
					menuProxy.setMenu(menu);
				}
			} else {
				menuProxy = new MenuProxy(menu);
			}
			event.put(TiC.EVENT_PROPERTY_MENU, menuProxy);
			onCreate.call(activityProxy.getKrollObject(), new Object[] { event });
		}
		// If a callback exists then return true.
		// There is no need for the Ti Developer to support both methods.
		if (onCreate != null || onPrepare != null) {
			created = true;
		}
		return created;
	}

	public boolean onOptionsItemSelected(MenuItem item)
	{
		// menuProxy could be null in the case
		// where developer has targeted sdk 11 or higher,
		// not specified any menu/action bar, has a
		// heavyweight window and the user clicks the
		// auto-generated ActionBar.
		if (menuProxy == null) {
			return false;
		}

		MenuItemProxy mip = menuProxy.findItem(item);
		if (mip != null) {
			mip.fireEvent(TiC.EVENT_CLICK, null);
			return true;
		}
		return false;
	}

	public boolean onPrepareOptionsMenu(boolean prepared, Menu menu)
	{
		KrollFunction onPrepare = (KrollFunction) activityProxy.getProperty(TiC.PROPERTY_ON_PREPARE_OPTIONS_MENU);
		if (onPrepare != null) {
			KrollDict event = new KrollDict();
			if (menuProxy != null) {
				if (!menuProxy.getMenu().equals(menu)) {
					menuProxy.setMenu(menu);
				}
			} else {
				menuProxy = new MenuProxy(menu);
			}
			event.put(TiC.EVENT_PROPERTY_MENU, menuProxy);
			onPrepare.call(activityProxy.getKrollObject(), new Object[] { event });
		}
		prepared = true;
		return prepared;
	}

	public void destroy()
	{
		if (menuProxy != null) {
			menuProxy.release();
			menuProxy = null;
		}
		activityProxy = null;
	}
}

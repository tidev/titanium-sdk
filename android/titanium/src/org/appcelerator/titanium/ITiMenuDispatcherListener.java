/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import android.view.Menu;
import android.view.MenuItem;

public interface ITiMenuDispatcherListener
{
	public boolean dispatchHasMenu();
	boolean dispatchMenuItemSelected(MenuItem item);
	public boolean dispatchPrepareMenu(Menu menu);
}

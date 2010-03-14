/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.view;

import org.appcelerator.titanium.view.TiCompositeLayout.LayoutParams;

import android.view.View;

public interface ITiWindowHandler
{
	public void addWindow(View v, LayoutParams params);
	public void removeWindow(View v);
}

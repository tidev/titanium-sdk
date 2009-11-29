/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.api;

import android.content.res.Configuration;
import android.view.Menu;
import android.view.MenuItem;

public interface ITitaniumUserWindow extends ITitaniumUserWindowBuilder
{
	public void close();
	public int addEventListener(String eventName, String listener);
	public void removeEventListener(String eventName, int listenerId);

	// new in 0.6.0

	//public void addView(ITitaniumView view);
	public void setActiveViewIndex(int index, String options);
	public void showViewByKey(String key, String options);
	public void showView(ITitaniumView view, String options);
	public int getViewCount();
	public String getViewKey(int i);
	public ITitaniumView getViewByName(String name);
	public int getActiveViewIndex();
	public String getViewName(String key);

	// new in 0.7.0 due to refactor
	public void dispatchTabChange(String data);
	public void dispatchConfigurationChange(Configuration newConfig);
	public boolean dispatchPrepareOptionsMenu(Menu menu);
	public boolean dispatchOptionsItemSelected(MenuItem item);
	public void fireEvent(String eventName, String eventData);
	public void registerView(ITitaniumView view);
    public ITitaniumView getViewFromKey(String key);
	public void onWindowFocusChanged(boolean hasFocus);

	// In 0.8.0
	void addView(String key);
	void dispatchLoad(String url);
}

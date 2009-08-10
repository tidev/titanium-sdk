/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.api;

public interface ITitaniumUserWindow
{
	public void setWindowId(String windowId);
	public void setUrl(String url);
	public void setTitle(String title);
	public void setTitleImage(String titleImageUrl);
	public void setFullscreen(boolean fullscreen);
	public void setType(String type);
	public void open();
	public void close();
	public int addEventListener(String eventName, String listener);
	public void removeEventListener(String eventName, int listenerId);

	// new in 0.6.0

	public void addView(ITitaniumView view);
	public void setActiveViewIndex(int index, String options);
	public void showViewByKey(String key, String options);
	public void showView(ITitaniumView view, String options);
	public int getViewCount();
	public String getViewKey(int i);
	public ITitaniumView getViewByName(String name);
	public int getActiveViewIndex();

	public String getViewName(String key);
	public int addViewEventListener(String key, String eventName, String listener);
	public void removeEventListener(String key, String eventName, int listenerId);
}

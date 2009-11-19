/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.api;

public interface ITitaniumUserWindowBuilder
{
	public void setWindowId(String windowId);
	public void setUrl(String url);
	public void setTitle(String title);
	public void setTitleImage(String titleImageUrl);
	public void setFullscreen(boolean fullscreen);
	public void setOrientation(String orientation);
	public void open();

	// Added in 0.7.0
	public void setBackgroundColor(String backgroundColor);

	// Added in 0.7.1
	public void setBackgroundImage(String backgroundImage);

	// Added in 0.8.0
	public void setActivityIndicator(boolean showActivity);
}

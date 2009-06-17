/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.api;

import org.appcelerator.titanium.TitaniumActivity;

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

	// Internal
	public TitaniumActivity getActivity();
}

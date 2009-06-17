/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.api;

public interface ITitaniumNotifier
{
	public void setTitle(String title);
	public void setMessage(String message);
	public void setIcon(String iconUrl);
	public void setDelay(int delay);
	public void addEventListener(String eventName, String listener);
	public void show(boolean animate, boolean autohide);
	public void hide(boolean animate);
}

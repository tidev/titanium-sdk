/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.api;

import android.os.Bundle;

public interface ITitaniumNativeControl
{
	// Used externally
	public int addEventListener(String eventName, String listener);
	public void removeEventListener(String eventName, int listenerId);

	public void focus();
	public void blur();

	// Used internally
	public void open();
	public String getHtmlId();
	public void handleLayoutRequest(Bundle position);
	public void setOptions(String json);
}

/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.api;

import android.webkit.WebView;

public interface ITitaniumModule extends ITitaniumLifecycle
{
	public String getModuleName();
	public void register(WebView webView);
}

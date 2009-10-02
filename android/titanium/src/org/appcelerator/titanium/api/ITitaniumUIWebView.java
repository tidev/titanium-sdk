/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.api;

import org.appcelerator.titanium.TitaniumWebView;
import org.appcelerator.titanium.TitaniumWebView.OnConfigChange;

import android.webkit.WebView;

public interface ITitaniumUIWebView {
	public void setUrl(String url);
	public WebView getWebView();
	public TitaniumWebView getTitaniumWebView();
	public void addConfigChangeListener(OnConfigChange listener);
	public void removeConfigChangeListener(OnConfigChange listener);

	public int addWindowEventListener(String eventName, String eventListener);
	public void removeWindowEventListener(String eventName, int listenerId);
}

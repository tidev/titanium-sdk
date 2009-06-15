package org.appcelerator.titanium.api;

import android.webkit.WebView;

public interface ITitaniumModule extends ITitaniumLifecycle
{
	public String getModuleName();
	public void register(WebView webView);
}

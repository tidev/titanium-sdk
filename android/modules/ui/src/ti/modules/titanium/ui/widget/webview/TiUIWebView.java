/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.webview;

import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.WebViewProxy;
import android.net.Uri;
import android.webkit.WebSettings;
import android.webkit.WebView;

public class TiUIWebView extends TiUIView {

	public TiUIWebView(TiViewProxy proxy)
	{
		super(proxy);
		getLayoutParams().autoFillsHeight = true;
		getLayoutParams().autoFillsWidth = true;
		
		WebView webView = new WebView(proxy.getContext());
		webView.setVerticalScrollbarOverlay(true);
		
		WebSettings settings = webView.getSettings();
		settings.setJavaScriptEnabled(true);
		settings.setSupportMultipleWindows(true);
		settings.setJavaScriptCanOpenWindowsAutomatically(true);
		settings.setSupportZoom(true);
		settings.setLoadsImagesAutomatically(true);
		settings.setLightTouchEnabled(true);
		
		webView.setWebChromeClient(new TiWebChromeClient(this));
		webView.setWebViewClient(new TiWebViewClient((WebViewProxy)proxy));
		
		setNativeView(webView);
	}
	
	protected WebView getWebView()
	{
		return (WebView)getNativeView();
	}
	
	public void setUrl(String url)
	{
		Uri uri = Uri.parse(url);
		if (uri.getScheme() != null) {
			//TODO bind our variables
			getWebView().loadUrl(url);
		} else {
			String resolvedUrl = getProxy().getTiContext().resolveUrl(null, url);
			getWebView().loadUrl(resolvedUrl);
		}	
	}
	
	public void setHtml(String html)
	{
		getWebView().loadData(html, "text/html", "utf-8");
	}
}

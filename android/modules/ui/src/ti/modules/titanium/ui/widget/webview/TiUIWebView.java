/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.webview;

import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiMimeTypeHelper;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.WebViewProxy;
import android.graphics.Color;
import android.net.Uri;
import android.text.style.BackgroundColorSpan;
import android.webkit.URLUtil;
import android.webkit.WebSettings;
import android.webkit.WebView;

public class TiUIWebView extends TiUIView {

	private TiWebViewBinding binding;
	private TiWebViewClient client;

	public TiUIWebView(TiViewProxy proxy)
	{
		super(proxy);

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
		client = new TiWebViewClient((WebViewProxy)proxy, webView);
		webView.setWebViewClient(client);

		//binding = new TiWebViewBinding(proxy.getTiContext(), webView);
		TiCompositeLayout.LayoutParams params = getLayoutParams();
		params.autoFillsHeight = true;
		params.autoFillsWidth = true;
		setNativeView(webView);
	}

	protected WebView getWebView()
	{
		return (WebView)getNativeView();
	}

	@Override
	public void processProperties(TiDict d) {
		super.processProperties(d);

		if (d.containsKey("url")) {
			setUrl(TiConvert.toString(d, "url"));
		} else if (d.containsKey("html")) {
			setHtml(TiConvert.toString(d, "html"));
		} else if (d.containsKey("data")) {
			Object value = d.get("data");
			if (value instanceof TiBlob) {
				setData((TiBlob)value);
			}
		}
		if (d.containsKey("backgroundColor")) {
			nativeView.setBackgroundColor(Color.TRANSPARENT);
		}
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, TiProxy proxy) {
		if ("url".equals(key)) {
			setUrl(TiConvert.toString(newValue));
		} else if ("html".equals(key)) {
			setHtml(TiConvert.toString(newValue));
		} else if ("data".equals(key)) {
			if (newValue instanceof TiBlob) {
				setData((TiBlob)newValue);
			}
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
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

	public void setData(TiBlob blob)
	{
		String mimeType = "text/html";
		if (blob.getMimeType() != null) {
			mimeType = blob.getMimeType();
		}
		if (TiMimeTypeHelper.isBinaryMimeType(mimeType)) {
			getWebView().loadData(blob.toBase64(), mimeType, "base64");
		} else {
			getWebView().loadData(new String(blob.getBytes()), mimeType, "utf-8");
		}
	}

	public String getJSValue(String expression)
	{
		return client.getBinding().getJSValue(expression);
	}
}

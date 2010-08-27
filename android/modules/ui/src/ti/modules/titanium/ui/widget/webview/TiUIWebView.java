/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.webview;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiMimeTypeHelper;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;

import android.content.Context;
import android.net.Uri;
import android.webkit.WebSettings;
import android.webkit.WebView;

public class TiUIWebView extends TiUIView {

	private static final String LCAT = "TiUIWebView";
	private TiWebViewBinding binding;
	private TiWebViewClient client;
	private boolean changingUrl = false;

	private class TiWebView extends WebView {
		public TiWebViewClient client;
		public TiWebView(Context context) {
			super(context);
		}

		@Override
		public void destroy() {
			if (client != null) {
				client.getBinding().destroy();
			}
			super.destroy();
		}
	}

	public TiUIWebView(TiViewProxy proxy)
	{
		super(proxy);

		TiWebView webView = new TiWebView(proxy.getContext());
		webView.setVerticalScrollbarOverlay(true);

		WebSettings settings = webView.getSettings();
		settings.setJavaScriptEnabled(true);
		settings.setSupportMultipleWindows(true);
		settings.setJavaScriptCanOpenWindowsAutomatically(true);
		settings.setSupportZoom(true);
		settings.setLoadsImagesAutomatically(true);
		settings.setLightTouchEnabled(true);

		webView.setWebChromeClient(new TiWebChromeClient(this));
		client = new TiWebViewClient(this, webView);
		webView.setWebViewClient(client);
		webView.client = client;

		//binding = new TiWebViewBinding(proxy.getTiContext(), webView);
		TiCompositeLayout.LayoutParams params = getLayoutParams();
		params.autoFillsHeight = true;
		params.autoFillsWidth = true;

		setNativeView(webView);
	}

	public WebView getWebView()
	{
		return (WebView)getNativeView();
	}

	@Override
	public void processProperties(KrollDict d) {
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
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy) {
		if ("url".equals(key) && !changingUrl) {
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

	public void changeProxyUrl(String url) {
		changingUrl = true;
		getProxy().setDynamicValue("url", url);
		changingUrl = false;
	}

	public String getUrl() {
		return getWebView().getUrl();
	}

	private static final char escapeChars[] = new char[]{ '%', '#', '\'', '?'};
	private String escapeContent(String content)
	{
		// The Android WebView has a known bug
		// where it forgets to escape certain characters
		// when it creates a data:// URL in the loadData() method
		// http://code.google.com/p/android/issues/detail?id=1733
		for (char escapeChar : escapeChars) {
			String regex = "\\"+escapeChar;
			content = content.replaceAll(regex, "%"+Integer.toHexString(escapeChar));
		}
		return content;
	}

	public void setHtml(String html)
	{
		//getWebView().loadData(escapeContent(html), "text/html", "utf-8");
		// Commented out the loadData solution. You can't access local assets without
		// providing an acceptable base url to loadDataWithBaseURL. Using the contentEscaping
		// breaks the document and munges the quotes causing images to fail. Images in local
		// html should be absolute or relative to app:// if you want to use app url's, they
		// need to be translated before setting html or setting a document change trigger.
		// I've enclosed the code used in the old 0.X codebase for reference
		//
		// Use this code to post process your document to adjust URLs. May need updating it comes
		// from ti.js in the old 0.X method.
		//
		// 		var imgs = document.getElementsByTagName('img');
		// 		for(i=0; i < imgs.length;i++) {
		// 			var s = imgs[i].src;
		// 			//alert('BEFORE: ' + s);
		// 			if (s.indexOf('file:///') === 0) {
		// 				if (s.indexOf('file:///sdcard/') == -1 && s.indexOf('file:///android_asset') == -1) {
		// 					imgs[i].src = s.substring(8);
		// 				}
		// 			} else if (s.indexOf('app://') === 0) {
		// 				imgs[i].src = s.substring(6);
		// 			}
		//
		// 			//alert('AFTER: ' + imgs[i].src);
		// 		}


		getWebView().loadDataWithBaseURL("file:///android_asset/Resources/", html, "text/html", "utf-8", null);
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
			getWebView().loadData(escapeContent(new String(blob.getBytes())), mimeType, "utf-8");
		}
	}

	public String getJSValue(String expression)
	{
		return client.getBinding().getJSValue(expression);
	}

	public void setBasicAuthentication(String username, String password) {
		client.setBasicAuthentication(username, password);
	}

	@Override
	protected boolean allowRegisterForTouch() {
		return false;
	}

	public boolean canGoBack() {
		return getWebView().canGoBack();
	}
	
	public boolean canGoForward() {
		return getWebView().canGoForward();
	}
	
	public void goBack() {
		getWebView().goBack();
	}
	
	public void goForward() {
		getWebView().goForward();
	}
	
	public void reload() {
		getWebView().reload();
	}
	
	public void stopLoading() {
		getWebView().stopLoading();
	}
}

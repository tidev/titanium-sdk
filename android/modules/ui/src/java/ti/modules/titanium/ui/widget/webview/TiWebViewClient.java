/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.webview;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;

import ti.modules.titanium.media.TiVideoActivity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.net.http.SslError;
import android.webkit.HttpAuthHandler;
import android.webkit.MimeTypeMap;
import android.webkit.SslErrorHandler;
import android.webkit.URLUtil;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class TiWebViewClient extends WebViewClient
{
	private static final String TAG = "TiWVC";

	private TiUIWebView webView;
	private TiWebViewBinding binding;
	private String username, password;

	public TiWebViewClient(TiUIWebView tiWebView, WebView webView)
	{
		super();
		this.webView = tiWebView;
		binding = new TiWebViewBinding(webView);
	}

	@Override
	public void onPageFinished(WebView view, String url)
	{
		super.onPageFinished(view, url);

		webView.changeProxyUrl(url);
		KrollDict data = new KrollDict();
		data.put("url", url);
		webView.getProxy().fireEvent("load", data);
		WebView nativeWebView = webView.getWebView();

		if (nativeWebView != null) {
			if (webView.shouldInjectBindingCode()) {
				webView.getWebView().loadUrl("javascript:" + TiWebViewBinding.INJECTION_CODE);
			}
			webView.getWebView().loadUrl("javascript:" + TiWebViewBinding.POLLING_CODE);
		}
	}

	public TiWebViewBinding getBinding()
	{
		return binding;
	}

	@Override
	public void onPageStarted(WebView view, String url, Bitmap favicon)
	{
		super.onPageStarted(view, url, favicon);

		KrollDict data = new KrollDict();
		data.put("url", url);
		webView.getProxy().fireEvent("beforeload", data);
	}

	@Override
	public void onReceivedError(WebView view, int errorCode, String description, String failingUrl)
	{
		super.onReceivedError(view, errorCode, description, failingUrl);

		KrollDict data = new KrollDict();
		data.put("url", failingUrl);
		data.put("errorCode", errorCode);
		data.put("message", description);
		webView.getProxy().fireEvent("error", data);

	}

	@Override
	public boolean shouldOverrideUrlLoading(final WebView view, String url)
	{
		Log.d(TAG, "url=" + url, Log.DEBUG_MODE);

		if (URLUtil.isAssetUrl(url) || URLUtil.isContentUrl(url) || URLUtil.isFileUrl(url)) {
			// go through the proxy to ensure we're on the UI thread
			webView.getProxy().setPropertyAndFire(TiC.PROPERTY_URL, url);
			return true;
		} else if(url.startsWith(WebView.SCHEME_TEL)) {
			Log.i(TAG, "Launching dialer for " + url, Log.DEBUG_MODE);
			Intent dialer = Intent.createChooser(new Intent(Intent.ACTION_DIAL, Uri.parse(url)), "Choose Dialer");
			webView.getProxy().getActivity().startActivity(dialer);
			return true;
		} else if (url.startsWith(WebView.SCHEME_MAILTO)) {
			Log.i(TAG, "Launching mailer for " + url, Log.DEBUG_MODE);
			Intent mailer = Intent.createChooser(new Intent(Intent.ACTION_SENDTO, Uri.parse(url)), "Send Message");
			webView.getProxy().getActivity().startActivity(mailer);
			return true;
		} else if (url.startsWith(WebView.SCHEME_GEO)) {
			Log.i(TAG, "Launching app for " + url, Log.DEBUG_MODE);
			/*geo:latitude,longitude
			geo:latitude,longitude?z=zoom
			geo:0,0?q=my+street+address
			geo:0,0?q=business+near+city
			*/
			Intent geoviewer = Intent.createChooser(new Intent(Intent.ACTION_VIEW, Uri.parse(url)), "Choose Viewer");
			webView.getProxy().getActivity().startActivity(geoviewer);
			return true;
		} else {
			String extension = MimeTypeMap.getFileExtensionFromUrl(url);
			String mimeType = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
			if (mimeType != null) {
				return shouldHandleMimeType(mimeType, url);
			}
			return super.shouldOverrideUrlLoading(view, url);
		}
	}

	private boolean shouldHandleMimeType(String mimeType, String url)
	{
		if (mimeType.startsWith("video/")) {
			Intent intent = new Intent();
			intent.setClass(webView.getProxy().getActivity(), TiVideoActivity.class);
			intent.putExtra("contentURL", url);
			intent.putExtra("play", true);
			webView.getProxy().getActivity().startActivity(intent);
			
			return true;
		}
		return false;
	}

	@Override
	public void onReceivedHttpAuthRequest(WebView view,
			HttpAuthHandler handler, String host, String realm)
	{
		
		if (this.username != null && this.password != null) {
			handler.proceed(this.username, this.password);
		}
	}

	public void setBasicAuthentication(String username, String password)
	{
		this.username = username;
		this.password = password;
	}

	@Override
	public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error)
	{
		/*
		 * in theory this should be checked to make sure it's not null but if there is some failure 
		 * in the association then usage of webViewProxy should trigger a NPE to make sure the issue 
		 * is not ignored
		 */
		KrollProxy webViewProxy = this.webView.getProxy();

		boolean ignoreSslError = false;
		try {
			ignoreSslError = webViewProxy.getProperties().optBoolean(TiC.PROPERTY_WEBVIEW_IGNORE_SSL_ERROR, false);

		} catch(IllegalArgumentException e) {
			Log.e(TAG, TiC.PROPERTY_WEBVIEW_IGNORE_SSL_ERROR + " property does not contain a boolean value, ignoring"); 
		}

		if (ignoreSslError == true) {
			Log.w(TAG, "ran into SSL error but ignoring...");
			handler.proceed();

		} else {
			Log.e(TAG, "SSL error occurred: " + error.toString());
		}
	}
}

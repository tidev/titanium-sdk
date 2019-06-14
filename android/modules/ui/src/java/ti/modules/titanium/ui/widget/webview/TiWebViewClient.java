/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.webview;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;

import ti.modules.titanium.media.TiVideoActivity;
import ti.modules.titanium.ui.WebViewProxy;

import android.annotation.SuppressLint;
import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.net.http.SslError;
import android.os.AsyncTask;
import android.os.Build;
import android.security.KeyChain;
import android.security.KeyChainAliasCallback;
import android.webkit.ClientCertRequest;
import android.webkit.ClientCertRequestHandler;
import android.webkit.HttpAuthHandler;
import android.webkit.MimeTypeMap;
import android.webkit.SslErrorHandler;
import android.webkit.URLUtil;
import android.webkit.WebView;
import android.webkit.WebViewClientClassicExt;

import java.security.PrivateKey;
import java.security.cert.X509Certificate;

public class TiWebViewClient extends WebViewClientClassicExt
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
		WebViewProxy proxy = (WebViewProxy) webView.getProxy();
		if (proxy == null) {
			return;
		}
		webView.changeProxyUrl(url);
		KrollDict data = new KrollDict();
		data.put("url", url);
		proxy.fireEvent(TiC.EVENT_LOAD, data);
		boolean enableJavascriptInjection = true;
		if (proxy.hasProperty(TiC.PROPERTY_ENABLE_JAVASCRIPT_INTERFACE)) {
			enableJavascriptInjection =
				TiConvert.toBoolean(proxy.getProperty(TiC.PROPERTY_ENABLE_JAVASCRIPT_INTERFACE), true);
		}
		if (Build.VERSION.SDK_INT > 16 || enableJavascriptInjection) {
			WebView nativeWebView = webView.getWebView();

			if (nativeWebView != null) {
				if (webView.shouldInjectBindingCode()) {
					nativeWebView.loadUrl("javascript:" + TiWebViewBinding.INJECTION_CODE);
				}
				nativeWebView.loadUrl("javascript:" + TiWebViewBinding.POLLING_CODE);
			}
		}
		webView.setBindingCodeInjected(false);
	}

	public TiWebViewBinding getBinding()
	{
		return binding;
	}

	@Override
	public void onPageStarted(WebView view, String url, Bitmap favicon)
	{
		super.onPageStarted(view, url, favicon);
		WebViewProxy proxy = (WebViewProxy) webView.getProxy();
		if (proxy == null) {
			return;
		}
		KrollDict data = new KrollDict();
		data.put("url", url);
		proxy.fireEvent("beforeload", data);
	}

	@Override
	public void onReceivedError(WebView view, int errorCode, String description, String failingUrl)
	{
		super.onReceivedError(view, errorCode, description, failingUrl);
		WebViewProxy proxy = (WebViewProxy) webView.getProxy();
		if (proxy == null) {
			return;
		}
		KrollDict data = new KrollDict();
		data.put("url", failingUrl);
		data.put("errorCode", errorCode);
		data.putCodeAndMessage(errorCode, description);
		data.put("message", description);
		proxy.fireEvent("error", data);
	}

	@Override
	public boolean shouldOverrideUrlLoading(final WebView view, String url)
	{
		Log.d(TAG, "url=" + url, Log.DEBUG_MODE);
		WebViewProxy proxy = (WebViewProxy) webView.getProxy();
		if (proxy == null) {
			return super.shouldOverrideUrlLoading(view, url);
		}
		if (proxy.hasProperty(TiC.PROPERTY_ON_LINK)) {
			Object onLink = proxy.getProperty(TiC.PROPERTY_ON_LINK);
			if (onLink instanceof KrollFunction) {
				KrollFunction onLinkFunction = (KrollFunction) onLink;
				KrollDict args = new KrollDict();
				args.put(TiC.EVENT_PROPERTY_URL, url);
				Object result = onLinkFunction.call(proxy.getKrollObject(), args);
				if (result == null || (result instanceof Boolean && ((Boolean) result) == false)) {
					webView.stopLoading();
					return true;
				}
			}
		}
		if (proxy.hasProperty(TiC.PROPERTY_BLACKLISTED_URLS)) {
			String[] blacklistedSites =
				TiConvert.toStringArray((Object[]) proxy.getProperty(TiC.PROPERTY_BLACKLISTED_URLS));
			for (String site : blacklistedSites) {
				if (url.equalsIgnoreCase(site) || (url.indexOf(site) > -1)) {
					KrollDict data = new KrollDict();
					data.put("url", url);
					data.put("message", "Webview did not load blacklisted url.");
					proxy.fireEvent(TiC.PROPERTY_BLACKLIST_URL, data);

					// Deprecated since 6.1.0, leave here until we remove it (7.0.0?)
					proxy.fireEvent(TiC.PROPERTY_ON_STOP_BLACKLISTED_URL, data);

					return true;
				}
			}
		}

		if (URLUtil.isAssetUrl(url) || URLUtil.isContentUrl(url) || URLUtil.isFileUrl(url)) {
			// go through the proxy to ensure we're on the UI thread
			proxy.setPropertyAndFire(TiC.PROPERTY_URL, url);
			return true;
		} else if (url.startsWith(WebView.SCHEME_TEL)) {
			Log.i(TAG, "Launching dialer for " + url, Log.DEBUG_MODE);
			Intent dialer = Intent.createChooser(new Intent(Intent.ACTION_DIAL, Uri.parse(url)), "Choose Dialer");
			proxy.getActivity().startActivity(dialer);
			return true;
		} else if (url.startsWith(WebView.SCHEME_MAILTO)) {
			Log.i(TAG, "Launching mailer for " + url, Log.DEBUG_MODE);
			Intent mailer = Intent.createChooser(new Intent(Intent.ACTION_SENDTO, Uri.parse(url)), "Send Message");
			proxy.getActivity().startActivity(mailer);
			return true;
		} else if (url.startsWith(WebView.SCHEME_GEO)) {
			Log.i(TAG, "Launching app for " + url, Log.DEBUG_MODE);
			/*geo:latitude,longitude
			geo:latitude,longitude?z=zoom
			geo:0,0?q=my+street+address
			geo:0,0?q=business+near+city
			*/
			Intent geoviewer = Intent.createChooser(new Intent(Intent.ACTION_VIEW, Uri.parse(url)), "Choose Viewer");
			proxy.getActivity().startActivity(geoviewer);
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
		WebViewProxy proxy = (WebViewProxy) webView.getProxy();
		if (proxy != null && mimeType.startsWith("video/")) {
			Intent intent = new Intent();
			intent.setClass(webView.getProxy().getActivity(), TiVideoActivity.class);
			intent.putExtra("contentURL", url);
			intent.putExtra("play", true);
			proxy.getActivity().startActivity(intent);
			return true;
		}
		return false;
	}

	@Override
	public void onReceivedHttpAuthRequest(WebView view, HttpAuthHandler handler, String host, String realm)
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

	/*
	 * ClientCertRequest wrapper for compatibility with both ClientCertRequest and ClientCertRequestHandler
	 */
	private class ClientCertRequestCompat
	{
		private ClientCertRequest clientCertRequest;
		private ClientCertRequestHandler clientCertRequestHandler;

		ClientCertRequestCompat(Object request)
		{
			// API 21+
			if (Build.VERSION.SDK_INT >= 21 && request instanceof ClientCertRequest) {
				clientCertRequest = (ClientCertRequest) request;

				// API 16+
			} else if (request instanceof ClientCertRequestHandler) {
				clientCertRequestHandler = (ClientCertRequestHandler) request;
			}
		}

		@SuppressLint("NewApi")
		public void cancel()
		{
			if (clientCertRequest != null) {
				clientCertRequest.cancel();
			} else if (clientCertRequestHandler != null) {
				clientCertRequestHandler.cancel();
			}
		}

		@SuppressLint("NewApi")
		public void ignore()
		{
			if (clientCertRequest != null) {
				clientCertRequest.ignore();
			} else if (clientCertRequestHandler != null) {
				clientCertRequestHandler.ignore();
			}
		}

		@SuppressLint("NewApi")
		public void proceed(PrivateKey privateKey, X509Certificate[] x509Certificates)
		{
			if (clientCertRequest != null) {
				clientCertRequest.proceed(privateKey, x509Certificates);
			} else if (clientCertRequestHandler != null) {
				clientCertRequestHandler.proceed(privateKey, x509Certificates);
			}
		}
	}

	@TargetApi(16)
	private void handleClientCertRequest(final Object requestObj, final String host, final int port)
	{
		final Activity activity = TiApplication.getAppRootOrCurrentActivity();
		final ClientCertRequestCompat request = new ClientCertRequestCompat(requestObj);

		KeyChain.choosePrivateKeyAlias(activity, new KeyChainAliasCallback() {
			@Override
			public void alias(final String alias)
			{
				final AsyncTask<Void, Void, Void> task = new AsyncTask<Void, Void, Void>() {
					@Override
					protected Void doInBackground(Void... args)
					{
						try {
							PrivateKey privateKey = KeyChain.getPrivateKey(activity, alias);
							X509Certificate[] certificateChain = KeyChain.getCertificateChain(activity, alias);
							request.proceed(privateKey, certificateChain);
						} catch (Exception e) {
							request.ignore();
						}
						return null;
					}
				}.execute();
			}
		}, null, null, host, port, null);
	}

	@TargetApi(21)
	@Override
	public void onReceivedClientCertRequest(WebView view, ClientCertRequest request)
	{
		handleClientCertRequest(request, request.getHost(), request.getPort());
	}

	/*
	 * this is a "hidden" callback implemented on API 16 - 18 for handling certificate requests
	 * note: Android 4.4 prevents this from being called, stating "Client certificates not supported in WebView"
	 */
	@TargetApi(16)
	@Override
	public void onReceivedClientCertRequest(WebView view, ClientCertRequestHandler handler, String host_and_port)
	{
		String[] hostPort = host_and_port.split(":");
		String host = hostPort[0];
		int port = Integer.parseInt(hostPort[1]);

		handleClientCertRequest(handler, host, port);
	}

	@Override
	public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error)
	{
		/*
		 * in theory this should be checked to make sure it's not null but if there is some failure
		 * in the association then usage of proxy should trigger a NPE to make sure the issue
		 * is not ignored
		 */
		WebViewProxy proxy = (WebViewProxy) webView.getProxy();
		if (proxy == null) {
			return;
		}

		KrollDict data = new KrollDict();
		data.put(TiC.ERROR_PROPERTY_CODE, error.getPrimaryError());
		proxy.fireSyncEvent(TiC.EVENT_SSL_ERROR, data);

		boolean ignoreSslError = false;
		try {
			ignoreSslError = proxy.getProperties().optBoolean(TiC.PROPERTY_WEBVIEW_IGNORE_SSL_ERROR, false);

		} catch (IllegalArgumentException e) {
			Log.e(TAG, TiC.PROPERTY_WEBVIEW_IGNORE_SSL_ERROR + " property does not contain a boolean value, ignoring");
		}

		if (ignoreSslError == true) {
			Log.w(TAG, "ran into SSL error but ignoring...");
			handler.proceed();

		} else {
			Log.e(TAG, "SSL error occurred: " + error.toString());
			handler.cancel();
		}
	}

	@Override
	public void onLoadResource(WebView view, String url)
	{
		super.onLoadResource(view, url);
		WebViewProxy proxy = (WebViewProxy) webView.getProxy();
		if (proxy == null) {
			return;
		}
		KrollDict data = new KrollDict();
		data.put(TiC.PROPERTY_URL, url);
		proxy.fireEvent(TiC.EVENT_WEBVIEW_ON_LOAD_RESOURCE, data);
	}

	@Override
	public void onScaleChanged(WebView view, float oldScale, float newScale)
	{
		super.onScaleChanged(view, oldScale, newScale);
		webView.setZoomLevel(newScale);
	}
}

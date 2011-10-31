/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.webview;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiMimeTypeHelper;
import org.appcelerator.titanium.view.TiBackgroundDrawable;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.WebViewProxy;

import android.content.Context;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;

public class TiUIWebView extends TiUIView {

	private static final String LCAT = "TiUIWebView";
	private static final boolean DBG = TiConfig.LOGD;
	private TiWebViewClient client;
	private boolean changingUrl = false;
	
	private static Enum<?> enumPluginStateOff;
	private static Enum<?> enumPluginStateOn;
	private static Enum<?> enumPluginStateOnDemand;
	private static Method internalSetPluginState;
	private static Method internalWebViewPause;
	private static Method internalWebViewResume;

	public static final int PLUGIN_STATE_OFF = 0;
	public static final int PLUGIN_STATE_ON = 1;
	public static final int PLUGIN_STATE_ON_DEMAND = 2;
	
	private static final String DEFAULT_PAGE_FINISH_URL = "file:///android_asset/Resources/";
	
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
		settings.setUseWideViewPort(true);
		settings.setJavaScriptEnabled(true);
		settings.setSupportMultipleWindows(true);
		settings.setJavaScriptCanOpenWindowsAutomatically(true);
		settings.setLoadsImagesAutomatically(true);
		settings.setLightTouchEnabled(true);
		
		// enable zoom controls by default
		boolean enableZoom = true;

		if (proxy.hasProperty(TiC.PROPERTY_ENABLE_ZOOM_CONTROLS)) {
			enableZoom = TiConvert.toBoolean(proxy.getProperty(TiC.PROPERTY_ENABLE_ZOOM_CONTROLS));
		}

		settings.setBuiltInZoomControls(enableZoom);
		settings.setSupportZoom(enableZoom);

		// We can only support webview settings for plugin/flash in API 8 and higher.
		if (Build.VERSION.SDK_INT > Build.VERSION_CODES.ECLAIR_MR1) {
			initializePluginAPI(webView);
		}

		webView.setWebChromeClient(new TiWebChromeClient(this));
		client = new TiWebViewClient(this, webView);
		webView.setWebViewClient(client);
		webView.client = client;

		WebViewProxy webProxy = (WebViewProxy) proxy;
		String username = webProxy.getBasicAuthenticationUserName();
		String password = webProxy.getBasicAuthenticationPassword();
		if (username != null && password != null) {
			setBasicAuthentication(username, password);
		}
		webProxy.clearBasicAuthentication();

		TiCompositeLayout.LayoutParams params = getLayoutParams();
		params.autoFillsHeight = true;
		params.autoFillsWidth = true;

		setNativeView(webView);
	}

	public WebView getWebView()
	{
		return (WebView)getNativeView();
	}

	private void initializePluginAPI(TiWebView webView) 
	{
		try 
		{
			synchronized(this.getClass()) {
				// Initialize
				if (enumPluginStateOff == null) {
					Class<?> webSettings = Class.forName("android.webkit.WebSettings");
					Class<?> pluginState = Class.forName("android.webkit.WebSettings$PluginState");
					
					Field f = pluginState.getDeclaredField("OFF");
					enumPluginStateOff = (Enum<?>) f.get(null);
					f = pluginState.getDeclaredField("ON");
					enumPluginStateOn = (Enum<?>) f.get(null);
					f = pluginState.getDeclaredField("ON_DEMAND");
					enumPluginStateOnDemand = (Enum<?>) f.get(null);
					internalSetPluginState = webSettings.getMethod("setPluginState", pluginState);
					// Hidden APIs
					// http://android.git.kernel.org/?p=platform/frameworks/base.git;a=blob;f=core/java/android/webkit/WebView.java;h=bbd8b95c7bea66b7060b5782fae4b3b2c4f04966;hb=4db1f432b853152075923499768639e14403b73a#l2558
					internalWebViewPause = webView.getClass().getMethod("onPause");
					internalWebViewResume = webView.getClass().getMethod("onResume");
				}
			}
		} catch (ClassNotFoundException e) {
			Log.e(LCAT, "ClassNotFound: " + e.getMessage(), e);
		} catch (NoSuchMethodException e) {
			Log.e(LCAT, "NoSuchMethod: " + e.getMessage(), e);
		} catch (NoSuchFieldException e) {
			Log.e(LCAT, "NoSuchField: " + e.getMessage(), e);			
		} catch (IllegalAccessException e) {
			Log.e(LCAT, "IllegalAccess: " + e.getMessage(), e);
		}			
	}
	
	@Override
	public void processProperties(KrollDict d) {
		super.processProperties(d);

		if (d.containsKey(TiC.PROPERTY_SCALES_PAGE_TO_FIT)) {
			WebSettings settings = getWebView().getSettings();
			settings.setLoadWithOverviewMode(TiConvert.toBoolean(d, TiC.PROPERTY_SCALES_PAGE_TO_FIT));
		}

		if (d.containsKey(TiC.PROPERTY_URL) && !DEFAULT_PAGE_FINISH_URL.equals(TiConvert.toString(d, TiC.PROPERTY_URL))) {
			setUrl(TiConvert.toString(d, TiC.PROPERTY_URL));
		} else if (d.containsKey(TiC.PROPERTY_HTML)) {
			setHtml(TiConvert.toString(d, TiC.PROPERTY_HTML));
		} else if (d.containsKey(TiC.PROPERTY_DATA)) {
			Object value = d.get(TiC.PROPERTY_DATA);
			if (value instanceof TiBlob) {
				setData((TiBlob) value);
			}
		}

		// If TiUIView's processProperties ended up making a TiBackgroundDrawable
		// for the background, we must set the WebView background color to transparent
		// in order to see any of it.
		if (nativeView != null && nativeView.getBackground() instanceof TiBackgroundDrawable) {
			nativeView.setBackgroundColor(Color.TRANSPARENT);
		}
		
		if (d.containsKey(TiC.PROPERTY_PLUGIN_STATE)) {
			setPluginState(TiConvert.toInt(d, TiC.PROPERTY_PLUGIN_STATE));
		}
		
		if(d.containsKey(TiC.PROPERTY_ENABLE_ZOOM_CONTROLS)) {
			setEnableZoomControls(TiConvert.toBoolean(d,TiC.PROPERTY_ENABLE_ZOOM_CONTROLS));
		}
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy) {
		if (TiC.PROPERTY_URL.equals(key) && !changingUrl
			&& !DEFAULT_PAGE_FINISH_URL.equals(TiConvert.toString(newValue))) {
			setUrl(TiConvert.toString(newValue));
		} else if (TiC.PROPERTY_HTML.equals(key)) {
			setHtml(TiConvert.toString(newValue));
		} else if (TiC.PROPERTY_DATA.equals(key)) {
			if (newValue instanceof TiBlob) {
				setData((TiBlob) newValue);
			}
		} else if (TiC.PROPERTY_SCALES_PAGE_TO_FIT.equals(key)) {
			WebSettings settings = getWebView().getSettings();
			settings.setLoadWithOverviewMode(TiConvert.toBoolean(newValue));
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}

		// If TiUIView's propertyChanged ended up making a TiBackgroundDrawable
		// for the background, we must set the WebView background color to transparent
		// in order to see any of it.
		boolean isBgRelated = (key.startsWith(TiC.PROPERTY_BACKGROUND_PREFIX) || key.startsWith(TiC.PROPERTY_BORDER_PREFIX));
		if (isBgRelated && nativeView != null && nativeView.getBackground() instanceof TiBackgroundDrawable) {
			nativeView.setBackgroundColor(Color.TRANSPARENT);
		}
	}

	private boolean mightBeHtml(String url)
	{
		String mime = TiMimeTypeHelper.getMimeType(url);
		if (mime.equals("text/html")){
			return true;
		} else if (mime.equals("application/xhtml+xml")) {
			return true;
		} else {
			return false;
		}
	}

	public void setUrl(String url)
	{
		String finalUrl = url;
		Uri uri = Uri.parse(finalUrl);
		boolean originalUrlHasScheme = (uri.getScheme() != null);

		if (!originalUrlHasScheme) {
			finalUrl = getProxy().getTiContext().resolveUrl(null, finalUrl);
		}

		if (TiFileFactory.isLocalScheme(finalUrl) && mightBeHtml(finalUrl) ) {
			TiBaseFile tiFile = TiFileFactory.createTitaniumFile(getProxy().getTiContext(), finalUrl, false);
			if (tiFile != null) {
				StringBuilder out = new StringBuilder();
				InputStream fis = null;
				try {
					fis = tiFile.getInputStream();
					InputStreamReader reader = new InputStreamReader(fis, "utf-8");
					BufferedReader breader = new BufferedReader(reader);
					boolean injected = false;
					String line = breader.readLine();
					while (line != null) {
						if (!injected) {
							int pos = line.indexOf("<html");
							if (pos >= 0) {
								int posEnd = line.indexOf(">", pos);
								if (posEnd > pos) {
									out.append(line.substring(pos, posEnd+ 1));
									out.append(TiWebViewBinding.INJECTION_CODE);
									if ((posEnd + 1) < line.length() ) {
										out.append(line.substring(posEnd + 1));
									}
									out.append("\n");
									injected = true;
									line = breader.readLine();
									continue;
								}
							}
						}
						out.append(line);
						out.append("\n");
						line = breader.readLine();
					}
					setHtml(out.toString(), (originalUrlHasScheme ? url : finalUrl) ); // keep app:// etc. intact in case html in file contains links to JS that use app:// etc.
					return;
				} catch (IOException ioe) {
					Log.e(LCAT, "Problem reading from " + url + ": " + ioe.getMessage() + ". Will let WebView try loading it directly.", ioe);
				} finally {
					if (fis != null) {
						try {
							fis.close();
						} catch (IOException e) {
							Log.w(LCAT, "Problem closing stream: " + e.getMessage(), e);
						}
					}
				}
			}
		}

		if (DBG) {
			Log.d(LCAT, "WebView will load " + url + " directly without code injection.");
		}
		// iOS parity: for whatever reason, when a remote url is used, the iOS implementation
		// explicitly sets the native webview's setScalesPageToFit to YES if the
		// Ti scalesPageToFit property has _not_ been set.
		if (!proxy.hasProperty(TiC.PROPERTY_SCALES_PAGE_TO_FIT)) {
			getWebView().getSettings().setLoadWithOverviewMode(true);
		}
		getWebView().loadUrl(finalUrl);

	}

	public void changeProxyUrl(String url) {
		changingUrl = true;
		getProxy().setProperty("url", url, true);
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

		setHtml(html, TiC.URL_ANDROID_ASSET_RESOURCES);
	}

	private void setHtml(String html, String baseUrl)
	{
		// iOS parity: for whatever reason, when html is set directly, the iOS implementation
		// explicitly sets the native webview's setScalesPageToFit to NO if the
		// Ti scalesPageToFit property has _not_ been set.
		if (!proxy.hasProperty(TiC.PROPERTY_SCALES_PAGE_TO_FIT)) {
			getWebView().getSettings().setLoadWithOverviewMode(false);
		}
		if (html.contains(TiWebViewBinding.SCRIPT_INJECTION_ID)) {
			// Our injection code is in there already, go ahead and show.
			getWebView().loadDataWithBaseURL(baseUrl, html, "text/html", "utf-8", null);
			return;
		}

		int tagStart = html.indexOf("<html");
		int tagEnd = -1;
		if (tagStart >= 0) {
			tagEnd = html.indexOf(">", tagStart + 1);
			if (tagEnd > tagStart) {
				StringBuilder sb = new StringBuilder(html.length() + 2500);
				sb.append(html.substring(0, tagEnd + 1));
				sb.append(TiWebViewBinding.INJECTION_CODE);
				sb.append(html.substring(tagEnd + 1));
				getWebView().loadDataWithBaseURL(baseUrl, sb.toString(), "text/html", "utf-8", null);
				return;
			}
		}
		getWebView().loadDataWithBaseURL(baseUrl, html, "text/html", "utf-8", null);
	}

	public void setData(TiBlob blob)
	{
		String mimeType = "text/html";
		// iOS parity: for whatever reason, in setData, the iOS implementation
		// explicitly sets the native webview's setScalesPageToFit to YES if the
		// Ti scalesPageToFit property has _not_ been set.
		if (!proxy.hasProperty(TiC.PROPERTY_SCALES_PAGE_TO_FIT)) {
			getWebView().getSettings().setLoadWithOverviewMode(true);
		}
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
	
	public void setPluginState(int pluginState) 
	{
		if (Build.VERSION.SDK_INT > Build.VERSION_CODES.ECLAIR_MR1) {
			TiWebView webView = (TiWebView) getNativeView();
			WebSettings webSettings = webView.getSettings();
			if (webView != null) {
				try {
					switch(pluginState) {
						case PLUGIN_STATE_OFF : 
							internalSetPluginState.invoke(webSettings, enumPluginStateOff);
							break;
						case PLUGIN_STATE_ON : 
							internalSetPluginState.invoke(webSettings, enumPluginStateOn);
							break;
						case PLUGIN_STATE_ON_DEMAND : 
							internalSetPluginState.invoke(webSettings, enumPluginStateOnDemand);
							break;
						default :
							Log.w(LCAT, "Not a valid plugin state. Ignoring setPluginState request");
					}
				} catch (InvocationTargetException e) {
					Log.e(LCAT, "Method not supported", e);
				} catch (IllegalAccessException e) {
					Log.e(LCAT, "Illegal Access", e);
				}
			}
		}
	}
	
	public void pauseWebView()
	{
		if (Build.VERSION.SDK_INT > Build.VERSION_CODES.ECLAIR_MR1) {
			View v = getNativeView();
			if (v != null) {
				try {
					internalWebViewPause.invoke(v);
				} catch (InvocationTargetException e) {
					Log.e(LCAT, "Method not supported", e);
				} catch (IllegalAccessException e) {
					Log.e(LCAT, "Illegal Access", e);
				}
			}
		}
	}
	
	public void resumeWebView()
	{
		if (Build.VERSION.SDK_INT > Build.VERSION_CODES.ECLAIR_MR1) {
			View v = getNativeView();
			if (v != null) {
				try {
					internalWebViewResume.invoke(v);
				} catch (InvocationTargetException e) {
					Log.e(LCAT, "Method not supported", e);
				} catch (IllegalAccessException e) {
					Log.e(LCAT, "Illegal Access", e);
				}
			}
		}
	}
	
	public void setEnableZoomControls(boolean enabled)
	{
		getWebView().getSettings().setSupportZoom(enabled);
		getWebView().getSettings().setBuiltInZoomControls(enabled);
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

/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.webview;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.FeatureInfo;
import android.graphics.Color;
import android.graphics.Rect;
import android.net.Uri;
import android.os.Build;
import android.view.ActionMode;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewParent;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.annotation.RequiresApi;
import androidx.annotation.StringRes;
import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;
import javax.crypto.CipherInputStream;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiMimeTypeHelper;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiBackgroundDrawable;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;
import ti.modules.titanium.ui.WebViewProxy;
import ti.modules.titanium.ui.android.AndroidModule;

@SuppressWarnings("deprecation")
public class TiUIWebView extends TiUIView
{

	private static final String TAG = "TiUIWebView";
	private TiWebViewClient client;
	private TiWebChromeClient chromeClient;
	private boolean bindingCodeInjected = false;
	private boolean isLocalHTML = false;
	private boolean disableContextMenu = false;
	private HashMap<String, String> extraHeaders = new HashMap<String, String>();
	private float zoomLevel =
		TiApplication.getInstance().getApplicationContext().getResources().getDisplayMetrics().density;
	private float initScale = zoomLevel;

	public static final int PLUGIN_STATE_OFF = 0;
	public static final int PLUGIN_STATE_ON = 1;
	public static final int PLUGIN_STATE_ON_DEMAND = 2;

	private static enum reloadTypes { DEFAULT, DATA, HTML, URL }

	private reloadTypes reloadMethod = reloadTypes.DEFAULT;
	private Object reloadData = null;

	private class TiWebView extends WebView
	{
		public TiWebViewClient client;

		public TiWebView(Context context)
		{
			super(context);
		}

		@Override
		public ActionMode startActionMode(ActionMode.Callback callback)
		{
			if (disableContextMenu) {
				return nullifiedActionMode();
			}

			return super.startActionMode(callback);
		}

		@Override
		@RequiresApi(23)
		public ActionMode startActionMode(ActionMode.Callback callback, int type)
		{
			if (disableContextMenu) {
				return nullifiedActionMode();
			}
			ViewParent parent = getParent();
			if (parent == null) {
				return null;
			}

			return parent.startActionModeForChild(this, callback, type);
		}

		public ActionMode nullifiedActionMode()
		{
			return new ActionMode() {
				@Override
				public void setTitle(CharSequence title)
				{
				}

				@Override
				public void setTitle(@StringRes int resId)
				{
				}

				@Override
				public void setSubtitle(CharSequence subtitle)
				{
				}

				@Override
				public void setSubtitle(@StringRes int resId)
				{
				}

				@Override
				public void setCustomView(View view)
				{
				}

				@Override
				public void invalidate()
				{
				}

				@Override
				public void finish()
				{
				}

				@Override
				public Menu getMenu()
				{
					return null;
				}

				@Override
				public CharSequence getTitle()
				{
					return null;
				}

				@Override
				public CharSequence getSubtitle()
				{
					return null;
				}

				@Override
				public View getCustomView()
				{
					return null;
				}

				@Override
				public MenuInflater getMenuInflater()
				{
					return null;
				}
			};
		}

		@Override
		public void destroy()
		{
			if (client != null) {
				client.getBinding().destroy();
			}
			super.destroy();
		}

		@Override
		public boolean onTouchEvent(MotionEvent ev)
		{
			boolean handled = false;

			// In Android WebView, all the click events are directly sent to WebKit. As a result, OnClickListener() is
			// never called. Therefore, we have to manually call performClick() when a click event is detected.
			//
			// In native Android and in the Ti world, it's possible to to have a touchEvent click on a link in a webview and
			// also to be detected as a click on the webview.  So we cannot let handling of the event one way block
			// the handling the other way -- it must be passed to both in all cases for everything to work correctly.
			//
			if (ev.getAction() == MotionEvent.ACTION_UP) {
				Rect r = new Rect(0, 0, getWidth(), getHeight());
				if (r.contains((int) ev.getX(), (int) ev.getY())) {
					handled = proxy.fireEvent(TiC.EVENT_CLICK, dictFromEvent(ev));
				}
			}

			boolean swipeHandled = false;

			// detect will be null when touch is disabled
			if (detector != null) {
				swipeHandled = detector.onTouchEvent(ev);
			}

			// Don't return here -- must call super.onTouchEvent()

			boolean superHandled = super.onTouchEvent(ev);

			return (superHandled || handled || swipeHandled);
		}

		@Override
		protected void onLayout(boolean changed, int left, int top, int right, int bottom)
		{
			super.onLayout(changed, left, top, right, bottom);
			TiUIHelper.firePostLayoutEvent(proxy);
		}
	}

	//TIMOB-16952. Overriding onCheckIsTextEditor crashes HTC Sense devices
	private class NonHTCWebView extends TiWebView
	{
		public NonHTCWebView(Context context)
		{
			super(context);
		}

		@Override
		public boolean onCheckIsTextEditor()
		{
			if ((proxy != null) && proxy.hasProperty(TiC.PROPERTY_SOFT_KEYBOARD_ON_FOCUS)) {
				int value = TiConvert.toInt(proxy.getProperty(TiC.PROPERTY_SOFT_KEYBOARD_ON_FOCUS),
											TiUIView.SOFT_KEYBOARD_DEFAULT_ON_FOCUS);

				if (value == TiUIView.SOFT_KEYBOARD_HIDE_ON_FOCUS) {
					return false;
				} else if (value == TiUIView.SOFT_KEYBOARD_SHOW_ON_FOCUS) {
					return true;
				}
			}
			return super.onCheckIsTextEditor();
		}
	}

	private boolean isHTCSenseDevice()
	{
		boolean isHTC = false;

		FeatureInfo[] features =
			TiApplication.getInstance().getApplicationContext().getPackageManager().getSystemAvailableFeatures();
		if (features == null) {
			return isHTC;
		}
		for (FeatureInfo f : features) {
			String fName = f.name;
			if (fName != null) {
				isHTC = fName.contains("com.htc.software.Sense");
				if (isHTC) {
					Log.i(TAG, "Detected com.htc.software.Sense feature " + fName);
					break;
				}
			}
		}

		return isHTC;
	}

	public TiUIWebView(TiViewProxy proxy)
	{
		super(proxy);

		// Only enable WebView debugging if running a debug version of the app.
		if ((TiApplication.getInstance().getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
			WebView.setWebContentsDebuggingEnabled(true);
		}

		TiWebView webView = null;
		try {
			webView = isHTCSenseDevice() ? new TiWebView(proxy.getActivity()) : new NonHTCWebView(proxy.getActivity());
		} catch (Exception e) {
			// silence unnecessary internal logs...
		}
		webView.setVerticalScrollbarOverlay(true);

		WebSettings settings = webView.getSettings();
		settings.setUseWideViewPort(true);
		settings.setJavaScriptEnabled(true);
		settings.setSupportMultipleWindows(true);
		settings.setJavaScriptCanOpenWindowsAutomatically(true);
		settings.setLoadsImagesAutomatically(true);
		settings.setDomStorageEnabled(true); // Required by some sites such as Twitter. This is in our iOS WebView too.
		File path = TiApplication.getInstance().getFilesDir();
		if (path != null) {
			settings.setDatabasePath(path.getAbsolutePath());
			settings.setDatabaseEnabled(true);
		}

		File cacheDir = TiApplication.getInstance().getCacheDir();
		if (cacheDir != null) {
			settings.setAppCacheEnabled(true);
			settings.setAppCachePath(cacheDir.getAbsolutePath());
		}

		// Enable mixed content mode to allow loading HTTP resources within an HTTPS page.
		// Note: This is an API Level 21 method. Use reflection to invoke it on older API Levels.
		boolean mixedContentMode = TiConvert.toBoolean(proxy.getProperty(TiC.PROPERTY_MIXED_CONTENT_MODE), false);
		if (mixedContentMode) {
			try {
				Method mixedContentModeMethod = WebSettings.class.getMethod("setMixedContentMode", int.class);
				if (mixedContentModeMethod != null) {
					mixedContentModeMethod.invoke(settings, 0); // MIXED_CONTENT_ALWAYS_ALLOW
				}
			} catch (Exception ex) {
				// ignore...
			}
		}

		// enable zoom controls by default
		boolean enableZoom = true;

		if (proxy.hasProperty(TiC.PROPERTY_ENABLE_ZOOM_CONTROLS)) {
			enableZoom = TiConvert.toBoolean(proxy.getProperty(TiC.PROPERTY_ENABLE_ZOOM_CONTROLS));
		}

		settings.setBuiltInZoomControls(enableZoom);
		settings.setSupportZoom(enableZoom);
		settings.setAllowUniversalAccessFromFileURLs(true);

		boolean enableJavascriptInterface =
			TiConvert.toBoolean(proxy.getProperty(TiC.PROPERTY_ENABLE_JAVASCRIPT_INTERFACE), true);
		chromeClient = new TiWebChromeClient(this);
		webView.setWebChromeClient(chromeClient);
		client = new TiWebViewClient(this, webView);
		webView.setWebViewClient(client);
		if (enableJavascriptInterface) {
			client.getBinding().addJavascriptInterfaces();
		}

		webView.client = client;

		if (proxy instanceof WebViewProxy) {
			WebViewProxy webProxy = (WebViewProxy) proxy;
			String username = webProxy.getBasicAuthenticationUserName();
			String password = webProxy.getBasicAuthenticationPassword();
			if (username != null && password != null) {
				setBasicAuthentication(username, password);
			}
			webProxy.clearBasicAuthentication();
		}

		TiCompositeLayout.LayoutParams params = getLayoutParams();
		params.autoFillsHeight = true;
		params.autoFillsWidth = true;

		setNativeView(webView);
	}

	public WebView getWebView()
	{
		return (WebView) getNativeView();
	}

	@Override
	public void processProperties(KrollDict d)
	{
		super.processProperties(d);

		WebView webView = getWebView();
		if (webView == null) {
			return;
		}

		WebSettings settings = webView.getSettings();

		if (d.containsKey(TiC.PROPERTY_SCALES_PAGE_TO_FIT)) {
			settings.setLoadWithOverviewMode(TiConvert.toBoolean(d, TiC.PROPERTY_SCALES_PAGE_TO_FIT));
		}

		if (d.containsKey(TiC.PROPERTY_CACHE_MODE)) {
			int mode = TiConvert.toInt(d.get(TiC.PROPERTY_CACHE_MODE), AndroidModule.WEBVIEW_LOAD_DEFAULT);
			settings.setCacheMode(mode);
		}

		if (d.containsKey(TiC.PROPERTY_REQUEST_HEADERS)) {
			Object value = d.get(TiC.PROPERTY_REQUEST_HEADERS);
			if (value instanceof HashMap) {
				setRequestHeaders((HashMap) value);
			}
		}

		// set user-agent befoe loading url to avoid immediate reload
		if (d.containsKey(TiC.PROPERTY_USER_AGENT)) {
			((WebViewProxy) getProxy()).setUserAgent(d.getString(TiC.PROPERTY_USER_AGENT));
		}

		if (d.containsKey(TiC.PROPERTY_URL)
			&& !TiC.URL_ANDROID_ASSET_RESOURCES.equals(TiConvert.toString(d, TiC.PROPERTY_URL))) {
			setUrl(TiConvert.toString(d, TiC.PROPERTY_URL));
		} else if (d.containsKey(TiC.PROPERTY_HTML)) {
			setHtml(TiConvert.toString(d, TiC.PROPERTY_HTML),
					(HashMap<String, Object>) (d.get(WebViewProxy.OPTIONS_IN_SETHTML)));
		} else if (d.containsKey(TiC.PROPERTY_DATA)) {
			Object value = d.get(TiC.PROPERTY_DATA);
			if (value instanceof TiBlob) {
				setData((TiBlob) value);
			}
		}

		if (d.containsKey(TiC.PROPERTY_LIGHT_TOUCH_ENABLED)) {
			settings.setLightTouchEnabled(TiConvert.toBoolean(d, TiC.PROPERTY_LIGHT_TOUCH_ENABLED));
		}

		// If TiUIView's processProperties ended up making a TiBackgroundDrawable
		// for the background, we must set the WebView background color to transparent
		// in order to see any of it.
		if (webView.getBackground() instanceof TiBackgroundDrawable) {
			webView.setBackgroundColor(Color.TRANSPARENT);
		}

		if (d.containsKey(TiC.PROPERTY_PLUGIN_STATE)) {
			setPluginState(TiConvert.toInt(d, TiC.PROPERTY_PLUGIN_STATE));
		}

		if (d.containsKey(TiC.PROPERTY_OVER_SCROLL_MODE)) {
			webView.setOverScrollMode(TiConvert.toInt(d.get(TiC.PROPERTY_OVER_SCROLL_MODE), View.OVER_SCROLL_ALWAYS));
		}

		if (d.containsKey(TiC.PROPERTY_DISABLE_CONTEXT_MENU)) {
			disableContextMenu = TiConvert.toBoolean(d, TiC.PROPERTY_DISABLE_CONTEXT_MENU);
		}

		if (d.containsKey(TiC.PROPERTY_ZOOM_LEVEL)) {
			zoomBy(getWebView(), TiConvert.toFloat(d, TiC.PROPERTY_ZOOM_LEVEL));
		}
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		WebView webView = getWebView();
		if (TiC.PROPERTY_URL.equals(key)) {
			setUrl(TiConvert.toString(newValue));
		} else if (TiC.PROPERTY_HTML.equals(key)) {
			setHtml(TiConvert.toString(newValue));
		} else if (TiC.PROPERTY_DATA.equals(key)) {
			if (newValue instanceof TiBlob) {
				setData((TiBlob) newValue);
			}
		} else if (TiC.PROPERTY_SCALES_PAGE_TO_FIT.equals(key)) {
			if (webView != null) {
				webView.getSettings().setLoadWithOverviewMode(TiConvert.toBoolean(newValue));
			}
		} else if (TiC.PROPERTY_OVER_SCROLL_MODE.equals(key)) {
			if (webView != null) {
				webView.setOverScrollMode(TiConvert.toInt(newValue, View.OVER_SCROLL_ALWAYS));
			}
		} else if (TiC.PROPERTY_CACHE_MODE.equals(key)) {
			if (webView != null) {
				webView.getSettings().setCacheMode(TiConvert.toInt(newValue));
			}
		} else if (TiC.PROPERTY_LIGHT_TOUCH_ENABLED.equals(key)) {
			if (webView != null) {
				webView.getSettings().setLightTouchEnabled(TiConvert.toBoolean(newValue));
			}
		} else if (TiC.PROPERTY_REQUEST_HEADERS.equals(key)) {
			if (newValue instanceof HashMap) {
				setRequestHeaders((HashMap) newValue);
			}
		} else if (TiC.PROPERTY_DISABLE_CONTEXT_MENU.equals(key)) {
			disableContextMenu = TiConvert.toBoolean(newValue);
		} else if (TiC.PROPERTY_ZOOM_LEVEL.equals(key)) {
			zoomBy(webView, TiConvert.toFloat(newValue, 1.0f));
		} else if (TiC.PROPERTY_USER_AGENT.equals(key)) {
			((WebViewProxy) getProxy()).setUserAgent(TiConvert.toString(newValue));
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}

		// If TiUIView's propertyChanged ended up making a TiBackgroundDrawable
		// for the background, we must set the WebView background color to transparent
		// in order to see any of it.
		boolean isBgRelated =
			(key.startsWith(TiC.PROPERTY_BACKGROUND_PREFIX) || key.startsWith(TiC.PROPERTY_BORDER_PREFIX));
		if (isBgRelated && (webView != null) && (webView.getBackground() instanceof TiBackgroundDrawable)) {
			webView.setBackgroundColor(Color.TRANSPARENT);
		}
	}

	private void zoomBy(WebView webView, float scale)
	{
		if (Build.VERSION.SDK_INT >= 21 && webView != null) {
			if (scale <= 0.0f) {
				scale = 0.01f;
			} else if (scale >= 100.0f) {
				scale = 100.0f;
			}

			float targetVal = (initScale * scale) / zoomLevel;
			webView.zoomBy(targetVal);
		}
	}

	public void zoomBy(float scale)
	{
		zoomBy(getWebView(), scale);
	}

	public float getZoomLevel()
	{
		return zoomLevel;
	}

	public void setZoomLevel(float value)
	{
		if (proxy != null) {
			proxy.setProperty(TiC.PROPERTY_ZOOM_LEVEL, value / initScale);
		}
		zoomLevel = value;
	}

	private boolean mightBeHtml(String url)
	{
		String mime = TiMimeTypeHelper.getMimeType(url);
		if (mime.equals("text/html")) {
			return true;
		} else if (mime.equals("application/xhtml+xml")) {
			return true;
		} else {
			return false;
		}
	}

	public void setUrl(String url)
	{
		WebView webView = getWebView();
		if (webView == null) {
			return;
		}

		reloadMethod = reloadTypes.URL;
		reloadData = url;
		final Uri uri = Uri.parse(url);

		// Extract URL query parameters.
		final String query = uri.getQuery() != null ? "?" + uri.getQuery() : "";
		final String fragment = uri.getFragment();

		// Resolve URL path.
		// The scheme is processed by `resolveUrl()`.
		final Uri finalUri = Uri.parse(getProxy().resolveUrl(null, url));

		// Reconstruct URL, ommiting any query parameters.
		final String finalUrl = finalUri.toString().replace(query, "");

		if (TiFileFactory.isLocalScheme(finalUrl) && mightBeHtml(finalUrl)) {
			TiBaseFile tiFile = TiFileFactory.createTitaniumFile(finalUrl, false);
			if (tiFile != null) {
				StringBuilder out = new StringBuilder();
				InputStream fis = null;
				try {
					fis = tiFile.getInputStream();
					InputStreamReader reader = new InputStreamReader(fis, "utf-8");
					BufferedReader breader = new BufferedReader(reader);
					String line = breader.readLine();
					while (line != null) {
						if (!bindingCodeInjected) {
							int pos = line.indexOf("<html");
							if (pos >= 0) {
								int posEnd = line.indexOf(">", pos);
								if (posEnd > pos) {
									out.append(line.substring(pos, posEnd + 1));
									out.append(TiWebViewBinding.SCRIPT_TAG_INJECTION_CODE);
									if ((posEnd + 1) < line.length()) {
										out.append(line.substring(posEnd + 1));
									}
									out.append("\n");
									bindingCodeInjected = true;
									line = breader.readLine();
									continue;
								}
							}
						}
						out.append(line);
						out.append("\n");
						line = breader.readLine();
					}
					String baseUrl = tiFile.nativePath();
					if (baseUrl == null) {
						baseUrl = finalUrl;
					}
					setHtmlInternal(out.toString(), baseUrl + query, "text/html");
					return;
				} catch (IOException ioe) {
					Log.e(TAG,
						  "Problem reading from " + url + ": " + ioe.getMessage()
							  + ". Will let WebView try loading it directly.",
						  ioe);
				} finally {
					if (fis != null) {
						try {
							fis.close();
						} catch (IOException e) {
							Log.w(TAG, "Problem closing stream: " + e.getMessage(), e);
						}
					}
				}
			}
		}

		Log.d(TAG, "WebView will load " + url + " directly without code injection.", Log.DEBUG_MODE);
		// iOS parity: for whatever reason, when a remote url is used, the iOS implementation
		// explicitly sets the native webview's setScalesPageToFit to YES if the
		// Ti scalesPageToFit property has _not_ been set.
		if (!proxy.hasProperty(TiC.PROPERTY_SCALES_PAGE_TO_FIT)) {
			webView.getSettings().setLoadWithOverviewMode(true);
		}
		isLocalHTML = false;
		if (extraHeaders.size() > 0) {
			webView.loadUrl(finalUrl + query, extraHeaders);
		} else {
			webView.loadUrl(finalUrl + query);
		}
	}

	public void changeProxyUrl(String url)
	{
		if (this.proxy != null) {
			this.proxy.setProperty("url", url);
		}
		if (!TiC.URL_ANDROID_ASSET_RESOURCES.equals(url)) {
			reloadMethod = reloadTypes.URL;
			reloadData = url;
		}
	}

	public String getUrl()
	{
		return getWebView().getUrl();
	}

	private static final char[] escapeChars = new char[] { '%', '#', '\'', '?' };

	private String escapeContent(String content)
	{
		// The Android WebView has a known bug
		// where it forgets to escape certain characters
		// when it creates a data:// URL in the loadData() method
		// http://code.google.com/p/android/issues/detail?id=1733
		for (char escapeChar : escapeChars) {
			String regex = "\\" + escapeChar;
			content = content.replaceAll(regex, "%" + Integer.toHexString(escapeChar));
		}
		return content;
	}

	public void setHtml(String html)
	{
		reloadMethod = reloadTypes.HTML;
		reloadData = null;
		setHtmlInternal(html, null, "text/html");
	}

	public void setHtml(String html, HashMap<String, Object> d)
	{
		if (d == null) {
			setHtml(html);
			return;
		}

		this.reloadMethod = TiUIWebView.reloadTypes.HTML;
		this.reloadData = d;

		// Fetch optional "mimeType" property from given dictionary.
		String mimeType = "text/html";
		if (d.containsKey(TiC.PROPERTY_MIMETYPE)) {
			mimeType = TiConvert.toString(d.get(TiC.PROPERTY_MIMETYPE));
		}

		// Fetch optional "baseURL" property from given dictionary.
		String baseUrl = null;
		if (d.containsKey(TiC.PROPERTY_BASE_URL_WEBVIEW)) {
			// Read the property.
			baseUrl = TiConvert.toString(d.get(TiC.PROPERTY_BASE_URL_WEBVIEW));

			// Determine if read string is a valid URL or valid absolute file system path.
			boolean hasAbsoluteFilePath = false;
			boolean hasUrlScheme = false;
			if (baseUrl != null) {
				if (baseUrl.startsWith(File.separator)) {
					hasAbsoluteFilePath = true;
				} else {
					try {
						Uri uri = Uri.parse(baseUrl);
						hasUrlScheme = (uri.getScheme() != null);
					} catch (Exception ex) {
					}
				}
			}
			if (!hasAbsoluteFilePath && !hasUrlScheme) {
				Log.w(TAG, "WebView.setHtml() was given invalid 'baseURL': " + baseUrl);
			}

			// Check if URL references a local file and needs to be converted to a "file:" URL.
			// Can happen if given a file system path or a custom Titanium scheme such as "app:", "appdata:", etc.
			if (hasAbsoluteFilePath || (hasUrlScheme && TiFileFactory.isLocalScheme(baseUrl))) {
				// Convert custom URL scheme's relative path to absolute, if needed.
				String resolvedUrl = baseUrl;
				if (hasUrlScheme && (this.proxy != null)) {
					String newUrl = this.proxy.resolveUrl(null, baseUrl);
					if (newUrl != null) {
						resolvedUrl = newUrl;
					}
				}

				// Attempt to fetch the native "file:" path of the URL.
				TiBaseFile tiFile = TiFileFactory.createTitaniumFile(resolvedUrl, false);
				if (tiFile != null) {
					String nativePath = tiFile.nativePath();
					if (nativePath != null) {
						// We've successfully obtained the native path. Use it instead of given URL.
						baseUrl = nativePath;

						// If URL is referencing a directory, then it must end with a path separator to work.
						if (!baseUrl.endsWith(File.separator) && tiFile.isDirectory()) {
							baseUrl += File.separator;
						}
					}
				}
			}
		}

		// Load the given HTML into the WebView.
		setHtmlInternal(html, baseUrl, mimeType);
	}

	/**
	 * Loads HTML content into the web view.  Note that the "historyUrl" property
	 * must be set to non null in order for the web view history to work correctly
	 * when working with local files (IE:  goBack() and goForward() will not work if
	 * null is used)
	 *
	 * @param html					HTML data to load into the web view
	 * @param baseUrl				url to associate with the data being loaded
	 * @param mimeType			mime type of the data being loaded
	 */
	private void setHtmlInternal(String html, String baseUrl, String mimeType)
	{
		// Make sure given html argument is valid.
		if (html == null) {
			html = "";
		}

		// Fetch the WebView to apply the given HTML to.
		WebView webView = getWebView();
		if (webView == null) {
			return;
		}

		// iOS parity: for whatever reason, when html is set directly, the iOS implementation
		// explicitly sets the native webview's setScalesPageToFit to NO if the
		// Ti scalesPageToFit property has _not_ been set.
		if (this.proxy != null) {
			if (!this.proxy.hasProperty(TiC.PROPERTY_SCALES_PAGE_TO_FIT)) {
				webView.getSettings().setLoadWithOverviewMode(false);
			}
		}

		// If base URL was not provided, then default it to APK's "/assets/Resources/" directory.
		if ((baseUrl == null) || baseUrl.trim().isEmpty()) {
			baseUrl = TiC.URL_ANDROID_ASSET_RESOURCES;
			if (!baseUrl.endsWith(File.separator)) {
				baseUrl += File.separator;
			}
		}

		// Set flag to indicate that it's local html (used to determine whether we want to inject binding code)
		isLocalHTML = true;

		if (html.contains(TiWebViewBinding.SCRIPT_INJECTION_ID)) {
			// Our injection code is in there already, go ahead and show.
			webView.loadDataWithBaseURL(baseUrl, html, mimeType, "utf-8", baseUrl);
			return;
		}

		int tagStart = html.indexOf("<html");
		int tagEnd = -1;
		if (tagStart >= 0) {
			tagEnd = html.indexOf(">", tagStart + 1);

			if (tagEnd > tagStart) {
				StringBuilder sb = new StringBuilder(html.length() + 2500);
				sb.append(html.substring(0, tagEnd + 1));
				sb.append(TiWebViewBinding.SCRIPT_TAG_INJECTION_CODE);
				if ((tagEnd + 1) < html.length()) {
					sb.append(html.substring(tagEnd + 1));
				}
				webView.loadDataWithBaseURL(baseUrl, sb.toString(), mimeType, "utf-8", baseUrl);
				bindingCodeInjected = true;
				return;
			}
		}

		webView.loadDataWithBaseURL(baseUrl, html, mimeType, "utf-8", baseUrl);
	}

	public void setData(TiBlob blob)
	{
		WebView webView = getWebView();
		if (webView == null) {
			return;
		}

		reloadMethod = reloadTypes.DATA;
		reloadData = blob;
		String mimeType = "text/html";

		// iOS parity: for whatever reason, in setData, the iOS implementation
		// explicitly sets the native webview's setScalesPageToFit to YES if the
		// Ti scalesPageToFit property has _not_ been set.
		if (!proxy.hasProperty(TiC.PROPERTY_SCALES_PAGE_TO_FIT)) {
			webView.getSettings().setLoadWithOverviewMode(true);
		}

		if (blob.getType() == TiBlob.TYPE_FILE && !(blob.getInputStream() instanceof CipherInputStream)) {
			String fullPath = blob.getNativePath();
			if (fullPath != null) {
				setUrl(fullPath);
				return;
			}
		}

		if (blob.getMimeType() != null) {
			mimeType = blob.getMimeType();
		}
		if (TiMimeTypeHelper.isBinaryMimeType(mimeType)) {
			webView.loadData(blob.toBase64(), mimeType, "base64");
		} else {
			webView.loadData(escapeContent(new String(blob.getBytes())), mimeType, "utf-8");
		}
	}

	public String getJSValue(String expression)
	{
		return client.getBinding().getJSValue(expression);
	}

	public void setBasicAuthentication(String username, String password)
	{
		client.setBasicAuthentication(username, password);
	}

	public void destroyWebViewBinding()
	{
		client.getBinding().destroy();
	}

	public void setPluginState(int pluginState)
	{
		WebView webView = getWebView();
		if (webView != null) {
			WebSettings webSettings = webView.getSettings();
			switch (pluginState) {
				case PLUGIN_STATE_OFF:
					webSettings.setPluginState(WebSettings.PluginState.OFF);
					break;
				case PLUGIN_STATE_ON:
					webSettings.setPluginState(WebSettings.PluginState.ON);
					break;
				case PLUGIN_STATE_ON_DEMAND:
					webSettings.setPluginState(WebSettings.PluginState.ON_DEMAND);
					break;
				default:
					Log.w(TAG, "Not a valid plugin state. Ignoring setPluginState request");
			}
		}
	}

	public void pauseWebView()
	{
		WebView webView = getWebView();
		if (webView != null) {
			webView.onPause();
		}
	}

	public void resumeWebView()
	{
		WebView webView = getWebView();
		if (webView != null) {
			webView.onResume();
		}
	}

	public void setEnableZoomControls(boolean enabled)
	{
		WebView webView = getWebView();
		if (webView != null) {
			webView.getSettings().setSupportZoom(enabled);
			webView.getSettings().setBuiltInZoomControls(enabled);
		}
	}

	public void setUserAgentString(String userAgentString)
	{
		WebView currWebView = getWebView();
		if (currWebView != null) {
			currWebView.getSettings().setUserAgentString(userAgentString);
		}
	}

	public String getUserAgentString()
	{
		WebView currWebView = getWebView();
		return (currWebView != null) ? currWebView.getSettings().getUserAgentString() : "";
	}

	public void setRequestHeaders(HashMap items)
	{
		Map<String, String> map = items;
		for (Map.Entry<String, String> item : map.entrySet()) {
			extraHeaders.put(item.getKey().toString(), item.getValue().toString());
		}
	}

	public HashMap getRequestHeaders()
	{
		return extraHeaders;
	}

	public boolean canGoBack()
	{
		WebView webView = getWebView();
		return (webView != null) ? webView.canGoBack() : false;
	}

	public boolean canGoForward()
	{
		WebView webView = getWebView();
		return (webView != null) ? webView.canGoForward() : false;
	}

	public void goBack()
	{
		WebView webView = getWebView();
		if (webView != null) {
			webView.goBack();
		}
	}

	public void goForward()
	{
		WebView webView = getWebView();
		if (webView != null) {
			webView.goForward();
		}
	}

	public void reload()
	{
		switch (reloadMethod) {
			case DATA:
				if (reloadData != null && reloadData instanceof TiBlob) {
					setData((TiBlob) reloadData);
				} else {
					Log.d(TAG, "reloadMethod points to data but reloadData is null or of wrong type. Calling default",
						  Log.DEBUG_MODE);
					getWebView().reload();
				}
				break;

			case HTML:
				if (reloadData == null || (reloadData instanceof HashMap<?, ?>)) {
					setHtml(TiConvert.toString(getProxy().getProperty(TiC.PROPERTY_HTML)),
							(HashMap<String, Object>) reloadData);
				} else {
					Log.d(TAG, "reloadMethod points to html but reloadData is of wrong type. Calling default",
						  Log.DEBUG_MODE);
					getWebView().reload();
				}
				break;

			case URL:
				if (reloadData != null && reloadData instanceof String) {
					setUrl((String) reloadData);
				} else {
					Log.d(TAG, "reloadMethod points to url but reloadData is null or of wrong type. Calling default",
						  Log.DEBUG_MODE);
					getWebView().reload();
				}
				break;

			default:
				getWebView().reload();
		}
	}

	public void stopLoading()
	{
		WebView webView = getWebView();
		if (webView != null) {
			webView.getHandler().post(webView::stopLoading);
		}
	}

	public boolean shouldInjectBindingCode()
	{
		return isLocalHTML && !bindingCodeInjected;
	}

	public void setBindingCodeInjected(boolean injected)
	{
		bindingCodeInjected = injected;
		initScale = getZoomLevel();
	}

	public boolean interceptOnBackPressed()
	{
		return chromeClient.interceptOnBackPressed();
	}

	public int getProgress()
	{
		WebView webView = getWebView();
		return (webView != null) ? webView.getProgress() : 0;
	}

	@Override
	protected void disableHWAcceleration()
	{
		Log.d(TAG, "Do not disable HW acceleration for WebView.", Log.DEBUG_MODE);
	}
}

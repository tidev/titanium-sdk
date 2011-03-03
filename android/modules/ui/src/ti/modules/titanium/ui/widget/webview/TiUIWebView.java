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

import android.content.Context;
import android.graphics.Color;
import android.net.Uri;
import android.webkit.WebSettings;
import android.webkit.WebView;

public class TiUIWebView extends TiUIView {

	private static final String LCAT = "TiUIWebView";
	private static final boolean DBG = TiConfig.LOGD;
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
		settings.setBuiltInZoomControls(true);
		settings.setUseWideViewPort(true);
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

		if (d.containsKey(TiC.PROPERTY_URL)) {
			setUrl(TiConvert.toString(d, TiC.PROPERTY_URL));
		} else if (d.containsKey(TiC.PROPERTY_HTML)) {
			setHtml(TiConvert.toString(d, TiC.PROPERTY_HTML));
		} else if (d.containsKey(TiC.PROPERTY_DATA)) {
			Object value = d.get(TiC.PROPERTY_DATA);
			if (value instanceof TiBlob) {
				setData((TiBlob)value);
			}
		}

		// If TiUIView's processProperties ended up making a TiBackgroundDrawable
		// for the background, we must set the WebView background color to transparent
		// in order to see any of it.
		if (nativeView != null && nativeView.getBackground() instanceof TiBackgroundDrawable) {
			nativeView.setBackgroundColor(Color.TRANSPARENT);
		}
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy) {
		if (TiC.PROPERTY_URL.equals(key) && !changingUrl) {
			setUrl(TiConvert.toString(newValue));
		} else if (TiC.PROPERTY_HTML.equals(key)) {
			setHtml(TiConvert.toString(newValue));
		} else if (TiC.PROPERTY_DATA.equals(key)) {
			if (newValue instanceof TiBlob) {
				setData((TiBlob)newValue);
			}
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

		setHtml(html, "file:///android_asset/Resources/");
	}

	private void setHtml(String html, String baseUrl)
	{
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

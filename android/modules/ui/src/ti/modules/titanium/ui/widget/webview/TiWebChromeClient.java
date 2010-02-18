/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.webview;

import java.lang.ref.SoftReference;

import org.appcelerator.titanium.TiActivity;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;


import android.app.Activity;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

public class TiWebChromeClient extends WebChromeClient {

	private static final String LCAT = "TiWebChromeClient";
	private static final boolean DBG = TiConfig.LOGD;

	private SoftReference<Activity> softActivity;
	private boolean isWindow;
	private boolean showProgress;

	public TiWebChromeClient(TiUIWebView webView) {
		this(webView, false, true);
	}

	public TiWebChromeClient(TiUIWebView webView, boolean isWindow, boolean showProgress) {
		super();
		this.softActivity = new SoftReference<Activity>(webView.getProxy().getTiContext().getRootActivity());
		this.isWindow = isWindow;
		this.showProgress = showProgress;
	}

    @Override
	public void onProgressChanged(WebView view, final int newProgress)
    {
    	if (isWindow && showProgress) {
			//super.onProgressChanged(view, newProgress);
    		final Activity activity = softActivity.get();
    		if (activity != null) {
				if (newProgress < 100) {
					activity.runOnUiThread(new Runnable(){
						public void run() {
							activity.setProgressBarVisibility(true);
							activity.setProgressBarIndeterminateVisibility(true);
							activity.setProgress(newProgress * 100);
						}});
				} else {
					activity.runOnUiThread(new Runnable(){
						public void run() {
							activity.setProgress(newProgress * 100);
						}});
				}
    		}
    	}
	}

	public boolean onJsAlert(WebView view, String url, String message, final android.webkit.JsResult result)
    {
		Log.i(LCAT, message);
   		result.confirm();
        return true;
    }
}


/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium;

import java.lang.ref.SoftReference;

import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumActivityHelper;

import android.app.Activity;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

public class TiWebChromeClient extends WebChromeClient {

	private static final String LCAT = "TiWebChromeClient";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private SoftReference<Activity> softActivity;
	private boolean isWindow;

	public TiWebChromeClient(TitaniumActivity activity) {
		this(activity, false);
	}

	public TiWebChromeClient(TitaniumActivity activity, boolean isWindow) {
		super();
		this.softActivity = new SoftReference<Activity>(TitaniumActivityHelper.getRootActivity(activity));
		this.isWindow = isWindow;
	}

    @Override
	public void onProgressChanged(WebView view, final int newProgress)
    {
    	if (isWindow) {
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

	@Override
	public void onReceivedTitle(WebView view, String title) {
		super.onReceivedTitle(view, title);
		Activity activity = softActivity.get();
		if (activity != null) {
			activity.setTitle(title);
		}
	};


}

/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium;

import org.appcelerator.titanium.util.TitaniumActivityHelper;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import org.appcelerator.titanium.config.TitaniumConfig;
import android.util.Log;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

public class TiWebChromeClient extends WebChromeClient {

	private static final String LCAT = "TiWebChromeClient";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private Activity activity;
	public TiWebChromeClient(TitaniumActivity activity) {
		super();
		this.activity = TitaniumActivityHelper.getTitaniumActivityGroup(activity);
	}

    @Override
	public void onProgressChanged(WebView view, final int newProgress)
    {
		//super.onProgressChanged(view, newProgress);
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

	public boolean onJsAlert(WebView view, String url, String message, final android.webkit.JsResult result)
    {
		if (DBG) {
			Log.d(LCAT, message);
		}
    	if (false) {
        new AlertDialog.Builder(activity)
            .setTitle("javaScript dialog")
            .setMessage(message)
            .setPositiveButton(android.R.string.ok,
                    new AlertDialog.OnClickListener()
                    {
                        public void onClick(DialogInterface dialog, int which)
                        {
                            result.confirm();
                        }
                    })
            .setCancelable(false)
            .create()
            .show();
    	} else {
    		result.confirm();
    	}
        return true;
    };


}

/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.webview;

import java.lang.ref.SoftReference;

import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiUIHelper;

import android.app.Activity;
import android.content.DialogInterface;
import android.content.DialogInterface.OnClickListener;
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
		this.softActivity = new SoftReference<Activity>(TiApplication.getInstance().getRootActivity());
		this.isWindow = isWindow;
		this.showProgress = showProgress;
	}
	
	/** TODO: this is at API level 8 - until then...
	@Override
	public boolean onConsoleMessage(ConsoleMessage message)
	{
		switch(message.messageLevel())
		{
			case ConsoleMessage.MessageLevel.DEBUG:
				Log.d(LCAT,message.message+" ("+message.lineNumber()+":"+message.sourceId()+")");
				break;
			case ConsoleMessage.MessageLevel.INFO:
				Log.i(LCAT,message.message+" ("+message.lineNumber()+":"+message.sourceId()+")");
				break;
		}
		return true;
	}
	*/

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
		TiUIHelper.doOkDialog("Alert", message, new OnClickListener() {
			public void onClick(DialogInterface dialog, int which) {
				result.confirm();
			}
		});
		
		return true;
	}
}


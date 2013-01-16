/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.webview;

import java.util.HashMap;

import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiUIHelper;

import ti.modules.titanium.ui.WebViewProxy;
import android.content.DialogInterface;
import android.content.DialogInterface.OnClickListener;
import android.os.Message;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

public class TiWebChromeClient extends WebChromeClient
{
	private static final String TAG = "TiWebChromeClient";
	private static final String CONSOLE_TAG = TAG + ".console";

	private TiUIWebView tiWebView;

	public TiWebChromeClient(TiUIWebView webView)
	{
		super();
		this.tiWebView = webView;
	}
	
	@Override
	public void onGeolocationPermissionsShowPrompt(String origin, android.webkit.GeolocationPermissions.Callback callback) {
	     callback.invoke(origin, true, false);
	}

	@Override
	public boolean onConsoleMessage(ConsoleMessage message)
	{
		switch (message.messageLevel()) {
			case DEBUG:
				Log.d(CONSOLE_TAG, message.message() + " (" + message.lineNumber() + ":" + message.sourceId() + ")");
				break;
			default:
				Log.i(CONSOLE_TAG, message.message() + " (" + message.lineNumber() + ":"+ message.sourceId() + ")");
				break;
		}
		return true;
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

	// This exposes onCreateWindow to JS with a similar API to Android:
	// If the end-developer sets the 'onCreateWindow' property of the WebViewProxy
	// to a callback function, then it gets executed when a new window is created
	// by the WebView (generally, when a link is clicked that has a non-existent target such as _blank)
	// If the end-developer wants to open a new window, they can simply create a WebViewProxy,
	// along with any other supporting views, and return the proxy from their callback.
	// Otherwise, they can return null (or anything other than a WebViewProxy), and nothing will happen
	@Override
	public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg)
	{
		TiViewProxy proxy = tiWebView.getProxy();
		if (proxy == null) {
			return false;
		}

		Object onCreateWindow = proxy.getProperty(TiC.PROPERTY_ON_CREATE_WINDOW);
		if (!(onCreateWindow instanceof KrollFunction)) {
			return false;
		}

		KrollFunction onCreateWindowFunction = (KrollFunction) onCreateWindow;
		HashMap<String, Object> args = new HashMap<String, Object>();
		args.put(TiC.EVENT_PROPERTY_IS_DIALOG, isDialog);
		args.put(TiC.EVENT_PROPERTY_IS_USER_GESTURE, isUserGesture);

		Object result = onCreateWindowFunction.call(proxy.getKrollObject(), args);
		if (result instanceof WebViewProxy) {
			WebViewProxy newProxy = (WebViewProxy) result;
			newProxy.setPostCreateMessage(resultMsg);
			return true;
		}

		return false;
	}
}


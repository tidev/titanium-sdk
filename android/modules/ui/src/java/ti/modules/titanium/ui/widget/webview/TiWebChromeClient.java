/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.webview;

import java.util.HashMap;

import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiUIHelper;

import ti.modules.titanium.ui.WebViewProxy;
import android.app.Activity;
import android.content.DialogInterface;
import android.content.DialogInterface.OnClickListener;
import android.graphics.Color;
import android.os.Message;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebStorage.QuotaUpdater;
import android.webkit.WebView;
import android.widget.FrameLayout;

public class TiWebChromeClient extends WebChromeClient
{
	private static final String TAG = "TiWebChromeClient";
	private static final String CONSOLE_TAG = TAG + ".console";

	private TiUIWebView tiWebView;
	private FrameLayout mCustomViewContainer;
	private CustomViewCallback mCustomViewCallback;
	private View mCustomView;

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
	
	@Override
	public void onExceededDatabaseQuota(String url, String databaseIdentifier, long currentQuota, long estimatedSize, long totalUsedQuota, QuotaUpdater quotaUpdater)
	{
		quotaUpdater.updateQuota(estimatedSize * 2);
	}

	@Override
	public void onShowCustomView(View view, CustomViewCallback callback)
	{
		tiWebView.getWebView().setVisibility(View.GONE);

		// If a view already existed then immediately terminate the new one.
		if (mCustomView != null) {
			callback.onCustomViewHidden();
			return;
		}

		Activity activity = tiWebView.getProxy().getActivity();
		FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
		if (activity instanceof TiBaseActivity) {
			if (mCustomViewContainer == null) {
				mCustomViewContainer = new FrameLayout(activity);
				mCustomViewContainer.setBackgroundColor(Color.BLACK);
				mCustomViewContainer.setLayoutParams(params);
				activity.getWindow().addContentView(mCustomViewContainer, params);
			}
			mCustomViewContainer.addView(view);
			mCustomView = view;
			mCustomViewCallback = callback;
			mCustomViewContainer.setVisibility(View.VISIBLE);
		}
	}

	@Override
	public void onHideCustomView()
	{
		if (mCustomView == null) {
			return;
		}

		// Hide the custom view and remove it from its container.
		mCustomView.setVisibility(View.GONE);
		mCustomViewContainer.removeView(mCustomView);
		mCustomView = null;
		mCustomViewContainer.setVisibility(View.GONE);
		mCustomViewCallback.onCustomViewHidden();

		tiWebView.getWebView().setVisibility(View.VISIBLE);
	}

	public boolean interceptOnBackPressed()
	{
		if (mCustomView != null) {
			onHideCustomView();
			if (Log.isDebugModeEnabled()) {
				Log.d(TAG, "WebView intercepts the OnBackPressed event to close the full-screen video.");
			}
			return true;
		}
		return false;
	}
}


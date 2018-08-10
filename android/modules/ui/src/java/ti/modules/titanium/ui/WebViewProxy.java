/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2020 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import android.app.Activity;
import android.os.Build;
import android.os.Handler;
import android.os.Message;
import android.webkit.ValueCallback;
import android.webkit.WebView;
import java.util.HashMap;
import java.util.Map;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiLifecycle.OnLifecycleEvent;
import org.appcelerator.titanium.TiLifecycle.interceptOnBackPressedEvent;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;
import ti.modules.titanium.ui.widget.webview.TiUIWebView;

@Kroll.proxy(creatableInModule = UIModule.class,
	propertyAccessors = {
		TiC.PROPERTY_BLACKLISTED_URLS,
		TiC.PROPERTY_DATA,
		TiC.PROPERTY_ON_CREATE_WINDOW,
		TiC.PROPERTY_SCALES_PAGE_TO_FIT,
		TiC.PROPERTY_URL,
		TiC.PROPERTY_WEBVIEW_IGNORE_SSL_ERROR,
		TiC.PROPERTY_OVER_SCROLL_MODE,
		TiC.PROPERTY_CACHE_MODE,
		TiC.PROPERTY_LIGHT_TOUCH_ENABLED,
		TiC.PROPERTY_ON_LINK,
		TiC.PROPERTY_ACCEPT_THIRD_PARTY_COOKIES
})
public class WebViewProxy extends ViewProxy implements Handler.Callback, OnLifecycleEvent, interceptOnBackPressedEvent
{
	private static final String TAG = "WebViewProxy";
	private static final int MSG_FIRST_ID = ViewProxy.MSG_LAST_ID + 1;

	private static final int MSG_GO_BACK = MSG_FIRST_ID + 101;
	private static final int MSG_GO_FORWARD = MSG_FIRST_ID + 102;
	private static final int MSG_RELOAD = MSG_FIRST_ID + 103;
	private static final int MSG_STOP_LOADING = MSG_FIRST_ID + 104;
	private static final int MSG_RELEASE = MSG_FIRST_ID + 110;

	protected static final int MSG_LAST_ID = MSG_FIRST_ID + 999;
	private static String fusername;
	private static String fpassword;
	private static int frequestID = 0;
	private static Map<Integer, EvalJSRunnable> fevalJSRequests = new HashMap<Integer, EvalJSRunnable>();

	private Message postCreateMessage;

	public static final String OPTIONS_IN_SETHTML = "optionsInSetHtml";

	public WebViewProxy()
	{
		super();
		defaultValues.put(TiC.PROPERTY_OVER_SCROLL_MODE, 0);
		defaultValues.put(TiC.PROPERTY_LIGHT_TOUCH_ENABLED, true);
		defaultValues.put(TiC.PROPERTY_ENABLE_JAVASCRIPT_INTERFACE, true);
		defaultValues.put(TiC.PROPERTY_DISABLE_CONTEXT_MENU, false);
		defaultValues.put(TiC.PROPERTY_ZOOM_LEVEL, 1.0);
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		((TiBaseActivity) activity).addOnLifecycleEventListener(this);
		((TiBaseActivity) activity).addInterceptOnBackPressedEventListener(this);
		TiUIWebView webView = new TiUIWebView(this);

		if (postCreateMessage != null) {
			sendPostCreateMessage(webView.getWebView(), postCreateMessage);
			postCreateMessage = null;
		}

		return webView;
	}

	public TiUIWebView getWebView()
	{
		return (TiUIWebView) getOrCreateView();
	}

	@Kroll.method
	public Object evalJS(String code, @Kroll.argument(optional = true) KrollFunction callback)
	{
		// If the view doesn't even exist yet,
		// or if it once did exist but doesn't anymore
		// (like if the proxy was removed from a parent),
		// we absolutely should not try to get a JS value
		// from it.
		TiUIWebView view = (TiUIWebView) peekView();
		if (view == null) {
			Log.w(TAG, "WebView not available, returning null for evalJS result.");
			return null;
		}
		if (callback != null) {
			EvalJSRunnable runnable = new EvalJSRunnable(view, getKrollObject(), code, callback);
			if (Build.VERSION.SDK_INT >= 19) {
				// When on Android 4.4 we can use the builtin evalAsync method!
				runnable.runAsync();
			} else {
				// Just do our sync eval in a separate Thread. Doesn't need to be done in UI
				Thread clientThread = new Thread(runnable, "TiWebViewProxy-" + System.currentTimeMillis());
				clientThread.setPriority(Thread.MIN_PRIORITY);
				clientThread.start();
			}
			return null;
		}
		// TODO deprecate the sync variant?
		return view.getJSValue(code);
	}

	private class EvalJSRunnable implements Runnable
	{
		private final TiUIWebView view;
		private final KrollObject krollObject;
		private final String code;
		private final KrollFunction callback;

		public EvalJSRunnable(TiUIWebView view, KrollObject krollObject, String code, KrollFunction callback)
		{
			this.view = view;
			this.krollObject = krollObject;
			this.code = code;
			this.callback = callback;
		}

		public void run()
		{
			// Runs the "old" API we built
			String result = view.getJSValue(code);
			callback.callAsync(krollObject, new Object[] { result });
		}

		public void runAsync()
		{
			// Runs the newer API provided by Android
			view.getWebView().evaluateJavascript(code, new ValueCallback<String>() {
				public void onReceiveValue(String value)
				{
					callback.callAsync(krollObject, new Object[] { value });
				}
			});
		}
	}

	@Kroll.method
	@Kroll.getProperty
	public String getHtml()
	{
		if (hasProperty(TiC.PROPERTY_HTML)) {
			return TiConvert.toString(getProperty(TiC.PROPERTY_HTML));
		}

		TiUIView view = peekView();
		if (view instanceof TiUIWebView) {
			return ((TiUIWebView) view).getJSValue("document.documentElement.outerHTML");
		}

		return null;
	}

	@Kroll.setProperty
	public void setHtml(String html)
	{
		setHtml(html, null);
	}

	@Kroll.method
	public void setHtml(String html, @Kroll.argument(optional = true) KrollDict optionalSettings)
	{
		// Store given values to proxy's property dictionary.
		setProperty(TiC.PROPERTY_HTML, html);
		setProperty(OPTIONS_IN_SETHTML, optionalSettings);

		// Load given HTML into WebView if it exists.
		// Note: If WebView hasn't been created yet, then properties set above will be loaded via processProperties().
		TiUIView view = peekView();
		if (view instanceof TiUIWebView) {
			((TiUIWebView) view).setHtml(html, optionalSettings);
		}
	}

	@Override
	public boolean handleMessage(Message msg)
	{
		if (peekView() != null) {
			switch (msg.what) {
				case MSG_GO_BACK:
					getWebView().goBack();
					return true;
				case MSG_GO_FORWARD:
					getWebView().goForward();
					return true;
				case MSG_RELOAD:
					getWebView().reload();
					return true;
				case MSG_STOP_LOADING:
					getWebView().stopLoading();
					return true;
				case MSG_RELEASE:
					TiUIWebView webView = (TiUIWebView) peekView();
					if (webView != null) {
						webView.destroyWebViewBinding();
					}
					super.releaseViews();
					return true;
			}
		}
		return super.handleMessage(msg);
	}

	@Kroll.method
	public void setBasicAuthentication(String username, String password)
	{
		if (peekView() == null) {
			// if the view is null, we cache the username/password
			fusername = username;
			fpassword = password;
			return;
		}
		clearBasicAuthentication();
		getWebView().setBasicAuthentication(username, password);
	}

	@Kroll.method
	@Kroll.setProperty
	public void setUserAgent(String userAgent)
	{
		TiUIWebView currWebView = getWebView();
		if (currWebView != null) {
			currWebView.setUserAgentString(userAgent);
		}
	}

	@Kroll.method
	@Kroll.getProperty
	public String getUserAgent()
	{
		TiUIWebView currWebView = getWebView();
		if (currWebView != null) {
			return currWebView.getUserAgentString();
		}
		return "";
	}

	@Kroll.method
	@Kroll.setProperty
	public void setRequestHeaders(HashMap params)
	{
		if (params != null) {
			TiUIWebView currWebView = getWebView();
			if (currWebView != null) {
				currWebView.setRequestHeaders(params);
			}
		}
	}

	@Kroll.method
	@Kroll.getProperty
	public HashMap getRequestHeaders()
	{
		TiUIWebView currWebView = getWebView();
		if (currWebView != null) {
			return currWebView.getRequestHeaders();
		}
		return new HashMap<String, String>();
	}

	@Kroll.method
	public boolean canGoBack()
	{
		if (peekView() != null) {
			return getWebView().canGoBack();
		}
		return false;
	}

	@Kroll.method
	public boolean canGoForward()
	{
		if (peekView() != null) {
			return getWebView().canGoForward();
		}
		return false;
	}

	@Kroll.method
	public void goBack()
	{
		getMainHandler().sendEmptyMessage(MSG_GO_BACK);
	}

	@Kroll.method
	public void goForward()
	{
		getMainHandler().sendEmptyMessage(MSG_GO_FORWARD);
	}

	@Kroll.method
	public void reload()
	{
		getMainHandler().sendEmptyMessage(MSG_RELOAD);
	}

	@Kroll.method
	public void stopLoading()
	{
		getMainHandler().sendEmptyMessage(MSG_STOP_LOADING);
	}

	@Kroll.method
	@Kroll.getProperty
	public int getPluginState()
	{
		int pluginState = TiUIWebView.PLUGIN_STATE_OFF;

		if (hasProperty(TiC.PROPERTY_PLUGIN_STATE)) {
			pluginState = TiConvert.toInt(getProperty(TiC.PROPERTY_PLUGIN_STATE));
		}

		return pluginState;
	}

	@Kroll.method
	@Kroll.setProperty
	public void setDisableContextMenu(boolean disableContextMenu)
	{
		setPropertyAndFire(TiC.PROPERTY_DISABLE_CONTEXT_MENU, disableContextMenu);
	}

	@Kroll.method
	@Kroll.getProperty
	public boolean getDisableContextMenu()
	{
		if (hasPropertyAndNotNull(TiC.PROPERTY_DISABLE_CONTEXT_MENU)) {
			return TiConvert.toBoolean(getProperty(TiC.PROPERTY_DISABLE_CONTEXT_MENU));
		}
		return false;
	}

	@Kroll.method
	@Kroll.setProperty
	public void setPluginState(int pluginState)
	{
		switch (pluginState) {
			case TiUIWebView.PLUGIN_STATE_OFF:
			case TiUIWebView.PLUGIN_STATE_ON:
			case TiUIWebView.PLUGIN_STATE_ON_DEMAND:
				setPropertyAndFire(TiC.PROPERTY_PLUGIN_STATE, pluginState);
				break;
			default:
				setPropertyAndFire(TiC.PROPERTY_PLUGIN_STATE, TiUIWebView.PLUGIN_STATE_OFF);
		}
	}

	@Kroll.method
	public void pause()
	{
		if (peekView() != null) {
			getWebView().pauseWebView();
		}
	}

	@Kroll.method
	public void resume()
	{
		if (peekView() != null) {
			getWebView().resumeWebView();
		}
	}

	@Kroll.method(runOnUiThread = true)
	@Kroll.setProperty(runOnUiThread = true)
	public void setEnableZoomControls(boolean enabled)
	{
		setPropertyAndFire(TiC.PROPERTY_ENABLE_ZOOM_CONTROLS, enabled);
	}

	@Kroll.method
	@Kroll.getProperty
	public boolean getEnableZoomControls()
	{
		boolean enabled = true;

		if (hasProperty(TiC.PROPERTY_ENABLE_ZOOM_CONTROLS)) {
			enabled = TiConvert.toBoolean(getProperty(TiC.PROPERTY_ENABLE_ZOOM_CONTROLS));
		}
		return enabled;
	}

	@Kroll.method
	@Kroll.getProperty
	public float getZoomLevel()
	{
		TiUIView v = peekView();
		if (v != null) {
			return TiConvert.toFloat(getProperty(TiC.PROPERTY_ZOOM_LEVEL), 1.0f);
		} else {
			return 1.0f;
		}
	}

	@Kroll.method
	@Kroll.setProperty
	public void setZoomLevel(float value)
	{
		setProperty(TiC.PROPERTY_ZOOM_LEVEL, value);

		// If the web view has not been created yet, don't set html here. It will be set in processProperties() when the
		// view is created.
		TiUIView v = peekView();
		if (v != null) {
			((TiUIWebView) v).zoomBy(value);
		}
	}

	@Kroll.getProperty
	public double getProgress()
	{
		TiUIView v = peekView();
		if (v != null) {
			return (double) ((TiUIWebView) v).getProgress() / 100.0d;
		} else {
			return 0.0d;
		}
	}

	public void clearBasicAuthentication()
	{
		fusername = null;
		fpassword = null;
	}

	public String getBasicAuthenticationUserName()
	{
		return fusername;
	}

	public String getBasicAuthenticationPassword()
	{
		return fpassword;
	}

	public void setPostCreateMessage(Message postCreateMessage)
	{
		if (view != null) {
			sendPostCreateMessage(getWebView().getWebView(), postCreateMessage);
		} else {
			this.postCreateMessage = postCreateMessage;
		}
	}

	private static void sendPostCreateMessage(WebView view, Message postCreateMessage)
	{
		WebView.WebViewTransport transport = (WebView.WebViewTransport) postCreateMessage.obj;
		if (transport != null) {
			transport.setWebView(view);
		}
		postCreateMessage.sendToTarget();
	}

	/**
	 * Don't release the web view when it's removed. TIMOB-7808
	 */
	@Override
	public void releaseViews()
	{
	}

	@Kroll.method
	public void release()
	{
		if (TiApplication.isUIThread()) {
			super.releaseViews();
		} else {
			getMainHandler().sendEmptyMessage(MSG_RELEASE);
		}
	}

	@Override
	public boolean interceptOnBackPressed()
	{
		TiUIWebView view = (TiUIWebView) peekView();
		if (view == null) {
			return false;
		}
		return view.interceptOnBackPressed();
	}

	@Override
	public void onStart(Activity activity)
	{
	}

	@Override
	public void onResume(Activity activity)
	{
		resume();
	}

	@Override
	public void onPause(Activity activity)
	{
		pause();
	}

	@Override
	public void onStop(Activity activity)
	{
	}

	@Override
	public void onDestroy(Activity activity)
	{
		TiUIWebView webView = (TiUIWebView) peekView();
		if (webView == null) {
			return;
		}

		// We allow JS polling to continue until we exit the app. If we want to stop the polling when the app is
		// backgrounded, we would need to move this to onStop(), and add the appropriate logic in onResume() to restart
		// the polling.
		webView.destroyWebViewBinding();

		WebView nativeWebView = webView.getWebView();
		if (nativeWebView == null) {
			return;
		}

		nativeWebView.stopLoading();
		super.releaseViews();
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.WebView";
	}
}

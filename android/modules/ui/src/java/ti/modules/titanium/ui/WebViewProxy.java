/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.webview.TiUIWebView;
import android.app.Activity;
import android.os.Handler;
import android.os.Message;

@Kroll.proxy(creatableInModule=UIModule.class, propertyAccessors = {
	TiC.PROPERTY_DATA,
	TiC.PROPERTY_SCALES_PAGE_TO_FIT,
	TiC.PROPERTY_URL
})
public class WebViewProxy extends ViewProxy
	implements Handler.Callback
{
	private static final String TAG = "WebViewProxy";
	private static final int MSG_FIRST_ID = ViewProxy.MSG_LAST_ID + 1;

	private static final int MSG_GO_BACK = MSG_FIRST_ID + 101;
	private static final int MSG_GO_FORWARD = MSG_FIRST_ID + 102;
	private static final int MSG_RELOAD = MSG_FIRST_ID + 103;
	private static final int MSG_STOP_LOADING = MSG_FIRST_ID + 104;

	protected static final int MSG_LAST_ID = MSG_FIRST_ID + 999;
	private static String fusername;
	private static String fpassword;

	public WebViewProxy()
	{
		super();
	}

	public WebViewProxy(TiContext context)
	{
		this();
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		TiUIWebView webView = new TiUIWebView(this);
		webView.focus();
		return webView;
	}

	public TiUIWebView getWebView()
	{
		return (TiUIWebView) getOrCreateView();
	}

	@Kroll.method
	public Object evalJS(String code)
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
		return view.getJSValue(code);
	}

	@Kroll.method @Kroll.getProperty
	public String getHtml()
	{
		if (!hasProperty(TiC.PROPERTY_HTML)) {
			return getWebView().getJSValue("document.documentElement.outerHTML");
		}
		return (String) getProperty(TiC.PROPERTY_HTML);
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

	@Kroll.method @Kroll.setProperty
	public void setUserAgent(String userAgent)
	{
		TiUIWebView currWebView = getWebView();
		if (currWebView != null) {
			currWebView.setUserAgentString(userAgent);
		}
	}

	@Kroll.method @Kroll.getProperty
	public String getUserAgent()
	{
		TiUIWebView currWebView = getWebView();
		return (currWebView != null) ? currWebView.getUserAgentString() : "";
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

	@Kroll.method @Kroll.getProperty
	public int getPluginState()
	{
		int pluginState = TiUIWebView.PLUGIN_STATE_OFF;

		if (hasProperty(TiC.PROPERTY_PLUGIN_STATE)) {
			pluginState = TiConvert.toInt(getProperty(TiC.PROPERTY_PLUGIN_STATE));
		}

		return pluginState;
	}

	@Kroll.method @Kroll.setProperty
	public void setPluginState(int pluginState)
	{
		switch(pluginState) {
			case TiUIWebView.PLUGIN_STATE_OFF :
			case TiUIWebView.PLUGIN_STATE_ON :
			case TiUIWebView.PLUGIN_STATE_ON_DEMAND :
				setProperty(TiC.PROPERTY_PLUGIN_STATE, pluginState, true);
				break;
			default:
				setProperty(TiC.PROPERTY_PLUGIN_STATE, TiUIWebView.PLUGIN_STATE_OFF, true);
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
	

	@Kroll.method(runOnUiThread=true) @Kroll.setProperty(runOnUiThread=true)
	public void setEnableZoomControls(boolean enabled)
	{
		setProperty(TiC.PROPERTY_ENABLE_ZOOM_CONTROLS, enabled, true);
	}

	@Kroll.method @Kroll.getProperty
	public boolean getEnableZoomControls()
	{
		boolean enabled = true;

		if(hasProperty(TiC.PROPERTY_ENABLE_ZOOM_CONTROLS)) {
			enabled = TiConvert.toBoolean(getProperty(TiC.PROPERTY_ENABLE_ZOOM_CONTROLS));
		}
		return enabled;
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

}

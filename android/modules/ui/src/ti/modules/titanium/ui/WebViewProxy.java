/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.webview.TiUIWebView;
import android.app.Activity;
import android.os.Handler;
import android.os.Message;

@Kroll.proxy(creatableInModule="UI")
public class WebViewProxy extends ViewProxy
	implements Handler.Callback
{

	private static final int MSG_FIRST_ID = ViewProxy.MSG_LAST_ID + 1;

	private static final int MSG_EVAL_JS = MSG_FIRST_ID + 100;
	private static final int MSG_GO_BACK = MSG_FIRST_ID + 101;
	private static final int MSG_GO_FORWARD = MSG_FIRST_ID + 102;
	private static final int MSG_RELOAD = MSG_FIRST_ID + 103;
	private static final int MSG_STOP_LOADING = MSG_FIRST_ID + 104;
	
	protected static final int MSG_LAST_ID = MSG_FIRST_ID + 999;

	public WebViewProxy(TiContext context) {
		super(context);
	}

	@Override
	public TiUIView createView(Activity activity) {
		TiUIWebView webView = new TiUIWebView(this);
		webView.focus();
		return webView;
	}

	public TiUIWebView getWebView() {
		return (TiUIWebView)getView(getTiContext().getActivity());
	}

	@Kroll.method
	public Object evalJS(String code) {
		if (getTiContext().isUIThread()) {
			return getWebView().getJSValue(code);
		} else {
			AsyncResult result = new AsyncResult(code);
			Message msg = getUIHandler().obtainMessage(MSG_EVAL_JS, result);
			msg.obj = result;
			msg.sendToTarget();
			return result.getResult();
		}
	}

	@Override
	public boolean handleMessage(Message msg) {
		switch (msg.what) {
			case MSG_EVAL_JS:
				AsyncResult result = (AsyncResult)msg.obj;
				String value = getWebView().getJSValue((String)result.getArg());
				result.setResult(value);
				return true;
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
		return super.handleMessage(msg);
	}
	
	@Kroll.method
	public void setBasicAuthentication(String username, String password)
	{
		getWebView().setBasicAuthentication(username, password);
	}
	
	@Kroll.method
	public boolean canGoBack() {
		return getWebView().canGoBack();
	}
	
	@Kroll.method
	public boolean canGoForward() {
		return getWebView().canGoForward();
	}
	
	@Kroll.method
	public void goBack() {
		getUIHandler().sendEmptyMessage(MSG_GO_BACK);
	}
	
	
	@Kroll.method
	public void goForward() {
		getUIHandler().sendEmptyMessage(MSG_GO_FORWARD);
	}
	
	@Kroll.method
	public void reload() {
		getUIHandler().sendEmptyMessage(MSG_RELOAD);
	}
	
	@Kroll.method
	public void stopLoading() {
		getUIHandler().sendEmptyMessage(MSG_STOP_LOADING);

	}
}

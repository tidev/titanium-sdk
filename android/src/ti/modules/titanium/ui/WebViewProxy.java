/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.webview.TiUIWebView;
import android.app.Activity;
import android.os.Handler;
import android.os.Message;

public class WebViewProxy extends ViewProxy
	implements Handler.Callback
{
	
	private static final int MSG_FIRST_ID = ViewProxy.MSG_LAST_ID + 1;

	private static final int MSG_SET_URL = MSG_FIRST_ID + 100;
	private static final int MSG_SET_HTML = MSG_FIRST_ID + 101;
	protected static final int MSG_LAST_ID = MSG_FIRST_ID + 999;
	
	public WebViewProxy(TiContext context, Object[] args) {
		super(context, args);
	}
	
	@Override
	public TiUIView createView(Activity activity) {
		return new TiUIWebView(this);
	}
	
	public TiUIWebView getWebView() {
		return (TiUIWebView)getView(getTiContext().getActivity());
	}

	public void setUrl(String url)
	{
		if (getTiContext().isUIThread()) {
			getWebView().setUrl(url);
		} else {
			AsyncResult result = new AsyncResult(getTiContext().getActivity());
			Message msg = getUIHandler().obtainMessage(MSG_SET_URL, result);
			msg.obj = url;
			msg.sendToTarget();
		}
	}
	
	public void setHtml(String html)
	{
		if (getTiContext().isUIThread()) {
			getWebView().setHtml(html);
		} else {
			AsyncResult result = new AsyncResult(getTiContext().getActivity());
			Message msg = getUIHandler().obtainMessage(MSG_SET_HTML, result);
			msg.obj = html;
			msg.sendToTarget();
			result.getResult();
		}
	}
	
	@Override
	public boolean handleMessage(Message msg) {
		switch (msg.what) {
			case MSG_SET_URL:
				getWebView().setUrl((String)msg.obj);
				return true;
			case MSG_SET_HTML:
				getWebView().setHtml((String)msg.obj);
				return true;
		}
		return super.handleMessage(msg);
	}
}

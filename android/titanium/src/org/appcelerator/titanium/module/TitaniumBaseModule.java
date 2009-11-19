/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module;

import java.util.concurrent.Semaphore;

import org.appcelerator.titanium.TitaniumActivity;
import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.TitaniumWebView;
import org.appcelerator.titanium.api.ITitaniumModule;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.Log;
import org.json.JSONObject;

import android.content.Context;
import android.os.Handler;
import android.os.Message;
import android.webkit.WebView;

public abstract class TitaniumBaseModule implements ITitaniumModule, Handler.Callback
{
	private static final String LCAT = "TiBaseModule";
	private static final boolean DBG = TitaniumConfig.LOGD;

	protected static final int FIRST_MODULE_ID = 300;

	protected TitaniumModuleManager tmm;
	protected String moduleName;

	protected Handler handler;

	protected class Holder extends Semaphore {
		private static final long serialVersionUID = 1L;
		public Holder() {
			super(0);
		}
		public Object o;

		public void setAndRelease(Object o) {
			this.o = o;
			this.release();
		}
	}

	protected TitaniumBaseModule(TitaniumModuleManager manager, String moduleName)
	{
		manager.checkThread();

		this.tmm = manager;
		this.moduleName = moduleName;
		this.handler = new Handler(this);

		manager.addModule(this);
	}

	public boolean handleMessage(Message msg) {
		return false;
	}

	public TitaniumModuleManager getModuleManager() {
		return tmm;
	}

	public TitaniumActivity getActivity() {
		return tmm.getActivity();
	}

	public TitaniumWebView getTitaniumWebView() {
		return tmm.getWebView();
	}

	public Context getContext()
	{
		Context context = null;
		TitaniumActivity activity = tmm.getActivity();
		if (activity != null) {
			context = activity;
		}
		return context;
	}

	protected Object createObject(int what)
	{
		Holder h = new Holder();
		handler.obtainMessage(what, h).sendToTarget();
		synchronized (h) {
			try {
				h.acquire();
			} catch (InterruptedException e) {
				Log.w(LCAT, "Interrupted while waiting for object construction: ", e);
			}
		}
		return h.o;
	}

	public abstract void register(WebView webView);

	/**
	 * evaluate Javascript in the context of the webview
	 */
	protected void evalJS(String js, final JSONObject data)
	{
		TitaniumWebView webView = tmm.getWebView();
		if (webView != null) {
			webView.evalJS(js, data);
		}
	}

	/**
	 * Name used during error reporting and in Javascript reference
	 */
	public String getModuleName() {
		return moduleName;
	}

	/**
	 * Forwarded from activities to allow module to be device friendly.
	 */
	public void onPause() {

	}

	/**
	 * Forwarded from activities to allow module to be device friendly.
	 */
	public void onResume() {

	}

	/**
	 * Forwarded from activities to allow module to be device friendly.
	 */
	public void onDestroy() {

	}

	protected void invokeUserCallback(String method, String data) {
		TitaniumWebView webView = tmm.getWebView();
		if (webView != null) {
			webView.evalJS(method, data);
		}
	}

	protected String createJSONError(int code, String msg)
	{
		StringBuilder sb = new StringBuilder(256);
		sb.append("{ 'code' : ")
			.append(code)
			.append(" , 'message' : '")
			.append(msg)
			.append("' }")
			;
		return sb.toString();
	}
}

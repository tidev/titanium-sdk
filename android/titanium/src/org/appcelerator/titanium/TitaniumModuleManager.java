/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium;

import java.lang.ref.SoftReference;
import java.util.ArrayList;

import org.appcelerator.titanium.api.ITitaniumModule;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.Log;

public class TitaniumModuleManager
{
	private static final String LCAT = "TiModuleMgr";
	@SuppressWarnings("unused")
	private static final boolean DBG = TitaniumConfig.LOGD;

	private ArrayList<ITitaniumModule> modules;
	private SoftReference<TitaniumActivity> softActivity;
	private SoftReference<TitaniumWebView> softWebView;

	private long creationThreadId;
	private String creationThreadName;

	public TitaniumModuleManager(TitaniumActivity activity, TitaniumWebView webView)
	{
		this.softActivity = new SoftReference<TitaniumActivity>(activity);
		this.softWebView = new SoftReference<TitaniumWebView>(webView);
		this.modules = new ArrayList<ITitaniumModule>();

		Thread t = Thread.currentThread();
		creationThreadId = t.getId();
		creationThreadName = t.getName();
	}

	public void checkThread() {
		if (creationThreadId != Thread.currentThread().getId()) {
			Thread t = Thread.currentThread();
			StringBuilder sb = new StringBuilder(256);

			sb
				.append("Modules must be constructed on the manager(ui) thread.\n This thread ")
				.append(t.getName()).append("(").append(t.getId()).append(") is not the creation thread ")
				.append(creationThreadName).append("(").append(creationThreadId).append(").")
				;

			throw new IllegalStateException(sb.toString());
		}
	}

	public TitaniumActivity getActivity() {
		return softActivity.get();
	}

	public TitaniumWebView getWebView() {
		return softWebView.get();
	}

	public void addModule(ITitaniumModule m) {
		if (! modules.contains(m)) {
			modules.add(m);
		} else {
			Log.w(LCAT, "Attempt to add duplicate module ignored: " + m.getModuleName());
		}
	}

	public void registerModules() {
		TitaniumWebView webView = softWebView.get();
		for (ITitaniumModule m : modules) {
			m.register(webView);
		}
	}

	public void onResume() {
		for (ITitaniumModule m : modules) {
			try {
				m.onResume();
			} catch (Throwable t) {
				Log.e(LCAT, "Error invoking onResume in " + m.getModuleName(), t);
			}
		}
	}

	public void onPause() {
		for (ITitaniumModule m : modules) {
			try {
				m.onPause();
			} catch (Throwable t) {
				Log.e(LCAT, "Error invoking onPause in " + m.getModuleName(), t);
			}
		}
	}

	public void onDestroy() {
		for (ITitaniumModule m : modules) {
			try {
				m.onDestroy();
			} catch (Throwable t) {
				Log.e(LCAT, "Error invoking onDestroy in " + m.getModuleName());
			}
		}
	}
}

/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium;

import java.lang.ref.SoftReference;
import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.api.ITitaniumModule;
import org.appcelerator.titanium.api.ITitaniumUIWebView;
import org.appcelerator.titanium.api.ITitaniumView;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.ui.TitaniumUIWebView;
import org.appcelerator.titanium.module.ui.TitaniumUserWindow;
import org.appcelerator.titanium.util.Log;

import android.content.Context;

public class TitaniumModuleManager
{
	private static final String LCAT = "TiModuleMgr";
	@SuppressWarnings("unused")
	private static final boolean DBG = TitaniumConfig.LOGD;

	private ArrayList<ITitaniumModule> modules;
	private SoftReference<TitaniumActivity> softActivity;
	private WeakReference<TitaniumUIWebView> weakUIWebView;
	private TitaniumWebView webView;
	private Context appContext;

	private long creationThreadId;
	private String creationThreadName;

	private static AtomicInteger idGenerator;

	public TitaniumModuleManager(TitaniumActivity activity)
	{
		this.softActivity = new SoftReference<TitaniumActivity>(activity);
		this.webView = new TitaniumWebView(this);
		//this.webView.loadDataWithBaseURL("", "<html><body</body></html>", "text/html", "UTF-8", null); //initialize with data
		this.modules = new ArrayList<ITitaniumModule>();
		this.appContext = activity.getApplicationContext();

		if (idGenerator == null) {
			idGenerator = new AtomicInteger(1);
		}

        webView.setId(idGenerator.incrementAndGet());

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

	public String generateId(String prefix) {
		return prefix + idGenerator.getAndIncrement();
	}
	public TitaniumApplication getApplication() {
		return (TitaniumApplication) getActivity().getApplication();
	}

	public TitaniumActivity getActivity() {
		return softActivity.get();
	}

	public Context getAppContext() {
		return appContext;
	}

	public TitaniumUserWindow getCurrentWindow() {
		return getActivity().getCurrentWindow();
	}

	public void setCurrentView(TitaniumUIWebView v) {
		this.weakUIWebView = new WeakReference<TitaniumUIWebView>(v);
	}

	public ITitaniumUIWebView getCurrentUIWebView() {
		return weakUIWebView.get();
	}

	public ITitaniumView getCurrentView() {
		return (ITitaniumView) weakUIWebView.get();
	}
	public TitaniumWebView getWebView() {
		return webView;
	}
	public void addModule(ITitaniumModule m) {
		if (! modules.contains(m)) {
			modules.add(m);
		} else {
			Log.w(LCAT, "Attempt to add duplicate module ignored: " + m.getModuleName());
		}
	}

	public void registerModules() {
		if (webView != null) {
			for (ITitaniumModule m : modules) {
				m.register(webView);
			}
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
		webView.onResume();
	}

	public void onPause() {
		for (ITitaniumModule m : modules) {
			try {
				m.onPause();
			} catch (Throwable t) {
				Log.e(LCAT, "Error invoking onPause in " + m.getModuleName(), t);
			}
		}
		webView.onPause();
	}

	public void onDestroy() {
		for (ITitaniumModule m : modules) {
			try {
				m.onDestroy();
			} catch (Throwable t) {
				Log.e(LCAT, "Error invoking onDestroy in " + m.getModuleName());
			}
		}
		softActivity.clear();
		weakUIWebView.clear();
		webView.onDestroy();
		appContext = null;

	}
}

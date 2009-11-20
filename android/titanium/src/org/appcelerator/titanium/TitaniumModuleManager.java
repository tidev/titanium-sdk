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
import java.util.HashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.api.ITitaniumModule;
import org.appcelerator.titanium.api.ITitaniumUIWebView;
import org.appcelerator.titanium.api.ITitaniumUserWindow;
import org.appcelerator.titanium.api.ITitaniumView;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.ui.TitaniumDelegatingUserWindow;
import org.appcelerator.titanium.module.ui.TitaniumUIWebView;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumJSRef;
import org.appcelerator.titanium.util.TitaniumJSRefCache;

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
	private WeakReference<TitaniumJSRefCache> weakObjectCache;

	private HashMap<String, Object> registeredInvocables;

	private long creationThreadId;
	private String creationThreadName;

	private static AtomicInteger idGenerator;
	private boolean isWindow;

	public TitaniumModuleManager(TitaniumActivity activity) {
		this(activity, false, true);
	}
	public TitaniumModuleManager(TitaniumActivity activity, boolean isWindow, boolean showProgress)
	{
		this.isWindow = isWindow;
		this.softActivity = new SoftReference<TitaniumActivity>(activity);
		this.webView = new TitaniumWebView(this, isWindow, showProgress);
		this.modules = new ArrayList<ITitaniumModule>();
		this.registeredInvocables = new HashMap<String, Object>();
		this.appContext = activity.getApplicationContext();

		if (idGenerator == null) {
			idGenerator = new AtomicInteger(1);
		}

        webView.setId(idGenerator.incrementAndGet());

		Thread t = Thread.currentThread();
		creationThreadId = t.getId();
		creationThreadName = t.getName();

		this.weakObjectCache = new WeakReference<TitaniumJSRefCache>(getApplication().getObjectCache());
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

	public ITitaniumUserWindow getCurrentWindow() {
		if (isWindow) {
			return getActivity().getCurrentWindow();
		} else {
			return new TitaniumDelegatingUserWindow(getActivity().getCurrentWindow(), getCurrentUIWebView());
		}
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
	public TitaniumJSRef getObjectReference(int key)
	{
		TitaniumJSRef ref = null;
		TitaniumJSRefCache cache = weakObjectCache.get();
		if (cache != null) {
			ref = cache.getReference(key);
		}

		return ref;
	}
	public Object getObject(int key) {
		Object obj = null;
		TitaniumJSRefCache cache = weakObjectCache.get();
		if (cache != null) {
			obj = cache.getObject(key);
		}

		return obj;
	}

	public int cacheObject(Object obj)
	{
		TitaniumJSRefCache cache = weakObjectCache.get();
		if (cache == null) {
			throw new IllegalStateException("Object cache is null");
		}

		TitaniumJSRef ref = new TitaniumJSRef(obj);
		cache.add(ref);
		return ref.getKey();
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

	public void registerInstance(String name, Object instance) {
		if (registeredInvocables.containsKey(name)) {
			throw new IllegalStateException("Attempt to add another object instance with name: " + name);
		}

		registeredInvocables.put(name, instance);
	}

	public Object getInstanceForName(String name) {
		return registeredInvocables.get(name);
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
		registeredInvocables.clear();
		modules.clear();
		webView.onDestroy();
		appContext = null;

	}
}

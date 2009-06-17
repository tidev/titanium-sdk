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

import android.os.Handler;
import android.util.Log;
import android.webkit.WebView;

public class TitaniumModuleManager
{
	private static final String LCAT = "TiModuleMgr";

	private ArrayList<ITitaniumModule> modules;
	private SoftReference<TitaniumActivity> softActivity;
	private SoftReference<Handler> softHandler;

	public TitaniumModuleManager(TitaniumActivity activity, Handler handler)
	{
		this.softActivity = new SoftReference<TitaniumActivity>(activity);
		this.softHandler = new SoftReference<Handler>(handler);
		this.modules = new ArrayList<ITitaniumModule>();
	}

	public TitaniumActivity getActivity() {
		return softActivity.get();
	}

	public Handler getHandler() {
		return softHandler.get();
	}
	public void addModule(ITitaniumModule m) {
		if (! modules.contains(m)) {
			modules.add(m);
		} else {
			Log.w(LCAT, "Attempt to add duplicate module ignored: " + m.getModuleName());
		}
	}

	public void registerModules() {
		WebView webView = getActivity().getWebView();
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

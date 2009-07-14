/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium;

import java.lang.ref.SoftReference;
import java.util.ArrayList;
import java.util.HashMap;

import org.appcelerator.titanium.api.ITitaniumModule;
import org.appcelerator.titanium.api.ITitaniumNativeControl;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import android.webkit.WebView;

public class TitaniumModuleManager
{
	private static final String LCAT = "TiModuleMgr";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private ArrayList<ITitaniumModule> modules;
	private SoftReference<TitaniumActivity> softActivity;
	private HashMap<String, ITitaniumNativeControl> nativeControls;
	private Handler handler;

	private long creationThreadId;
	private String creationThreadName;

	public TitaniumModuleManager(TitaniumActivity activity)
	{
		this.softActivity = new SoftReference<TitaniumActivity>(activity);
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

	public synchronized void addListener(ITitaniumNativeControl control) {
		String id = control.getHtmlId();

		if (id == null) {
			throw new IllegalArgumentException("Control must have a non-null id");
		}
		if (nativeControls == null) {
			nativeControls = new HashMap<String, ITitaniumNativeControl>();
		} else if(nativeControls.containsKey(id)) {
			throw new IllegalArgumentException("Control has already been registered id=" + id);
		}

		nativeControls.put(id, control);
		requestLayout(id);

		if (DBG) {
			Log.d(LCAT, "Native control linked to html id " + id);
		}
	}

	public synchronized void removeListener(ITitaniumNativeControl control) {
		if (nativeControls != null) {
			String id = control.getHtmlId();
			if (nativeControls.containsKey(id)) {
				nativeControls.remove(id);
				if (DBG) {
					Log.d(LCAT, "Native control unlinked from html id " + id);
				}
			} else {
				Log.w(LCAT, "Attempt to unlink a non registered control. html id " + id);
			}
		}
	}

	public synchronized void requestLayout() {
		if (nativeControls != null && nativeControls.size() > 0) {
			JSONArray a = new JSONArray();
			for (String id : nativeControls.keySet()) {
				a.put(id);
			}
			requestLayout(a);
		} else {
			if (DBG) {
				Log.d(LCAT, "No native controls, layout request ignored");
			}
		}
	}

	public synchronized void requestLayout(String id)
	{
		JSONArray a = new JSONArray();
		a.put(id);
		requestLayout(a);
	}

	protected void requestLayout(JSONArray a)
	{
		StringBuilder sb = new StringBuilder(256);
		sb.append("Titanium.sendLayoutToNative(")
			.append(a.toString())
			.append(")");

		TitaniumWebView wv = getActivity().getWebView();
		if (wv != null) {
			wv.evalJS(sb.toString());
		} else {
			Log.w(LCAT, "Unable to request layout, webview is null.");
		}
		sb.setLength(0);
	}

	public void updateNativeControls(String json) {
		try {
			JSONObject o = new JSONObject(json);
			for (String id : nativeControls.keySet()) {
				if (o.has(id)) {
					JSONObject pos = o.getJSONObject(id);
					Bundle b = new Bundle(4);
					b.putInt("top", pos.getInt("top"));
					b.putInt("left", pos.getInt("left"));
					b.putInt("width", pos.getInt("width"));
					b.putInt("height", pos.getInt("height"));

					nativeControls.get(id).handleLayoutRequest(b);
				} else {
					Log.w(LCAT, "Position data not found for id " + id);
				}
			}
		} catch (JSONException e) {
			Log.e(LCAT, "Malformed location object from Titanium.API: " + json);
		}
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

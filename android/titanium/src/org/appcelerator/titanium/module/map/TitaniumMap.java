/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module.map;

import java.util.concurrent.Semaphore;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.TitaniumBaseModule;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumActivityHelper;
import org.appcelerator.titanium.util.TitaniumDispatchException;

import android.app.LocalActivityManager;
import android.content.Intent;
import android.os.Message;
import android.view.Window;
import android.webkit.WebView;

public class TitaniumMap extends TitaniumBaseModule
{
	private static final String LCAT = "TiMap";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private static final int MSG_CREATE_MAPVIEW = 300;

	private static LocalActivityManager lam;
	private static Window mapWindow;

	class Holder extends Semaphore {
		private static final long serialVersionUID = 1L;
		public Holder() {
			super(0);
		}
		public Object o;
	}

	public TitaniumMap(TitaniumModuleManager tmm, String moduleName) {
		super(tmm, moduleName);
	}

	@Override
	public void register(WebView webView) {
		if (DBG) {
			Log.d(LCAT, "Registering TitaniumMap as " + moduleName + " using TitaniumMethod.");
		}

		tmm.registerInstance(moduleName, this);

		lam = new LocalActivityManager(TitaniumActivityHelper.getRootActivity(tmm.getActivity()), true);
		lam.dispatchCreate(null);
	}


	@Override
	public boolean handleMessage(Message msg) {
		boolean handled = super.handleMessage(msg);
		if (!handled) {
			switch(msg.what) {
			case MSG_CREATE_MAPVIEW :
				if (DBG) {
					Log.d(LCAT, "Creating MapView");
				}
				Holder h = (Holder) msg.obj;

				mapWindow = lam.startActivity("TIMAP", new Intent(tmm.getAppContext(), TitaniumMapActivity.class));
				h.o = new TitaniumMapView(tmm, mapWindow);
				handled = true;

				h.release();
				break;
			}
		}

		return handled;
	}

	private Object create(int what)
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

	public String createMapView()
	{
		if (mapWindow != null) {
			throw new TitaniumDispatchException("MapView already created. Android can only support one MapView per Application.", moduleName);
		}
		TitaniumMapView tmv = (TitaniumMapView) create(MSG_CREATE_MAPVIEW);
		String name = tmm.generateId("TitaniumMapView");
		tmm.registerInstance(name, tmv);

		return name;
	}

	@Override
	public void onDestroy() {
		super.onDestroy();
		if (mapWindow != null) {
			mapWindow.closeAllPanels();
			mapWindow = null;
		}
		if (lam != null) {
			lam.dispatchDestroy(true);
			lam.removeAllActivities();
			lam = null;
		}
	}

	@Override
	public void onPause() {
		super.onPause();
		if (lam != null) {
			lam.dispatchPause(false);
		}
	}

	@Override
	public void onResume() {
		super.onResume();
		if (lam != null) {
			lam.dispatchResume();
		}
	}
}

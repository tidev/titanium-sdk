/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumHttpClient;
import org.appcelerator.titanium.api.ITitaniumNetwork;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.net.TitaniumHttpClient;
import org.appcelerator.titanium.module.net.TitaniumNetworkListener;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumJSEventManager;
import org.json.JSONObject;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.webkit.WebView;

public class TitaniumNetwork extends TitaniumBaseModule implements ITitaniumNetwork
{
	private static final String LCAT = "TiNetwork";
	private static final boolean DBG = TitaniumConfig.LOGD;

	public static final String EVENT_CONNECTIVITY = "connectivity";

	public static final int NETWORK_NONE = 0;
	public static final int NETWORK_WIFI = 1;
	public static final int NETWORK_MOBILE = 2;
	public static final int NETWORK_LAN = 3;
	public static final int NETWORK_UNKNOWN = 4;

    public enum State {
        UNKNOWN,

        /** This state is returned if there is connectivity to any network **/
        CONNECTED,
        /**
         * This state is returned if there is no connectivity to any network. This is set
         * to true under two circumstances:
         * <ul>
         * <li>When connectivity is lost to one network, and there is no other available
         * network to attempt to switch to.</li>
         * <li>When connectivity is lost to one network, and the attempt to switch to
         * another network fails.</li>
         */
        NOT_CONNECTED
    }

	class NetInfo {
		public State state;
		public boolean failover;
		public String typeName;
		public int type;
		public String reason;

		public NetInfo() {
			state = State.UNKNOWN;
			failover = false;
			typeName = "NONE";
			type = -1;
			reason = "";
		}
	};

	private String userAgent;

	private TitaniumJSEventManager eventManager;
	private NetInfo lastNetInfo;

	private boolean isListeningForConnectivity;
	private TitaniumNetworkListener networkListener;
	private ConnectivityManager connectivityManager;

	private Handler messageHandler = new Handler() {
		public void handleMessage(Message msg)
		{
			Bundle b = msg.getData();

			boolean connected = b.getBoolean(TitaniumNetworkListener.EXTRA_CONNECTED);
			int type = b.getInt(TitaniumNetworkListener.EXTRA_NETWORK_TYPE);
			String typeName = b.getString(TitaniumNetworkListener.EXTRA_NETWORK_TYPE_NAME);
			boolean failover = b.getBoolean(TitaniumNetworkListener.EXTRA_FAILOVER);
			String reason = b.getString(TitaniumNetworkListener.EXTRA_REASON);

			// Set last state
			synchronized(lastNetInfo) {
				if (connected) {
					lastNetInfo.state = State.CONNECTED;
				} else {
					lastNetInfo.state = State.NOT_CONNECTED;
				}
				lastNetInfo.type = type;
				lastNetInfo.typeName = typeName;
				lastNetInfo.failover = failover;
				lastNetInfo.reason = reason;
			}

			JSONObject data = new JSONObject();
			try
			{
				data.put("type", EVENT_CONNECTIVITY);
				data.put("online", connected);
				data.put("type", networkTypeToTitanium(connected, type));
				data.put("typeName", typeName);
				data.put("reason", reason);
				eventManager.invokeSuccessListeners(EVENT_CONNECTIVITY, data.toString());
			}
			catch(Exception e)
			{
				Log.e(LCAT, "Error creating response json: ", e);
			}
		}
	};

	public TitaniumNetwork(TitaniumModuleManager moduleMgr, String name, String userAgent)
	{
		super(moduleMgr, name);

		this.lastNetInfo = new NetInfo();
		this.userAgent = userAgent;

		this.eventManager = new TitaniumJSEventManager(moduleMgr);
		this.eventManager.supportEvent(EVENT_CONNECTIVITY);

		this.isListeningForConnectivity = false;
	}

	@Override
	public void register(WebView webView) {
		String name = getModuleName();
		if (DBG) {
			Log.d(LCAT, "Registering TitaniumNetwork as " + name);
		}
		webView.addJavascriptInterface((ITitaniumNetwork) this, name);
	}

	public ITitaniumHttpClient createHTTPClient() {
		if (DBG) {
			Log.d(LCAT, "Returning new TitaniumHttpClient");
		}
		return new TitaniumHttpClient(getModuleManager(), userAgent);
	}

	public int addEventListener(String eventName, String eventListener) {
		int listenerId = eventManager.addListener(eventName, eventListener);
		if (!isListeningForConnectivity) {
			manageConnectivityListener(true);
		}
		return listenerId;
	}

	public void removeEventListener(String eventName, int listenerId) {
		eventManager.removeListener(eventName, listenerId);
		if (!eventManager.hasListeners(EVENT_CONNECTIVITY)) {
			manageConnectivityListener(false);
		}
	}

	public boolean isOnline()
	{
		boolean result = false;

		NetworkInfo ni = connectivityManager.getActiveNetworkInfo();

		if(ni != null && ni.isAvailable() && ni.isConnected()) {
			result = true;
		}
		return result;
	}

	protected int networkTypeToTitanium(boolean online, int androidType) {
		int type = TitaniumNetwork.NETWORK_UNKNOWN;
		if (online) {
			switch(androidType) {
			case ConnectivityManager.TYPE_WIFI :
				type = TitaniumNetwork.NETWORK_WIFI;
				break;
			case ConnectivityManager.TYPE_MOBILE :
				type = TitaniumNetwork.NETWORK_MOBILE;
				break;
			default : type = TitaniumNetwork.NETWORK_UNKNOWN;
			}
		} else {
			type = TitaniumNetwork.NETWORK_NONE;
		}
		return type;
	}

	public int getNetworkType() {
		int type = NETWORK_UNKNOWN;

		// start event needs network type. So get it if we don't have it.
		if (connectivityManager == null) {
			connectivityManager = (ConnectivityManager) getActivity().getSystemService(Context.CONNECTIVITY_SERVICE);
		}

		try {
			NetworkInfo ni = connectivityManager.getActiveNetworkInfo();
			if(ni != null && ni.isAvailable() && ni.isConnected()) {
				type = networkTypeToTitanium(true, ni.getType());
			} else {
				type = TitaniumNetwork.NETWORK_NONE;
			}
		} catch (SecurityException e) {
			Log.i(LCAT, "Permission has been removed. Cannot determine network type.");
		}
		return type;
	}

	public String getNetworkTypeName()
	{
		switch(getNetworkType()) {
		case 0 : return "NONE";
		case 1 : return "WIFI";
		case 2 : return "MOBILE";
		case 3 : return "LAN";
		default : return "UNKNOWN";
		}
	}

	public String getUserAgent ()
	{
		return this.userAgent;
	}

	protected void manageConnectivityListener(boolean attach) {
		if (attach) {
			if (!isListeningForConnectivity) {
				if (eventManager.hasListeners(EVENT_CONNECTIVITY)) {
					if (networkListener == null) {
						networkListener = new TitaniumNetworkListener(messageHandler);
					}
					networkListener.attach(getActivity().getApplicationContext());
					isListeningForConnectivity = true;
					if (DBG) {
						Log.d(LCAT, "Resuming: adding connectivity listener");
					}
				}
			}
		} else {
			if (isListeningForConnectivity) {
				networkListener.detach();
				isListeningForConnectivity = false;
				if (DBG) {
					Log.d(LCAT, "Pausing: removing connectivity listener.");
				}
			}
		}
	}

	private ConnectivityManager getConnectivityManager() {
		return (ConnectivityManager) getActivity().getSystemService(Context.CONNECTIVITY_SERVICE);
	}

	@Override
	public void onResume() {
		super.onResume();
		connectivityManager = getConnectivityManager();
		manageConnectivityListener(true);
	}

	@Override
	public void onPause() {
		manageConnectivityListener(false);
		connectivityManager = null;
	}

	@Override
	public void onDestroy() {
		super.onDestroy();

		eventManager.clear();
	}
}

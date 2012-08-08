/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.network;
 
import org.appcelerator.kroll.common.Log;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
 
/**
 * A wrapper for a broadcast receiver that provides network connectivity
 * state information, independent of network type (mobile, Wi-Fi, etc.).
 * {@hide}
 */
public class TiNetworkListener {
    private static final String TAG = "TiNetListener";
 
    public static final String EXTRA_CONNECTED = "connected";
    public static final String EXTRA_NETWORK_TYPE = "networkType";
    public static final String EXTRA_NETWORK_TYPE_NAME = "networkTypeName";
    public static final String EXTRA_FAILOVER = "failover";
    public static final String EXTRA_REASON = "reason";
 
    private IntentFilter connectivityIntentFilter;
    private ConnectivityBroadcastReceiver receiver;
 
    private Handler messageHandler;
    private Context context; // null on release, might need to be softRef.
    private boolean listening;
 
    private class ConnectivityBroadcastReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent)
        {
            String action = intent.getAction();
 
            if (!action.equals(ConnectivityManager.CONNECTIVITY_ACTION)) {
                 return;
            }
 
            if (messageHandler == null) {
            	Log.w(TAG, "Network receiver is active but no handler has been set.");
            	return;
            }
 
           boolean noConnectivity =
            	intent.getBooleanExtra(ConnectivityManager.EXTRA_NO_CONNECTIVITY, false);
            NetworkInfo networkInfo = (NetworkInfo)
            	intent.getParcelableExtra(ConnectivityManager.EXTRA_NETWORK_INFO);
            NetworkInfo otherNetworkInfo = (NetworkInfo)
                intent.getParcelableExtra(ConnectivityManager.EXTRA_OTHER_NETWORK_INFO);
 
            String reason = intent.getStringExtra(ConnectivityManager.EXTRA_REASON);
            boolean failover =
                intent.getBooleanExtra(ConnectivityManager.EXTRA_IS_FAILOVER, false);
 
                Log.d(TAG, "onReceive(): mNetworkInfo=" + networkInfo +  " mOtherNetworkInfo = "
                        + (otherNetworkInfo == null ? "[none]" : otherNetworkInfo +
                        " noConn=" + noConnectivity), Log.DEBUG_MODE);
 
        	Message message = Message.obtain(messageHandler);
 
        	Bundle b = message.getData();
        	b.putBoolean(EXTRA_CONNECTED, !noConnectivity);
        	b.putInt(EXTRA_NETWORK_TYPE, networkInfo.getType());
        	if (noConnectivity) {
        		b.putString(EXTRA_NETWORK_TYPE_NAME, "NONE");
        	} else {
           		b.putString(EXTRA_NETWORK_TYPE_NAME, networkInfo.getTypeName());
           	}
        	b.putBoolean(EXTRA_FAILOVER, failover);
        	b.putString(EXTRA_REASON, reason);
 
        	message.sendToTarget();
        }
    };
 
    /**
     * Create a new TitaniumNetworkListener.
     */
    public TiNetworkListener(Handler messageHandler) {
        this.receiver = new ConnectivityBroadcastReceiver();
        this.messageHandler = messageHandler;
        this.connectivityIntentFilter = new IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION);
    }
 
    public void attach(Context context) {
    	if (!listening) {
    		if (this.context == null) {
    			this.context = context;
    		} else {
    			throw new IllegalStateException("Context was not cleaned up from last release.");
    		}
    		context.registerReceiver(receiver, connectivityIntentFilter);
    		listening = true;
    	} else {
    		Log.w(TAG, "Connectivity listener is already attached");
    	}
    }
 
    public void detach() {
    	if (listening) {
			context.unregisterReceiver(receiver);
			context = null;
			listening = false;
    	}
    }
}
 
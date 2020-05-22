/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import org.appcelerator.kroll.common.Log;

/**
 * Broadcast receiver used to start this app in the background when the device boots up.
 * This receiver will only work if "android.permission.RECEIVE_BOOT_COMPLETED" is set in the "AndroidManifest.xml".
 */
public class TiBootBroadcastReceiver extends BroadcastReceiver
{
	/**
	 * Called when the Android device boots up.
	 * @param context The Context in which the receiver is running.
	 * @param intent The intent being received.
	 */
	@Override
	public void onReceive(Context context, Intent intent)
	{
		if (intent != null) {
			Log.i("TiBootBroadcastReceiver", "Received action: " + intent.getAction());
		}
	}
}

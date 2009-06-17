/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.util;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.DialogInterface.OnClickListener;
import android.os.Process;

public class TitaniumUIHelper
{

	public static OnClickListener createDoNothingListener() {
		return new OnClickListener() {
			public void onClick(DialogInterface dialog, int which) {
				// Do nothing
			}
		};
	}

	public static OnClickListener createKillListener() {
		return new OnClickListener() {
			public void onClick(DialogInterface dialog, int which) {
				Process.killProcess(Process.myPid());
			}
		};
	}

	public static OnClickListener createFinishListener(final Activity me) {
		return new OnClickListener(){
			public void onClick(DialogInterface dialog, int which) {
				me.finish();
			}
		};
	}

	public static void doKillOrContinueDialog(Context context, String title, String message, OnClickListener positiveListener, OnClickListener negativeListener) {
		if (positiveListener == null) {
			positiveListener = createDoNothingListener();
		}
		if (negativeListener == null) {
			negativeListener = createKillListener();
		}
        new AlertDialog.Builder(context)
        .setTitle(title)
        .setMessage(message)
        .setPositiveButton("Continue",positiveListener)
        .setNegativeButton("Kill", negativeListener)
        .setCancelable(false)
        .create()
        .show();
	}

	public static void doOkDialog(Context context, String title, String message, OnClickListener listener) {
		if (listener == null) {
			listener = new OnClickListener() {

				public void onClick(DialogInterface dialog, int which) {
					// Do nothing.
				}};
		}
        new AlertDialog.Builder(context)
        .setTitle(title)
        .setMessage(message)
        .setPositiveButton(android.R.string.ok,listener)
        .setCancelable(false)
        .create()
        .show();
	}
}

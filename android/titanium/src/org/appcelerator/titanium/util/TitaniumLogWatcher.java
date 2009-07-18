/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.util;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

import org.appcelerator.titanium.TitaniumActivity;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Handler;
import org.appcelerator.titanium.util.Log;

public class TitaniumLogWatcher
{
	private static final String LCAT = "TiLogWatch";

	private TitaniumActivity activity;
	private Thread t;
	private Process p;

	public TitaniumLogWatcher(TitaniumActivity activity) {
		this.activity = activity;
	}

	public void attach()
	{
		final Handler handler = new Handler();

      	try {
      		ProcessBuilder clear = new ProcessBuilder("logcat", "-c");
      		clear.start();

      		final ProcessBuilder pb = new ProcessBuilder("logcat","-s", "WebCore:*");
      		pb.redirectErrorStream(true);
      		p = pb.start();
      		Log.e(LCAT, "Starting Log Watcher Process");
      		t = new Thread(new Runnable(){

				public void run() {
					BufferedReader br = null;
					try {
						br = new BufferedReader(new InputStreamReader(p.getInputStream()));
						String line = null;
						while((line = br.readLine()) != null) {
							final String fline = line;
							handler.post(new Runnable() {
								public void run() {
									NotificationManager mgr = (NotificationManager) activity.getSystemService(Context.NOTIFICATION_SERVICE);
									Notification alert =  new Notification(android.R.drawable.btn_star, "JSError", System.currentTimeMillis());
									alert.flags = Notification.FLAG_AUTO_CANCEL;

									Intent ai = new Intent(activity, TitaniumActivity.class);
									ai.putExtra("message", fline);
									PendingIntent i=PendingIntent.getActivity(activity, 0, ai, 0);
									alert.setLatestEventInfo(activity, "Javascript Error", "Click for details", i);
									mgr.notify(1015, alert);

									detach();
								}});
						}
						Log.w(LCAT, "Read exited");
					} catch (Throwable t) {
						Log.e(LCAT, "Error in logcat monitor", t);
					} finally {
						if (br != null) {
							try {
								br.close();
							} catch (IOException e) {
								// Ignore
							}
						}
						if (p != null) {
							p.destroy();
						}
					}
				}});
      		t.start();
      	} catch (Throwable t) {
      		Log.w(LCAT, "Error while monitoring the log: ", t);
      	}
	}

	public void detach() {
		Log.e(LCAT, "detaching Log Watcher");
		if (p != null) {
			p.destroy();
			p = null;
		}
		if (t != null) {
			t.interrupt();
			t = null;
		}
	}
}

/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.analytics;

import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

import org.apache.http.client.HttpClient;
import org.apache.http.client.ResponseHandler;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.BasicResponseHandler;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.params.BasicHttpParams;
import org.apache.http.params.HttpConnectionParams;
import org.apache.http.params.HttpParams;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.json.JSONArray;
import org.json.JSONObject;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.IBinder;

public class TiAnalyticsService extends Service
{
	private final static String TAG = "TiAnalyticsSvc";

	private final static int BUCKET_SIZE_FAST_NETWORK = 10;
	@SuppressWarnings("unused")
	private final static int BUCKET_SIZE_SLOW_NETWORK = 5;

	private final static String ANALYTICS_URL = "https://api.appcelerator.net/p/v3/mobile-track/";

	private static AtomicBoolean sending;

	private ConnectivityManager connectivityManager;
	public TiAnalyticsService() {
		if (sending == null) {
			this.sending = new AtomicBoolean(false);
		}
	}

	@Override
	public void onCreate()
	{
		super.onCreate();

		connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
	}

	@Override
	public void onDestroy() {
		super.onDestroy();

		connectivityManager = null;
	}

	@Override
	public void onStart(Intent intent, final int startId) {
		super.onStart(intent, startId);

		if (!sending.compareAndSet(false, true)) {
			Log.i(TAG, "Send already in progress, skipping intent");
		}

		final TiAnalyticsService self = this;

		Thread t = new Thread(new Runnable(){

			public void run() {
				Log.i(TAG, "Analytics Service Started");
				try {

					if (connectivityManager == null) {
						Log.w(TAG, "Connectivity manager not available.");
						stopSelf(startId);
						return;
					}
					TiAnalyticsModel model = new TiAnalyticsModel(self);
					if (!model.hasEvents()) {
						Log.d(TAG, "No events to send.", Log.DEBUG_MODE);
						stopSelf(startId);
						return;
					}

					while(model.hasEvents()) {
						if(canSend())
						{
							LinkedHashMap<Integer,JSONObject> events = model.getEventsAsJSON(BUCKET_SIZE_FAST_NETWORK);

							int len = events.size();
							int[] eventIds = new int[len];
							Iterator<Integer> keys = events.keySet().iterator();

							JSONArray records = new JSONArray();
							// build up data to send and records to delete on success
							for(int i = 0; i < len; i++) {
								int id = keys.next();
								// ids are kept even on error JSON to prevent unrestrained growth
								// and a queue blocked by bad records.
								eventIds[i] = id;
								records.put(events.get(id));

								if (Log.isDebugModeEnabled()) {
									JSONObject obj = events.get(id);
									Log.d(TAG, "Sending event: type = " + obj.getString("type") + ", timestamp = " + obj.getString("ts"));
								}
							}
							boolean deleteEvents = true;
							if (records.length() > 0) {
								if (Log.isDebugModeEnabled()) {
									Log.d(TAG, "Sending " + records.length() + " analytics events.");
								}
								try {
									String jsonData = records.toString() + "\n";
									String postUrl = TiApplication.getInstance() == null ? ANALYTICS_URL : ANALYTICS_URL
										+ TiApplication.getInstance().getAppGUID();

									HttpPost httpPost = new HttpPost(postUrl);
									StringEntity entity = new StringEntity(jsonData);
									entity.setContentType("text/json");
									httpPost.setEntity(entity);

							   		HttpParams httpParams = new BasicHttpParams();
							   		HttpConnectionParams.setConnectionTimeout(httpParams, 5000); //TODO use property
							   		//HttpConnectionParams.setSoTimeout(httpParams, 15000); //TODO use property
							   		HttpClient client = new DefaultHttpClient(httpParams);

							   		ResponseHandler<String> responseHandler = new BasicResponseHandler();
							   		client.getParams().setBooleanParameter("http.protocol.expect-continue", false);

						   			@SuppressWarnings("unused")
									String response = client.execute(httpPost, responseHandler);
						   		} catch (Throwable t) {
									Log.e(TAG, "Error posting events: " + t.getMessage(), t);
						   			deleteEvents = false;
						   			records = null;
						   			break;
						   		}
							}

							records = null;

							if (deleteEvents) {
								model.deleteEvents(eventIds);
							}

							events.clear();
						} else {
							Log.w(TAG, "Network unavailable, can't send analytics");
							//TODO reset alarm?
							break;
						}
					}

					Log.i(TAG, "Stopping Analytics Service");
					stopSelf(startId);
				} catch (Throwable t) {
					Log.e(TAG, "Unhandled exception in analytics thread: ", t);
					stopSelf(startId);
				} finally {
					if (!sending.compareAndSet(true, false)) {
						Log.w(TAG, "Expected to be in a sending state. Sending was already false.", Log.DEBUG_MODE);
					}
				}
			}
		});
		t.setPriority(Thread.MIN_PRIORITY);
		t.start();
	}

	private boolean canSend() {
		boolean result = false;

		//int type = netInfo.getType();
		//int subType = netInfo.getSubType();
		// TODO change defaults based on implied speed of network

		NetworkInfo netInfo = null;
		try {
			netInfo = connectivityManager.getActiveNetworkInfo();
		} catch (SecurityException e) {
			Log.w(TAG, "Connectivity permissions have been removed from AndroidManifest.xml: " + e.getMessage());
		}
		if (netInfo != null && netInfo.isConnected() && !netInfo.isRoaming()) {
			result = true;
		}

		return result;
	}
	@Override
	public IBinder onBind(Intent intent) {
		return null; // Not handling
	}

}

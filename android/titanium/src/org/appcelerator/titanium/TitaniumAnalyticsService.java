package org.appcelerator.titanium;

import java.util.HashMap;
import java.util.Iterator;

import org.apache.http.client.HttpClient;
import org.apache.http.client.ResponseHandler;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.BasicResponseHandler;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.params.BasicHttpParams;
import org.apache.http.params.HttpConnectionParams;
import org.apache.http.params.HttpParams;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.IBinder;
import android.util.Log;

public class TitaniumAnalyticsService extends Service
{
	private final static String LCAT = "TiAnalyticsSvc";

	private final static int BUCKET_SIZE_FAST_NETWORK = 10;
	@SuppressWarnings("unused")
	private final static int BUCKET_SIZE_SLOW_NETWORK = 5;

	private final static String ANALYTICS_URL = "https://api.appcelerator.net/p/v1/mobile-track";
//	private final static String ANALYTICS_URL = "http://10.0.1.154/test";

	private ConnectivityManager connectivityManager;

	public TitaniumAnalyticsService() {
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

		final TitaniumAnalyticsService self = this;

		Thread t = new Thread(new Runnable(){

			public void run() {
				Log.w(LCAT, "Analytics Service Started");
				try {

					if (connectivityManager == null) {
						Log.w(LCAT, "Connectivity manager not available.");
						stopSelf(startId);
						return;
					}
					TitaniumAnalyticsModel model = new TitaniumAnalyticsModel(self);
					if (!model.hasEvents()) {
						Log.i(LCAT, "No events to send.");
						stopSelf(startId);
						return;
					}

					while(model.hasEvents()) {
						if(canSend())
						{
							HashMap<Integer,String> events = model.getEventsAsJSON(BUCKET_SIZE_FAST_NETWORK);

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
								try {
									String data = events.get(id);
									records.put(new JSONObject(data));
								} catch (JSONException e) {
									Log.e(LCAT, "Data should be welformed at this point.", e);
								}
							}
							boolean deleteEvents = true;
							if (records.length() > 0) {
								String jsonData = records.toString();

								Log.i(LCAT, "Sending " + records.length() + " analytics events.");
						   		try {
							   		HttpPost httpPost = new HttpPost(ANALYTICS_URL);
							   		httpPost.setEntity(new StringEntity(jsonData));

							   		HttpParams httpParams = new BasicHttpParams();
							   		HttpConnectionParams.setConnectionTimeout(httpParams, 15000); //TODO use property
							   		HttpConnectionParams.setSoTimeout(httpParams, 15000); //TODO use property
							   		HttpClient client = new DefaultHttpClient(httpParams);

							   		ResponseHandler<String> responseHandler = new BasicResponseHandler();

						   			@SuppressWarnings("unused")
									String response = client.execute(httpPost, responseHandler);
						   		} catch (Throwable t) {
						   			Log.e(LCAT, "Error posting events" + t.getMessage());
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
							//TODO reset alarm?
							break;
						}
					}

					Log.w(LCAT, "Stopping Analytics Service");
					stopSelf(startId);
				} catch (Throwable t) {
					Log.e(LCAT, "Unhandle exception in analytics thread: ", t);
					stopSelf(startId);
				}
			}
		});

		t.start();
	}

	private boolean canSend() {
		boolean result = false;

		//int type = netInfo.getType();
		//int subType = netInfo.getSubType();
		// TODO change defaults based on implied speed of network

		NetworkInfo netInfo = connectivityManager.getActiveNetworkInfo();
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

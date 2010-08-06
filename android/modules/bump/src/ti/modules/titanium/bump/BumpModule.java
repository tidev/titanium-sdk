/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.bump;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiActivityResultHandler;
import org.appcelerator.titanium.util.TiActivitySupport;

import android.app.Activity;
import android.content.Intent;
import android.os.Handler;

import com.bumptech.bumpapi.BumpAPI;
import com.bumptech.bumpapi.BumpAPIListener;
import com.bumptech.bumpapi.BumpConnectFailedReason;
import com.bumptech.bumpapi.BumpConnection;
import com.bumptech.bumpapi.BumpDisconnectReason;
import com.bumptech.bumpapi.BumpResources;

public class BumpModule extends TiModule implements TiActivityResultHandler, BumpAPIListener {
	
	private static final String LCAT = "BumpModule";
	private static final boolean DBG = false;
	
	private BumpConnection conn;
	// This shouldn't be required - but it's belts & braces to try and get around their null ptr exception
	private TiActivityResultHandler handler;
	private final Handler baseHandler = new Handler();

	public BumpModule(TiContext context) {
		super(context);		
		setActivityResultHandler(this);
	}
	
	public void connect(String apiKey) {
		if (DBG) {
			Log.d(LCAT, "Bump Connect Called-1");
		}
		
		Activity activity = getTiContext().getActivity();
		TiActivitySupport activitySupport = (TiActivitySupport) activity;
		final int resultCode = activitySupport.getUniqueResultCode();
		
		try {
			// Work around for the way they implement resource management
			BumpResources bp = new BumpResources(this.getTiContext());
			if (DBG) {
				// Test debug code
//				int id = BumpResources.getResources().getIdentifier("bump_again", "string", "com.crucialdivide.pushTest");
//				int id2 = BumpResources.getResources().getIdentifier("com.crucialdivide.pushTest:string/bump_again", null, null);
//				Log.i(LCAT, "--- ID: "+id);
//				Log.i(LCAT, "--- ID2: "+id2);
//				
				Log.d(LCAT, "Bump Connect Called-2");
			}
			
			Intent bump  = new Intent(activity, BumpAPI.class);
			bump.putExtra(BumpAPI.EXTRA_API_KEY, apiKey);
			// Causes one of the crashes with bump currently
			//bump.putExtra(BumpAPI.EXTRA_USER_NAME, "Bump API User");
			activitySupport.launchActivityForResult(bump, resultCode, handler);	
			
			if (DBG) {
				Log.d(LCAT, "Bump Connect Called-4");				
			}
			
			// Bubble up the event
			TiDict eventData = new TiDict();			
			this.fireEvent("ready", eventData);
			
		} catch (Exception e) {
			Log.i(LCAT, "--- Exception: "+e.toString());
		}
		
	}

	public void setActivityResultHandler(TiActivityResultHandler handler) {
		this.handler = handler;
	}

	@Override
	public void onResult(Activity activity, int requestCode, int resultCode, Intent data) {
		if (DBG) {
			Log.d(LCAT, "onResult");
		}

		if (resultCode == Activity.RESULT_OK) {
			// Bump connected successfully, set its listener			
			try {
				this.conn = (BumpConnection) data.getParcelableExtra(BumpAPI.EXTRA_CONNECTION);
				conn.setListener(this, baseHandler);
				
				// Fan out the event to the app
				TiDict eventData = new TiDict();
				eventData.put("username", conn.getOtherUserName());
				this.fireEvent("connected", eventData);
				
				if (DBG) {
					Log.i(LCAT, "--- Successfully connected to " + conn.getOtherUserName()+ " ---");				
				}

			} catch (Exception e) {
				Log.e(LCAT, "--- Error: " + e.getMessage() + " ---");				
			}
			
		} else {
			// Failed to connect, obtain the reason
			if (DBG) {
				Log.d(LCAT, "onConnect Fail");
			}

			try {
				BumpConnectFailedReason reason = (BumpConnectFailedReason) data.getSerializableExtra(BumpAPI.EXTRA_REASON);
				Log.e(LCAT, "--- Failed to connect (" + reason.toString() + ")---");				
			} catch (Exception e) {
				// TODO: handle exception
				Log.e(LCAT, "--- Error: " + e.getMessage() + " ---");				
			}
		}
	}
	
	@Override
	public void onStop() {
		Log.i(LCAT, "--- onStop ");
		if (conn != null)
			conn.disconnect();

		super.onStop();
	}	
		
	
	@Override
	public void onResume() {
		super.onResume();
		Log.i(LCAT, "--- onResume ");
	}

	@Override
	public void onPause() {
		// Swallowing this for now
//		super.onPause();
//		Log.i(LCAT, "--- onPause ");
	}

	@Override
	public void onError(Activity activity, int requestCode, Exception e) {
		Log.i(LCAT, "--- onError "+e.getMessage());		
	}	
	
	@Override
	public void bumpDataReceived(byte[] chunk) {
		try {
			String data = new String(chunk, "UTF-8");
			if (DBG) {
				dataReceived(conn.getOtherUserName() + " said: " + data);				
			} else {
				dataReceived(data);				
			}
		} catch (Exception e) {
			Log.e(LCAT, "Failed to parse incoming data");
			e.printStackTrace();
		}
	}

	@Override
	public void bumpDisconnect(BumpDisconnectReason reason) {
		switch (reason) {
		case END_OTHER_USER_QUIT:
			if (DBG) {
				dataReceived("--- " + conn.getOtherUserName() + " QUIT ---");
			}
			break;
		case END_OTHER_USER_LOST:
			if (DBG) {
				dataReceived("--- " + conn.getOtherUserName() + " LOST ---");
			}
			break;
		}
		TiDict eventData = new TiDict();
		this.fireEvent("disconnect", eventData);
	}
	
	public String dataReceived(String data) {
		
		TiDict eventData = new TiDict();
		eventData.put("data", data);
		this.fireEvent("data",eventData);
		
		Log.e(LCAT, "Data: "+data);
		return data;	
	}
	
	
}
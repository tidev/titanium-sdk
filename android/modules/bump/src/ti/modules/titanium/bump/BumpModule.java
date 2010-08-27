/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.bump;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiActivityResultHandler;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiConvert;

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
	private static final boolean DBG = true;
	
	private BumpConnection conn;
	
	private String apiKey = null;
	private String username = null;
	private String bumpMessage = null;

	// This shouldn't be required - but it's belts & braces to try and get around their null ptr exception
	private TiActivityResultHandler handler;
	private final Handler baseHandler = new Handler();

	public BumpModule(TiContext context) {
		super(context);
		// Setup ourselves as the listener for the result of the Activity
		setActivityResultHandler(this);
	}
	
	protected void sendMessage(String message) {
		if (null != this.conn) {
			
			try {
				byte[] chunk = message.getBytes("UTF-8");
				this.conn.send(chunk);
			} catch (Exception e) {
				Log.e(LCAT, "Error Sending data to other party. "+e.getMessage());
			}
		} else {
			KrollDict eventArgs = new KrollDict();
			eventArgs.put("message", "Not Connected");
			this.fireEvent("error", eventArgs);
			
			Log.i(LCAT, "Not connected");
		}
	}
	
	protected void connectBump() {
		
		Activity activity = getTiContext().getActivity();
		TiActivitySupport activitySupport = (TiActivitySupport) activity;
		final int resultCode = activitySupport.getUniqueResultCode();
		
		try {
			// Work around for the way they implement resource management
			BumpResources bp = new BumpResources(this.getTiContext());
			
			if (DBG) {
				Log.d(LCAT, "Bump Connect Called - setting up Intent");
			}
			
			Intent bump  = new Intent(activity, BumpAPI.class);
			bump.putExtra(BumpAPI.EXTRA_API_KEY, apiKey);
			
			// Set some extra args if they are defined			
			if (null != username) {
				Log.d(LCAT, "Setting Bump Username: "+username);
				bump.putExtra(BumpAPI.EXTRA_USER_NAME, username);
			}
			
			if (null != bumpMessage) {	
				Log.d(LCAT, "Setting Bump message: "+bumpMessage);
				bump.putExtra(BumpAPI.EXTRA_ACTION_MSG, bumpMessage);				
			}
			
			activitySupport.launchActivityForResult(bump, resultCode, handler);	
			
			if (DBG) {
				Log.d(LCAT, "Launched Bump Activity");				
			}
			
			// Bubble up the event
			KrollDict eventData = new KrollDict();			
			this.fireEvent("ready", eventData);
		
		} catch (Exception e) {
			Log.e(LCAT, "--- Exception: "+e.toString());
		}
	}
	
	public void connect(KrollDict props) {

		// Process the args to the method
		if (props.containsKey("apikey")) {
			apiKey = TiConvert.toString(props.getString("apikey"));
		} else {
			Log.e(LCAT, "Invalid argument - apikey is required");
		}
		
		if (props.containsKey("username")) {
			username = TiConvert.toString(props.getString("username"));
		} 
		
		if (props.containsKey("message")) {
			bumpMessage = TiConvert.toString(props.getString("message"));
		}
		
		// A little extra debugging
		if (DBG) {
			Log.d(LCAT, "Bump Connect arguments:");
			Log.d(LCAT, "apikey: "+apiKey);
			
			if (null != username) {
				Log.d(LCAT, "username: "+username);
			} else {
				Log.d(LCAT, "username not passed");
			}
			
			if (null != bumpMessage) {
				Log.d(LCAT, "message: "+bumpMessage);
			} else {
				Log.d(LCAT, "No bump message passed");
			}
			
		}
		
		// Call the master connect
		this.connectBump();
		
	}

	public void setActivityResultHandler(TiActivityResultHandler handler) {
		this.handler = handler;
	}

	@Override
	public void onResult(Activity activity, int requestCode, int resultCode, Intent data) {
		
		if (DBG) {
			Log.d(LCAT, "Activity onResult with Result: "+resultCode);
		}

		if (resultCode == Activity.RESULT_OK) {
			// Bump connected successfully, set its listener			
			try {
				this.conn = (BumpConnection) data.getParcelableExtra(BumpAPI.EXTRA_CONNECTION);
				conn.setListener(this, baseHandler);
				
				// Fan out the event to the app
				KrollDict eventData = new KrollDict();
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
				
				// Notify the app about the failure
				KrollDict eventData = new KrollDict();
				eventData.put("message", reason.toString());
				this.fireEvent("error", eventData);
				
				Log.e(LCAT, "--- Failed to connect (" + reason.toString() + ")---");				
			} catch (Exception e) {
				// TODO: handle exception
				Log.e(LCAT, "--- Error: " + e.getMessage() + " ---");				
			}
		}
	}
	
	@Override
	public void onStop() {
		
		if (conn != null) {
			conn.disconnect();
			conn = null;
		}

		super.onStop();
		
		if (DBG) {
			Log.i(LCAT, "--- onStop ");			
		}
		
	}	
		
	
	@Override
	public void onResume() {
		super.onResume();
		
		if (DBG) {
			Log.i(LCAT, "--- onResume ");
		}
	}

	@Override
	public void onPause() {
		//super.onPause();
		
		if (DBG) {
			Log.i(LCAT, "--- onPause ");
		}
	}

	@Override
	public void onError(Activity activity, int requestCode, Exception e) {
		if (DBG) {
			Log.e(LCAT, "--- onError "+e.getMessage());
		}
	}	
	
	@Override
	public void bumpDataReceived(byte[] chunk) {
		try {
			String data = new String(chunk, "UTF-8");
			
			if (DBG) {
				Log.d(LCAT,"Received Data from other party: "+data);
			}
			
			if (DBG) {
				dataReceived(conn.getOtherUserName() + " said: " + data);				
			} else {
				dataReceived(data);				
			}
		} catch (Exception e) {
			Log.e(LCAT, "Failed to parse incoming data");
		}
	}

	@Override
	public void bumpDisconnect(BumpDisconnectReason reason) {
		String disconnectDueTo = null;
		
		switch (reason) {
		case END_OTHER_USER_QUIT:
			disconnectDueTo = "END_OTHER_USER_QUIT";
			if (DBG) {
				dataReceived("--- " + conn.getOtherUserName() + " QUIT ---");
			}
		break;
		case END_OTHER_USER_LOST:
			disconnectDueTo = "END_OTHER_USER_LOST";
			if (DBG) {
				dataReceived("--- " + conn.getOtherUserName() + " LOST ---");
			}
		break;
		default:
			disconnectDueTo = "UNKNOWN";
		break;
		}
		
		// Float the event to the app
		KrollDict eventData = new KrollDict();
		eventData.put("message", disconnectDueTo);
		this.fireEvent("disconnect", eventData);
		
	}
	
	public String dataReceived(String data) {
		// Float up the event to the app
		KrollDict eventData = new KrollDict();
		eventData.put("data", data);
		this.fireEvent("data",eventData);
		
		Log.e(LCAT, "Data: "+data);
		return data;	
	}
	
	
}
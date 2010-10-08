/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import java.util.concurrent.CountDownLatch;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;
import android.os.ResultReceiver;

@Kroll.proxy(creatableInModule=MediaModule.class)
public class VideoPlayerProxy extends KrollProxy
{
	private static final String LCAT = "VideoPlayerProxy";
	private static final boolean DBG = TiConfig.LOGD;

	protected static final int CONTROL_MSG_LOAD = 100;
	protected static final int CONTROL_MSG_COMPLETE = 101;

	private Handler controlHandler;
	private Messenger activityMessenger;
	private CountDownLatch activityLatch;

	public VideoPlayerProxy(TiContext tiContext)
	{
		super(tiContext);
	}
	
	public void handleCreationDict(KrollDict options) {
		final TiContext tiContext = getTiContext();
		final Intent intent = new Intent(tiContext.getActivity(), TiVideoActivity.class);

		if (options.containsKey("contentURL")) {
			String url = tiContext.resolveUrl(null, TiConvert.toString(options, "contentURL"));
			if (DBG) {
				Log.d(LCAT, "Video source: " + url);
			}
			intent.putExtra("contentURL", url);
		}
		if (options.containsKey("backgroundColor")) {
			intent.putExtra("backgroundColor", TiConvert.toColor(options, "backgroundColor"));
		}
		if (options.containsKey("play")) {
			intent.putExtra("play", TiConvert.toBoolean(options, "play"));
		}

		controlHandler = createControlHandler();
		intent.putExtra("messenger", new Messenger(controlHandler));

		activityLatch = new CountDownLatch(1);

		HandlerThread launchThread = new HandlerThread("TiVideoLaunchThread")
		{
			private Handler handler;

			@Override
			protected void onLooperPrepared()
			{
				super.onLooperPrepared();

				handler = new Handler(getLooper());
			}

			@Override
			public void run() {

				if (DBG) {
					Log.i(LCAT, "Launching TiVideoActivity");
				}
				ResultReceiver messengerReceiver = new ResultReceiver(handler){

					@Override
					protected void onReceiveResult(int resultCode, Bundle resultData) {
						super.onReceiveResult(resultCode, resultData);

						activityMessenger = resultData.getParcelable("messenger");
						if (DBG) {
							Log.d(LCAT, "TiVideoActivity messenger received. Releasing latch");
						}
						activityLatch.countDown();
					}

				};

				intent.putExtra("messengerReceiver", messengerReceiver);
				tiContext.getActivity().startActivity(intent);

				super.run();
			}
		};

		launchThread.start();

		try {
			activityLatch.await();
		} catch (InterruptedException ig) {
			// ignore
		}

		if (DBG) {
			Log.d(LCAT, "after latch.");
		}

		launchThread.getLooper().quit();

/*		String errorCallback = null;
		try {
			JSONObject options = new JSONObject(jsonOptions);
			try {
				errorCallback = options.getString("error"); //callbacks will be added on JS side. to track
			} catch (JSONException e2) {
				Log.d(LCAT, "error callback not available");
			}

			String url = null;
			try {
				url = options.getString("contentURL");
				Uri uri = Uri.parse(url);
				String scheme = uri.getScheme();
				if (scheme == null || scheme.length() == 0 || (scheme == null && !(new File(url).exists()))) {
					uri = Uri.parse(TitaniumUrlHelper.buildAssetUrlFromResourcesRoot(getActivity(), url));
				}
				Intent intent = new Intent(getActivity(), TitaniumVideoActivity.class);
				intent.setData(uri);
				TitaniumIntentWrapper videoIntent = new TitaniumIntentWrapper(intent);
				videoIntent.setWindowId(TitaniumIntentWrapper.createActivityName("VIDEO"));
				result = new TitaniumVideo(this, videoIntent);
			} catch (JSONException e2) {
				String msg = "contentURL is required.";
				Log.e(LCAT, msg);
				if (errorCallback != null) {
					invokeUserCallback(errorCallback, createJSONError(0, msg));
				}
			}

		} catch (JSONException e) {
			Log.e(LCAT, "Could not reconstruct options from JSON: ", e);
		}

		return result;
*/
	}


	@Kroll.method
	public void add(TiViewProxy proxy)
	{
		if (activityMessenger != null) {
			Message msg = Message.obtain();
			msg.what = TiVideoActivity.MSG_ADD_VIEW;
			msg.obj = proxy;
			try {
				activityMessenger.send(msg);
			} catch (RemoteException e) {
				Log.w(LCAT, "Unable to add view, Activity is no longer available: " + e.getMessage());
			}
		}
	}

	@Kroll.method
	public void play()
	{
		if (activityMessenger != null) {
			try {
				Message msg = Message.obtain();
				msg.what = TiVideoActivity.MSG_PLAY;
				activityMessenger.send(msg);
			} catch (RemoteException e) {
				Log.w(LCAT, "Unable to send play message: " + e.getMessage());
			}
		}
	}
	
	@Kroll.method
	public void stop()
	{
		if (activityMessenger != null) {
			try {
				Message msg = Message.obtain();
				msg.what = TiVideoActivity.MSG_STOP_PLAYBACK;
				activityMessenger.send(msg);
			} catch (RemoteException e) {
				Log.w(LCAT, "Unable to send stop message: " + e.getMessage());
			}
		}
	}

	public void hide()
	{
		if (activityMessenger != null) {
			try {
				Message msg = Message.obtain();
				msg.what = TiVideoActivity.MSG_HIDE;
				activityMessenger.send(msg);
			} catch (RemoteException e) {
				Log.w(LCAT, "Unable to send hide message: " + e.getMessage());
			}
		}
	}
	
	private Handler createControlHandler() {
		return new Handler(new Handler.Callback(){

			@Override
			public boolean handleMessage(Message msg)
			{
				switch (msg.what) {
					case CONTROL_MSG_LOAD : {
						if (DBG) {
							Log.i(LCAT, "Video Loaded message received from TiVideoActivity");
						}

						fireEvent("load", null);
						return true;
					}
					case CONTROL_MSG_COMPLETE : {
						if (DBG) {
							Log.i(LCAT, "Video playback message received from TiVideoActivity");
						}
						fireEvent("complete", null);
						return true;
					}
				}
				return false;
			}
		});
	}
}

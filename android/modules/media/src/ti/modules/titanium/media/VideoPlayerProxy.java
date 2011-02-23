/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

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
	private List<TiViewProxy> children = Collections.synchronizedList(new ArrayList<TiViewProxy>());
	private boolean play;

	public VideoPlayerProxy(TiContext tiContext)
	{
		super(tiContext);
	}

	public void handleCreationDict(KrollDict options)
	{
		final TiContext tiContext = getTiContext();
		final Intent intent = new Intent(tiContext.getActivity(), TiVideoActivity.class);

		String url = null;
		if (options.containsKey("contentURL")) {
			url = TiConvert.toString(options, "contentURL");
			Log.w(LCAT, "contentURL is deprecated, use url instead");
		} else if (options.containsKey("url")) {
			url = TiConvert.toString(options, "url");
		}
		
		if (url != null) {
			url = tiContext.resolveUrl(null, url);
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

		ResultReceiver messengerReceiver = new ResultReceiver(controlHandler) {
			@Override
			protected void onReceiveResult(int resultCode, Bundle resultData) {
				super.onReceiveResult(resultCode, resultData);
				setActivityMessenger((Messenger)resultData.getParcelable("messenger"));
				if (DBG) {
					Log.d(LCAT, "TiVideoActivity messenger received. Releasing latch");
				}
			}
		};
		intent.putExtra("messengerReceiver", messengerReceiver);
		tiContext.getActivity().startActivity(intent);
	}

	protected void setActivityMessenger(Messenger messenger)
	{
		activityMessenger = messenger;
		synchronized (children) {
			for (TiViewProxy child : children) {
				sendAddMessage(child);
			}
		}
		if (play) {
			sendPlayMessage();
		}
	}

	@Kroll.method
	public void add(TiViewProxy proxy)
	{
		if (activityMessenger != null) {
			sendAddMessage(proxy);
		} else {
			synchronized (children) {
				children.add(proxy);
			}
		}
	}

	protected void sendAddMessage(TiViewProxy proxy)
	{
		Message msg = Message.obtain();
		msg.what = TiVideoActivity.MSG_ADD_VIEW;
		msg.obj = proxy;
		try {
			activityMessenger.send(msg);
		} catch (RemoteException e) {
			Log.w(LCAT, "Unable to add view, Activity is no longer available: " + e.getMessage());
		}
	}

	@Kroll.method
	public void play()
	{
		if (activityMessenger != null) {
			sendPlayMessage();
		} else {
			play = true;
		}
	}

	protected void sendPlayMessage()
	{
		try {
			Message msg = Message.obtain();
			msg.what = TiVideoActivity.MSG_PLAY;
			activityMessenger.send(msg);
		} catch (RemoteException e) {
			Log.w(LCAT, "Unable to send play message: " + e.getMessage());
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
		} else {
			play = false;
		}
	}

	@Kroll.method
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
	
	private Handler createControlHandler()
	{
		return new Handler(new Handler.Callback() {
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

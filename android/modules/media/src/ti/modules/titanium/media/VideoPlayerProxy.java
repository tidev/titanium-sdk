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
import org.appcelerator.titanium.TiC;
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
	private int mediaControlStyle = MediaModule.VIDEO_CONTROL_DEFAULT;
	private int scalingMode = MediaModule.VIDEO_SCALING_ASPECT_FIT;

	public void handleCreationDict(KrollDict options)
	{
		final Intent intent = new Intent(getActivity(), TiVideoActivity.class);

		String url = null;
		if (options.containsKey(TiC.PROPERTY_CONTENT_URL)) {
			url = TiConvert.toString(options, TiC.PROPERTY_CONTENT_URL);
			Log.w(LCAT, "contentURL is deprecated, use url instead");
		} else if (options.containsKey(TiC.PROPERTY_URL)) {
			url = TiConvert.toString(options, TiC.PROPERTY_URL);
		}
		
		if (url != null) {
			url = resolveUrl(null, url);
			if (DBG) {
				Log.d(LCAT, "Video source: " + url);
			}
			intent.putExtra(TiC.PROPERTY_CONTENT_URL, url);
		}
		if (options.containsKey(TiC.PROPERTY_BACKGROUND_COLOR)) {
			intent.putExtra(TiC.PROPERTY_BACKGROUND_COLOR, TiConvert.toColor(options, TiC.PROPERTY_BACKGROUND_COLOR));
		}
		if (options.containsKey(TiC.PROPERTY_PLAY)) {
			intent.putExtra(TiC.PROPERTY_PLAY, TiConvert.toBoolean(options, TiC.PROPERTY_PLAY));
		}
		if (options.containsKey(TiC.PROPERTY_MEDIA_CONTROL_STYLE)) {
			mediaControlStyle = TiConvert.toInt(options, TiC.PROPERTY_MEDIA_CONTROL_STYLE);
		}
		intent.putExtra(TiC.PROPERTY_MEDIA_CONTROL_STYLE, mediaControlStyle);
		
		if (options.containsKey(TiC.PROPERTY_SCALING_MODE)) {
			scalingMode = TiConvert.toInt(options, TiC.PROPERTY_SCALING_MODE);
		}
		intent.putExtra(TiC.PROPERTY_SCALING_MODE, scalingMode);

		controlHandler = createControlHandler();
		intent.putExtra(TiC.PROPERTY_MESSENGER, new Messenger(controlHandler));

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
		intent.putExtra(TiC.PROPERTY_MESSENGER_RECEIVER, messengerReceiver);
		getActivity().startActivity(intent);
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
	public void pause()
	{
		if (activityMessenger != null) {
			try {
				Message msg = Message.obtain();
				msg.what = TiVideoActivity.MSG_PAUSE_PLAYBACK;
				activityMessenger.send(msg);
			} catch (RemoteException e) {
				Log.w(LCAT, "Unable to send pause message: " + e.getMessage());
			}
		}
	}

	@Kroll.method
	public void start()
	{
		if (activityMessenger != null) {
			try {
				Message msg = Message.obtain();
				msg.what = TiVideoActivity.MSG_START_PLAYBACK;
				activityMessenger.send(msg);
			} catch (RemoteException e) {
				Log.w(LCAT, "Unable to send start message: " + e.getMessage());
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
	
	@Kroll.getProperty @Kroll.method
	public int getMediaControlStyle() {
		return mediaControlStyle;
	}
	
	@Kroll.setProperty @Kroll.method
	public void setMediaControlStyle(int style) {
		if (style != mediaControlStyle) {
			mediaControlStyle = style;
			if (activityMessenger != null) {
				try {
					Message msg = Message.obtain();
					msg.what = TiVideoActivity.MSG_MEDIA_CONTROL_STYLE_CHANGE;
					msg.arg1 = mediaControlStyle;
					activityMessenger.send(msg);
				} catch (RemoteException e) {
					Log.w(LCAT, "Unable to send media control style change message: " + e.getMessage());
				}
			}
		}
	}

	@Kroll.getProperty @Kroll.method
	public int getScalingMode() {
		return scalingMode;
	}
	
	@Kroll.setProperty @Kroll.method
	public void setScalingMode(int mode) {
		if (mode != scalingMode) {
			scalingMode = mode;
			if (activityMessenger != null) {
				try {
					Message msg = Message.obtain();
					msg.what = TiVideoActivity.MSG_SCALING_MODE_CHANGE;
					msg.arg1 = scalingMode;
					activityMessenger.send(msg);
				} catch (RemoteException e) {
					Log.w(LCAT, "Unable to send scaling mode message: " + e.getMessage());
				}
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

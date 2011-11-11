/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;
import android.os.ResultReceiver;

@Kroll.proxy(creatableInModule = MediaModule.class, propertyAccessors = {
	"url", "initialPlaybackTime", "duration"
})
public class VideoPlayerProxy extends TiViewProxy
{
	private static final String LCAT = "VideoPlayerProxy";
	private static final boolean DBG = TiConfig.LOGD;

	protected static final int CONTROL_MSG_LOAD = 100;
	protected static final int CONTROL_MSG_COMPLETE = 101;

	protected int mMediaControlStyle = MediaModule.VIDEO_CONTROL_DEFAULT;
	protected int mScalingMode = MediaModule.VIDEO_SCALING_ASPECT_FIT;

	private VideoPlayerProxy.ProxyImplementation mImpl = null;

	public VideoPlayerProxy()
	{
		super();
	}

	public VideoPlayerProxy(TiContext tiContext)
	{
		this();
	}

	@Override
	public void handleCreationDict(KrollDict options)
	{
		boolean fullscreen = false;
		Object fullscreenObj = options.get(TiC.PROPERTY_FULLSCREEN);
		if (fullscreenObj != null) {
			fullscreen = TiConvert.toBoolean(fullscreenObj);
		}

		if (fullscreen) {
			mImpl = new VideoPlayerProxy.VideoPlayerFullscreenProxy();
		} else {
			mImpl = new VideoPlayerProxy.VideoPlayerViewProxy();
		}
		if (!mImpl.handleCreationDict(options)) {
			super.handleCreationDict(options);
		}
	}

	private boolean isActivity()
	{
		return (mImpl instanceof VideoPlayerFullscreenProxy);
	}

	@Kroll.method
	public void add(TiViewProxy proxy)
	{
		super.add(proxy); // Let TiViewProxy manage children, even if we're using the fullscreen video activity.
		if (isActivity()) {
			// Alert the fullscreen activity of the new child.
			((VideoPlayerFullscreenProxy) mImpl).sendAddMessage(proxy);
		}
	}

	@Kroll.method
	public void play()
	{
		mImpl.play();
	}

	
	@Kroll.method
	public void pause()
	{
		mImpl.pause();
	}

	@Kroll.method
	public void stop()
	{
		mImpl.stop();
	}

	@Override
	public void hide(@Kroll.argument(optional=true) KrollDict options)
	{
		if (isActivity()) {
			((VideoPlayerFullscreenProxy) mImpl).sendHideMessage();
		} else {
			super.hide(options);
		}
	}

	@Override
	public boolean handleMessage(Message msg)
	{
		boolean handled = mImpl.handleMessage(msg);
		if (!handled) {
			handled = super.handleMessage(msg);
		}
		return handled;
	}

	@Kroll.getProperty @Kroll.method
	public int getMediaControlStyle()
	{
		return mMediaControlStyle;
	}

	@Kroll.setProperty @Kroll.method
	public void setMediaControlStyle(int style)
	{
		boolean alert = (mMediaControlStyle != style);
		mMediaControlStyle = style;
		if (alert) {
			mImpl.onMediaControlStyle();
		}
	}

	@Kroll.getProperty @Kroll.method
	public int getScalingMode()
	{
		return mScalingMode;
	}

	@Kroll.setProperty @Kroll.method
	public void setScalingMode(int mode)
	{
		boolean alert = (mode != mScalingMode);
		mScalingMode = mode;
		if (alert) {
			mImpl.onScalingMode();
		}
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		if (isActivity()) {
			return null;
		} else {
			return new TiUIVideoView(this);
		}
	}

	@Kroll.method @Kroll.getProperty
	public int getCurrentPlaybackTime()
	{
		return mImpl.getCurrentPlaybackTime();
	}

	@Kroll.method @Kroll.setProperty
	public void setCurrentPlaybackTime(int milliseconds)
	{
		mImpl.setCurrentPlaybackTime(milliseconds);
	}

	interface ProxyImplementation
	{
		boolean handleMessage(Message msg);
		void play();
		void stop();
		void pause();
		void release();
		boolean handleCreationDict(KrollDict options);
		void onMediaControlStyle();
		void onScalingMode();
		int getCurrentPlaybackTime();
		void setCurrentPlaybackTime(int milliseconds);
	}

	class VideoPlayerFullscreenProxy implements ProxyImplementation
	{
		private Handler controlHandler;
		private Messenger activityMessenger;

		private boolean play;

		@Override
		public boolean handleMessage(Message msg)
		{
			return false;
		}

		@Override
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

		@Override
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

		@Override
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

		@Override
		public void onScalingMode()
		{
			if (activityMessenger != null) {
				try {
					Message msg = Message.obtain();
					msg.what = TiVideoActivity.MSG_SCALING_MODE_CHANGE;
					msg.arg1 = mScalingMode;
					activityMessenger.send(msg);
				} catch (RemoteException e) {
					Log.w(LCAT, "Unable to send scaling mode message: " + e.getMessage());
				}
			}
		}

		@Override
		public void onMediaControlStyle()
		{
			if (activityMessenger != null) {
				try {
					Message msg = Message.obtain();
					msg.what = TiVideoActivity.MSG_MEDIA_CONTROL_STYLE_CHANGE;
					msg.arg1 = mMediaControlStyle;
					activityMessenger.send(msg);
				} catch (RemoteException e) {
					Log.w(LCAT, "Unable to send media control style change message: " + e.getMessage());
				}
			}
		}

		@Override
		public boolean handleCreationDict(KrollDict options)
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
				mMediaControlStyle = TiConvert.toInt(options, TiC.PROPERTY_MEDIA_CONTROL_STYLE);
			}
			intent.putExtra(TiC.PROPERTY_MEDIA_CONTROL_STYLE, mMediaControlStyle);
			
			if (options.containsKey(TiC.PROPERTY_SCALING_MODE)) {
				mScalingMode = TiConvert.toInt(options, TiC.PROPERTY_SCALING_MODE);
			}
			intent.putExtra(TiC.PROPERTY_SCALING_MODE, mScalingMode);

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
			return true;
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

		protected void sendAddMessage(TiViewProxy proxy)
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

		protected void sendHideMessage()
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

		@Override
		public void release()
		{
			// No-op
		}

		@Override
		public int getCurrentPlaybackTime()
		{
			// We never supported this in old (activity-based) implementation.
			return 0;
		}

		@Override
		public void setCurrentPlaybackTime(int milliseconds)
		{
			// We never supported this in old (activity-based) implementation.
		}
	}

	class VideoPlayerViewProxy implements ProxyImplementation
	{

		private static final int MSG_FIRST_ID = TiViewProxy.MSG_LAST_ID + 1;
		private static final int MSG_PLAY = MSG_FIRST_ID + 101;
		private static final int MSG_STOP = MSG_FIRST_ID + 102;
		private static final int MSG_PAUSE = MSG_FIRST_ID + 103;

		private void control(int action)
		{
			if (DBG) {
				Log.d(LCAT, getActionName(action));
			}

			if (!TiApplication.isUIThread()) {
				getMainHandler().sendEmptyMessage(action);
				return;
			}

			TiUIView view = peekView();
			if (view == null) {
				Log.w(LCAT, "Player action ignored; player has not been created.");
				return;
			}

			TiUIVideoView vv = (TiUIVideoView) view;

			switch (action) {
				case MSG_PLAY:
					vv.play();
					break;
				case MSG_STOP:
					vv.stop();
					break;
				case MSG_PAUSE:
					vv.pause();
					break;
				default:
					Log.w(LCAT, "Unknown player action (" + action + ") ignored.");
			}
		}

		@Override
		public void play()
		{
			control(MSG_PLAY);
		}

		@Override
		public void stop()
		{
			control(MSG_STOP);
		}

		@Override
		public void pause()
		{
			control(MSG_PAUSE);
		}

		@Override
		public void setCurrentPlaybackTime(int milliseconds)
		{
			if (DBG) {
				Log.d(LCAT, "setCurrentPlaybackTime(" + milliseconds + ")");
			}

			if (view != null) {
				((TiUIVideoView) view).seek(milliseconds);
			}

		}

		@Kroll.method @Kroll.getProperty
		public int getCurrentPlaybackTime()
		{
			if (view == null) {
				return 0;
			}

			return ((TiUIVideoView) view).getCurrentPlaybackTime();
		}

		@Override
		public boolean handleCreationDict(KrollDict options)
		{
			// No-op
			return false;
		}

		@Override
		public boolean handleMessage(Message msg)
		{
			if (msg.what >= MSG_PLAY && msg.what <= MSG_PAUSE) {
				control(msg.what);
				return true;
			}
			return false;
		}

		private String getActionName(int action)
		{
			switch (action) {
				case MSG_PLAY:
					return "play";
				case MSG_PAUSE:
					return "pause";
				case MSG_STOP:
					return "stop";
				default:
					return "unknown";
			}
		}

		@Override
		public void release()
		{
			if (DBG) {
				Log.d(LCAT, "release()");
			}

			if (view != null) {
				((TiUIVideoView) view).releaseVideoView();
			}
		}

		@Override
		public void onMediaControlStyle()
		{
			if (view != null) {
				((TiUIVideoView) view).setMediaControlStyle(mMediaControlStyle);
			}
		}

		@Override
		public void onScalingMode()
		{
			if (view != null) {
				((TiUIVideoView) view).setScalingMode(mScalingMode);
			}
		}
	}

}

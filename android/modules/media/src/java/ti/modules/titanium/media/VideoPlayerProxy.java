/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import java.lang.ref.WeakReference;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.AsyncResult;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiMessenger;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiLifecycle;
import org.appcelerator.titanium.io.TitaniumBlob;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.media.TiThumbnailRetriever.ThumbnailResponseHandler;
import android.app.Activity;
import android.content.Intent;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Handler;
import android.os.Message;
import android.os.Messenger;
import android.webkit.URLUtil;

// clang-format off
@Kroll.proxy(creatableInModule = MediaModule.class,
	propertyAccessors = {
		TiC.PROPERTY_URL,
		TiC.PROPERTY_INITIAL_PLAYBACK_TIME,
		TiC.PROPERTY_DURATION,
		TiC.PROPERTY_CONTENT_URL,
		TiC.PROPERTY_AUTOPLAY,
		TiC.PROPERTY_END_PLAYBACK_TIME,
		TiC.PROPERTY_PLAYABLE_DURATION,
		TiC.PROPERTY_VOLUME,
		TiC.PROPERTY_SHOWS_CONTROLS,
})
// clang-format on
public class VideoPlayerProxy extends TiViewProxy implements TiLifecycle.OnLifecycleEvent
{
	private static final String TAG = "VideoPlayerProxy";

	protected static final int CONTROL_MSG_ACTIVITY_AVAILABLE = 101;
	protected static final int CONTROL_MSG_CONFIG_CHANGED = 102;

	private static final int MSG_FIRST_ID = TiViewProxy.MSG_LAST_ID + 1;
	private static final int MSG_PLAY = MSG_FIRST_ID + 101;
	private static final int MSG_STOP = MSG_FIRST_ID + 102;
	private static final int MSG_PAUSE = MSG_FIRST_ID + 103;
	private static final int MSG_MEDIA_CONTROL_CHANGE = MSG_FIRST_ID + 104;
	private static final int MSG_SCALING_CHANGE = MSG_FIRST_ID + 105;
	private static final int MSG_SET_PLAYBACK_TIME = MSG_FIRST_ID + 106;
	private static final int MSG_GET_PLAYBACK_TIME = MSG_FIRST_ID + 107;
	private static final int MSG_RELEASE_RESOURCES = MSG_FIRST_ID + 108; // Release video resources
	private static final int MSG_RELEASE = MSG_FIRST_ID + 109;           // Call view.release() (more drastic)
	private static final int MSG_HIDE_MEDIA_CONTROLLER = MSG_FIRST_ID + 110;
	private static final int MSG_SET_VIEW_FROM_ACTIVITY = MSG_FIRST_ID + 111;
	private static final int MSG_REPEAT_CHANGE = MSG_FIRST_ID + 112;

	// Keeping these out of TiC because I believe we'll stop supporting them
	// in favor of the documented property, which is "mediaControlStyle".
	private static final String PROPERTY_MOVIE_CONTROL_MODE = "movieControlMode";
	private static final String PROPERTY_MOVIE_CONTROL_STYLE = "movieControlStyle";

	// The player doesn't automatically preserve its current location and seek back to
	// there when being resumed.  This internal property lets us track that.
	public static final String PROPERTY_SEEK_TO_ON_RESUME = "__seek_to_on_resume__";

	protected int mediaControlStyle = MediaModule.VIDEO_CONTROL_DEFAULT;
	protected int scalingMode = MediaModule.VIDEO_SCALING_ASPECT_FIT;
	private int loadState = MediaModule.VIDEO_LOAD_STATE_UNKNOWN;
	private int playbackState = MediaModule.VIDEO_PLAYBACK_STATE_STOPPED;
	private int repeatMode = MediaModule.VIDEO_REPEAT_MODE_NONE;

	// Used only if TiVideoActivity is used (fullscreen == true)
	private Handler videoActivityHandler;
	private WeakReference<Activity> activityListeningTo = null;

	private TiThumbnailRetriever mTiThumbnailRetriever;

	public VideoPlayerProxy()
	{
		super();
		defaultValues.put(TiC.PROPERTY_VOLUME, 1.0f);
		defaultValues.put(TiC.PROPERTY_SHOWS_CONTROLS, true);
		defaultValues.put(TiC.PROPERTY_AUTOPLAY, true);
		defaultValues.put(TiC.PROPERTY_DURATION, 0);
		defaultValues.put(TiC.PROPERTY_END_PLAYBACK_TIME, 0); // match duration
		defaultValues.put(TiC.PROPERTY_PLAYABLE_DURATION, 0); // match duration
	}

	@Override
	public void setActivity(Activity activity)
	{
		super.setActivity(activity);
		if (activityListeningTo != null) {
			Activity oldActivity = activityListeningTo.get();
			if (oldActivity instanceof TiBaseActivity) {
				((TiBaseActivity) oldActivity).removeOnLifecycleEventListener(this);
			} else if (oldActivity instanceof TiVideoActivity) {
				((TiVideoActivity) oldActivity).setOnLifecycleEventListener(null);
			}
			activityListeningTo = null;
		}
		if (activity instanceof TiBaseActivity) {
			((TiBaseActivity) activity).addOnLifecycleEventListener(this);
			activityListeningTo = new WeakReference<Activity>(activity);
		} else if (activity instanceof TiVideoActivity) {
			((TiVideoActivity) activity).setOnLifecycleEventListener(this);
			activityListeningTo = new WeakReference<Activity>(activity);
		}
	}

	/**
	 * Even when using TiVideoActivity (fullscreen == true), we create
	 * a TiUIVideoView so we have on common interface to the VideoView
	 * and so we can handle child views in our standard way without any
	 * extra code beyond this here.
	 * @param layout The content view of the TiVideoActivity. It already contains a VideoView.
	 */
	//
	// a TiUIVideoView so we have one common channel to the VideoView
	private void setVideoViewFromActivity(TiCompositeLayout layout)
	{
		TiUIVideoView tiView = new TiUIVideoView(this);
		view = tiView;
		tiView.setVideoViewFromActivityLayout(layout);
		realizeViews(tiView);
	}

	@Override
	public void handleCreationDict(KrollDict options)
	{
		super.handleCreationDict(options);

		Object mcStyle = options.get(TiC.PROPERTY_MEDIA_CONTROL_STYLE);
		Object mcModeDeprecated = options.get(PROPERTY_MOVIE_CONTROL_MODE);
		Object mcStyleDeprecated = options.get(PROPERTY_MOVIE_CONTROL_STYLE);
		if (mcStyle != null) {
			mediaControlStyle = TiConvert.toInt(mcStyle);
		} else if (mcModeDeprecated != null) {
			Log.w(TAG, "movieControlMode is deprecated.  Use mediaControlStyle instead.");
			mediaControlStyle = TiConvert.toInt(mcModeDeprecated);
		} else if (mcStyleDeprecated != null) {
			Log.w(TAG, "movieControlStyle is deprecated.  Use mediaControlStyle instead.");
			mediaControlStyle = TiConvert.toInt(mcStyleDeprecated);
		}

		Object sMode = options.get(TiC.PROPERTY_SCALING_MODE);
		if (sMode != null) {
			scalingMode = TiConvert.toInt(sMode);
		}

		// "fullscreen" in the creation dict determines
		// whether we use a TiVideoActivity versus a standard
		// embedded view.  Setting "fullscreen" after this currently
		// has no effect.
		boolean fullscreen = false;
		Object fullscreenObj = options.get(TiC.PROPERTY_FULLSCREEN);
		if (fullscreenObj != null) {
			fullscreen = TiConvert.toBoolean(fullscreenObj);
		}

		if (fullscreen) {
			launchVideoActivity(options);
		}
	}

	private void launchVideoActivity(KrollDict options)
	{
		final Intent intent = new Intent(getActivity(), TiVideoActivity.class);

		if (options.containsKey(TiC.PROPERTY_BACKGROUND_COLOR)) {
			intent.putExtra(TiC.PROPERTY_BACKGROUND_COLOR, TiConvert.toColor(options, TiC.PROPERTY_BACKGROUND_COLOR));
		}
		videoActivityHandler = createControlHandler();
		intent.putExtra(TiC.PROPERTY_MESSENGER, new Messenger(videoActivityHandler));
		getActivity().startActivity(intent);
	}

	/**
	 * Create handler used for communication from TiVideoActivity to this proxy.
	 * @return
	 */
	private Handler createControlHandler()
	{
		return new Handler(new Handler.Callback() {
			@Override
			public boolean handleMessage(Message msg)
			{
				boolean handled = false;
				switch (msg.what) {
					case CONTROL_MSG_CONFIG_CHANGED:
						Log.d(TAG, "TiVideoActivity sending configuration changed message to proxy", Log.DEBUG_MODE);
						// In case the orientation changed and the media controller is still showing (now in the
						// wrong place since the screen flipped), hide it.
						if (view != null) {
							if (TiApplication.isUIThread()) {
								getVideoView().hideMediaController();
							} else {
								getMainHandler().sendEmptyMessage(MSG_HIDE_MEDIA_CONTROLLER);
							}
						}
						handled = true;
						break;
					case CONTROL_MSG_ACTIVITY_AVAILABLE:
						Log.d(TAG, "TiVideoActivity sending activity started message to proxy", Log.DEBUG_MODE);
						// The TiVideoActivity has started and has called its own
						// setContentView, which is a TiCompositeLayout with the
						// TiVideoView8 view on it.  In chain of calls below,
						// we create a TiUIVideoView and set its nativeView to the
						// already-existing layout from the activity.
						TiVideoActivity videoActivity = (TiVideoActivity) msg.obj;
						setActivity(videoActivity);
						if (TiApplication.isUIThread()) {
							setVideoViewFromActivity(videoActivity.layout);
						} else {
							getMainHandler().sendMessage(
								getMainHandler().obtainMessage(MSG_SET_VIEW_FROM_ACTIVITY, videoActivity.layout));
						}
						handled = true;
						break;
				}
				return handled;
			}
		});
	}

	private void control(int action)
	{
		Log.d(TAG, getActionName(action), Log.DEBUG_MODE);

		if (!TiApplication.isUIThread()) {
			getMainHandler().sendEmptyMessage(action);
			return;
		}

		TiUIView view = peekView();
		if (view == null) {
			Log.w(TAG, "Player action ignored; player has not been created.");
			return;
		}

		TiUIVideoView vv = getVideoView();

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
				Log.w(TAG, "Unknown player action (" + action + ") ignored.");
		}
	}

	@Kroll.method
	public void play()
	{
		control(MSG_PLAY);
	}

	/**
	 * Backwards-compatibility
	 */
	@Kroll.method
	public void start()
	{
		play();
	}

	@Kroll.method
	public void pause()
	{
		control(MSG_PAUSE);
	}

	@Kroll.method
	public void stop()
	{
		control(MSG_STOP);
	}

	@Kroll.method
	public void release()
	{
		Log.d(TAG, "release()", Log.DEBUG_MODE);

		if (view != null) {
			if (TiApplication.isUIThread()) {
				getVideoView().releaseVideoView();
			} else {
				TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_RELEASE_RESOURCES));
			}
		}
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public boolean getPlaying()
	// clang-format on
	{
		if (view != null) {
			return getVideoView().isPlaying();
		} else {
			return false;
		}
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getLoadState()
	// clang-format on
	{
		return loadState;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getPlaybackState()
	// clang-format on
	{
		return playbackState;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getRepeatMode()
	// clang-format on
	{
		return repeatMode;
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setRepeatMode(int mode)
	// clang-format on
	{
		boolean alert = (mode != repeatMode);
		repeatMode = mode;
		if (alert && view != null) {
			if (TiApplication.isUIThread()) {
				getVideoView().setRepeatMode(mode);
			} else {
				getMainHandler().sendEmptyMessage(MSG_REPEAT_CHANGE);
			}
		}
	}

	@Override
	public void hide(@Kroll.argument(optional = true) KrollDict options)
	{
		if (getActivity() instanceof TiVideoActivity) {
			getActivity().finish();
		} else {
			super.hide(options);
		}
	}

	@Override
	public boolean handleMessage(Message msg)
	{
		if (msg.what >= MSG_PLAY && msg.what <= MSG_PAUSE) {
			control(msg.what);
			return true;
		}

		boolean handled = false;
		TiUIVideoView vv = getVideoView();
		switch (msg.what) {
			case MSG_MEDIA_CONTROL_CHANGE:
				if (vv != null) {
					vv.setMediaControlStyle(mediaControlStyle);
				}
				handled = true;
				break;
			case MSG_SCALING_CHANGE:
				if (vv != null) {
					vv.setScalingMode(scalingMode);
				}
				handled = true;
				break;
			case MSG_SET_PLAYBACK_TIME:
				if (vv != null) {
					vv.seek(msg.arg1);
				}
				handled = true;
				break;
			case MSG_GET_PLAYBACK_TIME:
				if (vv != null) {
					((AsyncResult) msg.obj).setResult(vv.getCurrentPlaybackTime());
				} else {
					((AsyncResult) msg.obj).setResult(null);
				}
				handled = true;
				break;
			case MSG_RELEASE_RESOURCES:
				if (vv != null) {
					vv.releaseVideoView();
				}
				((AsyncResult) msg.obj).setResult(null);
				handled = true;
				break;
			case MSG_RELEASE:
				if (vv != null) {
					vv.release();
				}
				((AsyncResult) msg.obj).setResult(null);
				handled = true;
				break;
			case MSG_HIDE_MEDIA_CONTROLLER:
				if (vv != null) {
					vv.hideMediaController();
				}
				handled = true;
				break;
			case MSG_SET_VIEW_FROM_ACTIVITY:
				setVideoViewFromActivity((TiCompositeLayout) msg.obj);
				handled = true;
				break;
			case MSG_REPEAT_CHANGE:
				if (vv != null) {
					vv.setRepeatMode(repeatMode);
				}
				handled = true;
				break;
		}

		if (!handled) {
			handled = super.handleMessage(msg);
		}
		return handled;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getMediaControlStyle()
	// clang-format on
	{
		return mediaControlStyle;
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setMediaControlStyle(int style)
	// clang-format on
	{
		boolean alert = (mediaControlStyle != style);
		mediaControlStyle = style;
		if (alert && view != null) {
			if (TiApplication.isUIThread()) {
				getVideoView().setMediaControlStyle(style);
			} else {
				getMainHandler().sendEmptyMessage(MSG_MEDIA_CONTROL_CHANGE);
			}
		}
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getMovieControlMode()
	// clang-format on
	{
		Log.w(TAG, "movieControlMode is deprecated.  Use mediaControlStyle instead.");
		return getMediaControlStyle();
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setMovieControlMode(int style)
	// clang-format on
	{
		Log.w(TAG, "movieControlMode is deprecated.  Use mediaControlStyle instead.");
		setMediaControlStyle(style);
	}

	/**
	 * Our iOS implementation has been supporting this version of the property name as well,
	 * possibly accidentally.  These "media/movieControl" property names should be properly
	 * deprecated and cleaned up after TIMOB-2802 is resolved.
	 * TODO
	 */
	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getMovieControlStyle()
	// clang-format on
	{
		Log.w(TAG, "movieControlStyle is deprecated.  Use mediaControlStyle instead.");
		return getMediaControlStyle();
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setMovieControlStyle(int style)
	// clang-format on
	{
		Log.w(TAG, "movieControlStyle is deprecated.  Use mediaControlStyle instead.");
		setMediaControlStyle(style);
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getScalingMode()
	// clang-format on
	{
		return scalingMode;
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setScalingMode(int mode)
	// clang-format on
	{
		boolean alert = (mode != scalingMode);
		scalingMode = mode;
		if (alert && view != null) {
			if (TiApplication.isUIThread()) {
				getVideoView().setScalingMode(mode);
			} else {
				getMainHandler().sendEmptyMessage(MSG_SCALING_CHANGE);
			}
		}
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		if (getActivity() instanceof TiVideoActivity) {
			return null;
		} else {
			return new TiUIVideoView(this);
		}
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getCurrentPlaybackTime()
	// clang-format on
	{
		if (view != null) {
			if (TiApplication.isUIThread()) {
				return getVideoView().getCurrentPlaybackTime();
			} else {
				Object result =
					TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_GET_PLAYBACK_TIME));
				if (result instanceof Number) {
					return ((Number) result).intValue();
				} else {
					return 0;
				}
			}
		} else {
			return 0;
		}
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setCurrentPlaybackTime(int milliseconds)
	// clang-format on
	{
		Log.d(TAG, "setCurrentPlaybackTime(" + milliseconds + ")", Log.DEBUG_MODE);

		if (view != null) {
			if (TiApplication.isUIThread()) {
				getVideoView().seek(milliseconds);
			} else {
				Message msg = getMainHandler().obtainMessage(MSG_SET_PLAYBACK_TIME);
				msg.arg1 = milliseconds;
				TiMessenger.getMainMessenger().sendMessage(msg);
			}
		}
	}

	private void firePlaybackState(int state)
	{
		playbackState = state;
		KrollDict data = new KrollDict();
		data.put(TiC.EVENT_PROPERTY_PLAYBACK_STATE, state);
		fireEvent(TiC.EVENT_PLAYBACK_STATE, data);
		// TODO: Deprecate old event
		fireEvent("playbackState", data);
	}

	public void fireLoadState(int state)
	{
		loadState = state;
		KrollDict args = new KrollDict();
		args.put(TiC.EVENT_PROPERTY_LOADSTATE, state);
		args.put(TiC.EVENT_PROPERTY_CURRENT_PLAYBACK_TIME, getCurrentPlaybackTime());
		fireEvent(TiC.EVENT_LOADSTATE, args);
		if (state == MediaModule.VIDEO_LOAD_STATE_UNKNOWN) {
			setProperty(TiC.PROPERTY_DURATION, 0);
			setProperty(TiC.PROPERTY_PLAYABLE_DURATION, 0);
		}
	}

	public void fireComplete(int reason)
	{
		KrollDict args = new KrollDict();
		args.put(TiC.EVENT_PROPERTY_REASON, reason);
		if (reason == MediaModule.VIDEO_FINISH_REASON_PLAYBACK_ERROR) {
			args.putCodeAndMessage(-1, "Video Playback encountered an error");
		} else {
			args.putCodeAndMessage(0, null);
		}
		fireEvent(TiC.EVENT_COMPLETE, args);
	}

	public void firePlaying()
	{
		KrollDict args = new KrollDict();
		args.put(TiC.EVENT_PROPERTY_URL, getProperty(TiC.PROPERTY_URL));
		fireEvent(TiC.EVENT_PLAYING, args);
	}

	public void onPlaybackReady(int duration)
	{
		KrollDict data = new KrollDict();
		data.put(TiC.PROPERTY_DURATION, duration);
		setProperty(TiC.PROPERTY_DURATION, duration);
		setProperty(TiC.PROPERTY_PLAYABLE_DURATION, duration);
		setProperty(TiC.PROPERTY_END_PLAYBACK_TIME,
					duration); // Currently we're not doing anything else with this property in Android.
		if (!hasProperty(TiC.PROPERTY_INITIAL_PLAYBACK_TIME)) {
			setProperty(TiC.PROPERTY_INITIAL_PLAYBACK_TIME, 0);
		}
		fireEvent(TiC.EVENT_DURATION_AVAILABLE, data);
		// TODO: Deprecate old event
		fireEvent("durationAvailable", data);

		fireEvent(TiC.EVENT_PRELOAD, null);
		fireEvent(TiC.EVENT_LOAD, null); // No distinction between load and preload in our case.
		fireLoadState(MediaModule.VIDEO_LOAD_STATE_PLAYABLE);
		Object autoplay = getProperty(TiC.PROPERTY_AUTOPLAY); // Docs say autoplay on by default.
		if (autoplay == null || TiConvert.toBoolean(autoplay)) {
			play();
		}
	}

	public void onPlaybackStarted()
	{
		firePlaybackState(MediaModule.VIDEO_PLAYBACK_STATE_PLAYING);
	}

	public void onPlaying()
	{
		firePlaying();
	}

	public void onPlaybackPaused()
	{
		firePlaybackState(MediaModule.VIDEO_PLAYBACK_STATE_PAUSED);
	}

	public void onPlaybackStopped()
	{
		firePlaybackState(MediaModule.VIDEO_PLAYBACK_STATE_STOPPED);
		fireComplete(MediaModule.VIDEO_FINISH_REASON_USER_EXITED);
	}

	public void onPlaybackComplete()
	{
		firePlaybackState(MediaModule.VIDEO_PLAYBACK_STATE_STOPPED);
		fireComplete(MediaModule.VIDEO_FINISH_REASON_PLAYBACK_ENDED);
	}

	public void onPlaybackError(int what)
	{
		String message = "Unknown";
		switch (what) {
			case MediaPlayer.MEDIA_ERROR_NOT_VALID_FOR_PROGRESSIVE_PLAYBACK:
				message = "Not valid for progressive playback";
				break;
			case MediaPlayer.MEDIA_ERROR_SERVER_DIED:
				message = "Server died";
				break;
		}
		firePlaybackState(MediaModule.VIDEO_PLAYBACK_STATE_INTERRUPTED);
		KrollDict data = new KrollDict();
		data.put(TiC.EVENT_PROPERTY_MESSAGE, message);
		data.putCodeAndMessage(what, message);
		fireEvent(TiC.EVENT_ERROR, data);
		fireLoadState(MediaModule.VIDEO_LOAD_STATE_UNKNOWN);
		fireComplete(MediaModule.VIDEO_FINISH_REASON_PLAYBACK_ERROR);
	}

	public void onSeekingForward()
	{
		firePlaybackState(MediaModule.VIDEO_PLAYBACK_STATE_SEEKING_FORWARD);
	}

	public void onSeekingBackward()
	{
		firePlaybackState(MediaModule.VIDEO_PLAYBACK_STATE_SEEKING_BACKWARD);
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
	public void onStart(Activity activity)
	{
	}

	@Override
	public void onResume(Activity activity)
	{
		if (view != null) {
			// Maybe we were paused in the middle of video. Should at least
			// seek back to that position.
			getVideoView().seekIfNeeded();
		}
	}

	@Override
	public void onPause(Activity activity)
	{
		if (activity.isFinishing()) {
			// Forget any saved positions
			setProperty(PROPERTY_SEEK_TO_ON_RESUME, 0);
		} else {
			// We're not finishing, so we might be coming back. Remember where we are.
			if (view != null) {
				int seekToOnResume = getCurrentPlaybackTime();
				setProperty(PROPERTY_SEEK_TO_ON_RESUME, seekToOnResume);
				if (getPlaying()) {
					pause();
				}
			}
		}
	}

	@Override
	public void onStop(Activity activity)
	{
	}

	@Override
	public void onDestroy(Activity activity)
	{
		boolean wasPlaying = getPlaying();
		if (!wasPlaying) {
			// Could be we've passed through onPause while finishing and paused playback.
			if (hasProperty(PROPERTY_SEEK_TO_ON_RESUME)) {
				wasPlaying = TiConvert.toInt(getProperty(PROPERTY_SEEK_TO_ON_RESUME)) > 0;
				setProperty(PROPERTY_SEEK_TO_ON_RESUME, 0);
			}
		}
		// Stop the video and cleanup.
		if (view != null) {
			if (TiApplication.isUIThread()) {
				getVideoView().release();
			} else {
				TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_RELEASE));
			}
		}
		if (wasPlaying) {
			fireComplete(MediaModule.VIDEO_FINISH_REASON_USER_EXITED);
		}

		// Cancel any Thumbnail requests and releasing TiMediaMetadataRetriver resource
		cancelAllThumbnailImageRequests();
	}

	@Kroll.method
	public void requestThumbnailImagesAtTimes(Object[] times, Object option, KrollFunction callback)
	{
		if (hasProperty(TiC.PROPERTY_URL)) {
			cancelAllThumbnailImageRequests();
			mTiThumbnailRetriever = new TiThumbnailRetriever();
			String url = TiConvert.toString(getProperty(TiC.PROPERTY_URL));
			if (!URLUtil.isValidUrl(url)) {
				url = resolveUrl(null, url);
			}
			Uri uri = Uri.parse(url);
			mTiThumbnailRetriever.setUri(uri);
			mTiThumbnailRetriever.getBitmap(TiConvert.toIntArray(times), TiConvert.toInt(option),
											createThumbnailResponseHandler(callback));
		}
	}

	@Kroll.method
	public void cancelAllThumbnailImageRequests()
	{
		if (mTiThumbnailRetriever != null) {
			mTiThumbnailRetriever.cancelAnyRequestsAndRelease();
			mTiThumbnailRetriever = null;
		}
	}

	/**
	 * Convenience method for creating a response handler that is used when getting a
	 * bitmmap.
	 *
	 * @param callback          Javascript function that the response handler will invoke
	 *                          once the bitmap response is ready
	 * @return                  the bitmap response handler
	 */
	private ThumbnailResponseHandler createThumbnailResponseHandler(final KrollFunction callback)
	{
		final VideoPlayerProxy videoPlayerProxy = this;
		return new ThumbnailResponseHandler() {
			@Override
			public void handleThumbnailResponse(KrollDict bitmapResponse)
			{
				bitmapResponse.put(TiC.EVENT_PROPERTY_SOURCE, videoPlayerProxy);
				callback.call(getKrollObject(), new Object[] { bitmapResponse });
			}
		};
	}

	private TiUIVideoView getVideoView()
	{
		return (TiUIVideoView) view;
	}

	@Override
	public String getApiName()
	{
		return "Ti.Media.VideoPlayer";
	}
}

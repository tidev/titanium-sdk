/*
 * Copyright (C) 2006 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Modifications copyright:
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2020 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * This is the api level 8 VideoView.java with Titanium-specific modifications.
 */

package android.widget;

import java.util.HashMap;
import java.util.Map;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;

import ti.modules.titanium.media.MediaModule;
import ti.modules.titanium.media.TiPlaybackListener;
import android.content.Context;
import android.content.Intent;
import android.content.res.AssetFileDescriptor;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.MediaPlayer.OnCompletionListener;
import android.media.MediaPlayer.OnErrorListener;
import android.net.Uri;
import android.util.AttributeSet;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.webkit.URLUtil;
import android.widget.MediaController.MediaPlayerControl;

/**
 * Displays a video file. The VideoView class
 * can load images from various sources (such as resources or content
 * providers), takes care of computing its measurement from the video so that
 * it can be used in any layout manager, and provides various display options
 * such as scaling and tinting.
 */
@SuppressWarnings("deprecation")
public class TiVideoView8 extends SurfaceView implements MediaPlayerControl
{
	private static final String TAG = "TiVideoView8";
	// TITANIUM
	private int mScalingMode = MediaModule.VIDEO_SCALING_RESIZE_ASPECT;
	// settable by the client
	private Uri mUri;
	@SuppressWarnings("unused")
	private Map<String, String> mHeaders;
	private int mDuration;

	// all possible internal states
	private static final int STATE_ERROR = -1;
	private static final int STATE_IDLE = 0;
	private static final int STATE_PREPARING = 1;
	private static final int STATE_PREPARED = 2;
	private static final int STATE_PLAYING = 3;
	private static final int STATE_PAUSED = 4;
	private static final int STATE_PLAYBACK_COMPLETED = 5;
	private static final int STATE_SUSPEND = 6;
	@SuppressWarnings("unused")
	private static final int STATE_RESUME = 7;
	@SuppressWarnings("unused")
	private static final int STATE_SUSPEND_UNSUPPORTED = 8;

	// mCurrentState is a VideoView object's current state.
	// mTargetState is the state that a method caller intends to reach.
	// For instance, regardless the VideoView object's current state,
	// calling pause() intends to bring the object to a target state
	// of STATE_PAUSED.
	private int mCurrentState = STATE_IDLE;
	private int mTargetState = STATE_IDLE;

	// All the stuff we need for playing and showing a video
	private SurfaceHolder mSurfaceHolder = null;
	private MediaPlayer mMediaPlayer = null;
	private int mVideoWidth;
	private int mVideoHeight;
	private int mSurfaceWidth;
	private int mSurfaceHeight;
	private MediaController mMediaController;
	private OnCompletionListener mOnCompletionListener;
	private MediaPlayer.OnPreparedListener mOnPreparedListener;
	private int mCurrentBufferPercentage;
	private OnErrorListener mOnErrorListener;
	private int mSeekWhenPrepared; // recording the seek position while
								   // preparing
	@SuppressWarnings("unused")
	private int mStateWhenSuspended; // state before calling suspend()

	// TITANIUM
	private TiPlaybackListener mPlaybackListener;
	private float mVolume = 1.0f;
	private int mLoop = 0;

	public TiVideoView8(Context context)
	{
		super(context);
		initVideoView();
	}

	public TiVideoView8(Context context, AttributeSet attrs)
	{
		this(context, attrs, 0);
		initVideoView();
	}

	public TiVideoView8(Context context, AttributeSet attrs, int defStyle)
	{
		super(context, attrs, defStyle);
		initVideoView();
	}

	// TITANIUM
	public void setOnPlaybackListener(TiPlaybackListener tiPlaybackListener)
	{
		mPlaybackListener = tiPlaybackListener;
	}

	/*
	 * @Override
	 * protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
	 * {
	 * // Log.i("@@@@", "onMeasure");
	 * int width = getDefaultSize(mVideoWidth, widthMeasureSpec);
	 * int height = getDefaultSize(mVideoHeight, heightMeasureSpec);
	 * if (mVideoWidth > 0 && mVideoHeight > 0) {
	 * if (mVideoWidth * height > width * mVideoHeight) {
	 * // Log.i("@@@", "image too tall, correcting");
	 * height = width * mVideoHeight / mVideoWidth;
	 * } else if (mVideoWidth * height < width * mVideoHeight) {
	 * // Log.i("@@@", "image too wide, correcting");
	 * width = height * mVideoWidth / mVideoHeight;
	 * } else {
	 * // Log.i("@@@", "aspect ratio is correct: " +
	 * // width+"/"+height+"="+
	 * // mVideoWidth+"/"+mVideoHeight);
	 * }
	 * }
	 * // Log.i("@@@@@@@@@@", "setting size: " + width + 'x' + height);
	 * setMeasuredDimension(width, height);
	 * }
	 */

	/* TITANIUM */
	@Override
	protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
	{
		measureVideo(mVideoWidth, mVideoHeight, widthMeasureSpec, heightMeasureSpec);
		if (mSurfaceHolder != null && mMediaPlayer != null && mMediaPlayer.getCurrentPosition() > 0) {
			mSurfaceHolder.setFixedSize(getMeasuredWidth(), getMeasuredHeight());
		}
	}

	private void constantDeprecationWarning(int constant)
	{
		String message = null;
		final String MESSAGE_FORMAT = "%s has been deprecated. Use %s instead.";
		switch (constant) {
			case MediaModule.VIDEO_SCALING_ASPECT_FILL:
				message = String.format(MESSAGE_FORMAT, "Ti.Media.VIDEO_SCALING_ASPECT_FILL",
										"Ti.Media.VIDEO_SCALING_RESIZE_ASPECT_FILL");
				break;
			case MediaModule.VIDEO_SCALING_ASPECT_FIT:
				message = String.format(MESSAGE_FORMAT, "Ti.Media.VIDEO_SCALING_ASPECT_FIT",
										"Ti.Media.VIDEO_SCALING_RESIZE_ASPECT");
				break;
			case MediaModule.VIDEO_SCALING_MODE_FILL:
				message =
					String.format(MESSAGE_FORMAT, "Ti.Media.VIDEO_SCALING_MODE_FILL", "Ti.Media.VIDEO_SCALING_RESIZE");
				break;
		}
		if (message != null) {
			Log.w("VideoPlayerProxy", message);
		}
	}

	protected void measureVideo(int videoWidth, int videoHeight, int widthMeasureSpec, int heightMeasureSpec)
	{
		Log.e(TAG,
			  "******* mVideoWidth: " + videoWidth + " mVideoHeight: " + videoHeight + " width: "
				  + MeasureSpec.getSize(widthMeasureSpec) + " height: " + MeasureSpec.getSize(heightMeasureSpec),
			  Log.DEBUG_MODE);

		int width = getDefaultSize(videoWidth, widthMeasureSpec);
		int height = getDefaultSize(videoHeight, heightMeasureSpec);
		if (videoWidth > 0 && videoHeight > 0) {

			switch (mScalingMode) {
				case MediaModule.VIDEO_SCALING_NONE: {
					width = videoWidth;
					height = videoHeight;
					break;
				}
				case MediaModule.VIDEO_SCALING_ASPECT_FILL:
				case MediaModule.VIDEO_SCALING_RESIZE_ASPECT_FILL: {
					if (videoWidth * height > width * videoHeight) {
						width = height * videoWidth / videoHeight;
					} else if (videoWidth * height < width * videoHeight) {
						height = width * videoHeight / videoWidth;
					}
					break;
				}
				case MediaModule.VIDEO_SCALING_ASPECT_FIT:
				case MediaModule.VIDEO_SCALING_RESIZE_ASPECT: {
					if (videoWidth * height > width * videoHeight) {
						height = width * videoHeight / videoWidth;
					} else if (videoWidth * height < width * videoHeight) {
						width = height * videoWidth / videoHeight;
					}
					break;
				}
				case MediaModule.VIDEO_SCALING_MODE_FILL:
				case MediaModule.VIDEO_SCALING_RESIZE: {
					width = MeasureSpec.getSize(widthMeasureSpec);
					height = MeasureSpec.getSize(heightMeasureSpec);
					break;
				}
			}
			constantDeprecationWarning(mScalingMode);
		}
		Log.i(TAG, "setting size: " + width + 'x' + height, Log.DEBUG_MODE);
		setMeasuredDimension(width, height);
	}

	public int resolveAdjustedSize(int desiredSize, int measureSpec)
	{
		int result = desiredSize;
		int specMode = MeasureSpec.getMode(measureSpec);
		int specSize = MeasureSpec.getSize(measureSpec);

		switch (specMode) {
			case MeasureSpec.UNSPECIFIED:
				/*
				 * Parent says we can be as big as we want. Just don't be larger
				 * than max size imposed on ourselves.
				 */
				result = desiredSize;
				break;

			case MeasureSpec.AT_MOST:
				/*
				 * Parent says we can be as big as we want, up to specSize.
				 * Don't be larger than specSize, and don't be larger than
				 * the max size imposed on ourselves.
				 */
				result = Math.min(desiredSize, specSize);
				break;

			case MeasureSpec.EXACTLY:
				// No choice. Do what we are told.
				result = specSize;
				break;
		}
		return result;
	}

	private void initVideoView()
	{
		mVideoWidth = 0;
		mVideoHeight = 0;
		getHolder().addCallback(mSHCallback);
		getHolder().setType(SurfaceHolder.SURFACE_TYPE_PUSH_BUFFERS);
		setFocusable(true);
		setFocusableInTouchMode(true);
		requestFocus();
		mCurrentState = STATE_IDLE;
		mTargetState = STATE_IDLE;
	}

	public void setVideoPath(String path)
	{
		setVideoURI(Uri.parse(path));
	}

	public void setVideoURI(Uri uri)
	{
		setVideoURI(uri, null);
	}

	/**
	 * @hide
	 */
	public void setVideoURI(Uri uri, Map<String, String> headers)
	{
		mUri = uri;
		mHeaders = headers;
		mSeekWhenPrepared = 0;
		openVideo();
		requestLayout();
		invalidate();
	}

	/*
	 * TITANIUM: Allow setting player volume level.
	 */
	public void setVolume(float volume)
	{
		mVolume = Math.min(Math.max(volume, 0.0f), 1.0f);
		if (mMediaPlayer != null) {
			mMediaPlayer.setVolume(mVolume, mVolume);
		}
	}

	public void stopPlayback()
	{
		if (mMediaPlayer != null) {
			mMediaPlayer.stop();
			// TITANIUM
			if (mPlaybackListener != null) {
				mPlaybackListener.onStopPlayback();
			}
			mMediaPlayer.release();
			mMediaPlayer = null;
			mCurrentState = STATE_IDLE;
			mTargetState = STATE_IDLE;
		}
	}

	private void setDataSource()
	{
		try {
			// TIMOB-27493: disable caching, which would otherwise introduce a delay.
			Map<String, String> headers = new HashMap<>();
			headers.put("Cache-Control", "no-cache");

			mMediaPlayer.setDataSource(TiApplication.getAppRootOrCurrentActivity(), mUri, headers);
		} catch (Exception e) {
			Log.e(TAG, "Error setting video data source: " + e.getMessage(), e);
		}
	}

	private void openVideo()
	{
		if (mUri == null || mSurfaceHolder == null) {
			// not ready for playback just yet, will try again later
			return;
		}
		// Tell the music playback service to pause
		// TODO: these constants need to be published somewhere in the
		// framework.
		Intent i = new Intent("com.android.music.musicservicecommand");
		i.putExtra("command", "pause");
		getContext().sendBroadcast(i);

		// we shouldn't clear the target state, because somebody might have
		// called start() previously
		release(false);
		try {
			mMediaPlayer = new MediaPlayer();
			mMediaPlayer.setOnPreparedListener(mPreparedListener);
			mMediaPlayer.setOnVideoSizeChangedListener(mSizeChangedListener);
			mDuration = -1;
			mMediaPlayer.setOnCompletionListener(mCompletionListener);
			mMediaPlayer.setOnErrorListener(mErrorListener);
			mMediaPlayer.setOnBufferingUpdateListener(mBufferingUpdateListener);
			mCurrentBufferPercentage = 0;
			// mMediaPlayer.setDataSource(mContext, mUri, mHeaders); // Not in
			// public API
			if (URLUtil.isAssetUrl(mUri.toString())) { // DST: 20090606 detect
													   // asset url
				AssetFileDescriptor afd = null;
				try {
					String path = mUri.toString().substring("file:///android_asset/".length());
					afd = getContext().getAssets().openFd(path);
					mMediaPlayer.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
				} finally {
					if (afd != null) {
						afd.close();
					}
				}
			} else {
				setDataSource();
			}
			mMediaPlayer.setDisplay(mSurfaceHolder);
			mMediaPlayer.setAudioStreamType(AudioManager.STREAM_MUSIC);
			mMediaPlayer.setScreenOnWhilePlaying(true);
			mMediaPlayer.prepareAsync();
			mMediaPlayer.setVolume(mVolume, mVolume);
			if (mLoop == 0) {
				mMediaPlayer.setLooping(false);
			} else {
				mMediaPlayer.setLooping(true);
			}
			// we don't set the target state here either, but preserve the
			// target state that was there before.
			mCurrentState = STATE_PREPARING;
			attachMediaController();
		} catch (Throwable ex) {
			Log.e(TAG, "Unable to open content: " + mUri, ex);
			mCurrentState = STATE_ERROR;
			mTargetState = STATE_ERROR;
			mErrorListener.onError(mMediaPlayer, MediaPlayer.MEDIA_ERROR_UNKNOWN, 0);
		}
	}

	public void setMediaController(MediaController controller)
	{
		if (mMediaController != null) {
			mMediaController.hide();
		}
		mMediaController = controller;
		attachMediaController();
	}

	private void attachMediaController()
	{
		if (mMediaPlayer != null && mMediaController != null) {
			mMediaController.setMediaPlayer(this);
			View anchorView = this.getParent() instanceof View ? (View) this.getParent() : this;
			mMediaController.setAnchorView(anchorView);
			mMediaController.setEnabled(isInPlaybackState());
		}
	}

	MediaPlayer.OnVideoSizeChangedListener mSizeChangedListener = new MediaPlayer.OnVideoSizeChangedListener() {
		public void onVideoSizeChanged(MediaPlayer mp, int width, int height)
		{
			mVideoWidth = mp.getVideoWidth();
			mVideoHeight = mp.getVideoHeight();
			if (mVideoWidth != 0 && mVideoHeight != 0) {
				getHolder().setFixedSize(mVideoWidth, mVideoHeight);
			}
		}
	};

	MediaPlayer.OnPreparedListener mPreparedListener = new MediaPlayer.OnPreparedListener() {
		public void onPrepared(MediaPlayer mp)
		{
			mCurrentState = STATE_PREPARED;

			/**
			 * NOT IN PUBLIC API
			 * // Get the capabilities of the player for this stream
			 * Metadata data = mp.getMetadata(MediaPlayer.METADATA_ALL,
			 * MediaPlayer.BYPASS_METADATA_FILTER);
			 * if (data != null) {
			 * mCanPause = !data.has(Metadata.PAUSE_AVAILABLE) ||
			 * data.getBoolean(Metadata.PAUSE_AVAILABLE);
			 * mCanSeekBack = !data.has(Metadata.SEEK_BACKWARD_AVAILABLE)
			 * || data.getBoolean(Metadata.SEEK_BACKWARD_AVAILABLE);
			 * mCanSeekForward = !data.has(Metadata.SEEK_FORWARD_AVAILABLE)
			 * || data.getBoolean(Metadata.SEEK_FORWARD_AVAILABLE);
			 * } else {
			 * mCanPause = mCanSeekBack = mCanSeekForward = true;
			 * }
			 **/

			if (mOnPreparedListener != null) {
				mOnPreparedListener.onPrepared(mMediaPlayer);
			}
			if (mMediaController != null) {
				mMediaController.setEnabled(true);
			}
			mVideoWidth = mp.getVideoWidth();
			mVideoHeight = mp.getVideoHeight();

			int seekToPosition = mSeekWhenPrepared; // mSeekWhenPrepared may be
													// changed after seekTo()
													// call
			if (seekToPosition != 0) {
				seekTo(seekToPosition);
			}
			if (mVideoWidth != 0 && mVideoHeight != 0) {
				// Log.i("@@@@", "video size: " + mVideoWidth +"/"+
				// mVideoHeight);
				getHolder().setFixedSize(mVideoWidth, mVideoHeight);
				if (mSurfaceWidth == mVideoWidth && mSurfaceHeight == mVideoHeight) {
					// We didn't actually change the size (it was already at the
					// size
					// we need), so we won't get a "surface changed" callback,
					// so
					// start the video here instead of in the callback.
					if (mTargetState == STATE_PLAYING) {
						start();
						if (mMediaController != null) {
							mMediaController.show();
						}
					} else if (!isPlaying() && (seekToPosition != 0 || getCurrentPosition() > 0)) {
						if (mMediaController != null) {
							// Show the media controls when we're paused into a
							// video and make 'em stick.
							mMediaController.show(0);
						}
					}
				}
			} else {
				// We don't know the video size yet, but should start anyway.
				// The video size might be reported to us later.
				if (mTargetState == STATE_PLAYING) {
					start();
				}
			}
		}
	};

	private MediaPlayer.OnCompletionListener mCompletionListener = new MediaPlayer.OnCompletionListener() {
		public void onCompletion(MediaPlayer mp)
		{
			mCurrentState = STATE_PLAYBACK_COMPLETED;
			mTargetState = STATE_PLAYBACK_COMPLETED;
			if (mMediaController != null) {
				mMediaController.hide();
			}
			if (mOnCompletionListener != null) {
				mOnCompletionListener.onCompletion(mMediaPlayer);
			}
		}
	};

	private MediaPlayer.OnErrorListener mErrorListener = new MediaPlayer.OnErrorListener() {
		public boolean onError(MediaPlayer mp, int framework_err, int impl_err)
		{
			Log.d(TAG, "Error: " + framework_err + "," + impl_err);
			mCurrentState = STATE_ERROR;
			mTargetState = STATE_ERROR;
			if (mMediaController != null) {
				mMediaController.hide();
			}

			/* If an error handler has been supplied, use it and finish. */
			if (mOnErrorListener != null) {
				mOnErrorListener.onError(mMediaPlayer, framework_err, impl_err);
			}

			return true;
		}
	};

	private MediaPlayer.OnBufferingUpdateListener mBufferingUpdateListener =
		new MediaPlayer.OnBufferingUpdateListener() {
			public void onBufferingUpdate(MediaPlayer mp, int percent)
			{
				mCurrentBufferPercentage = percent;
			}
		};

	/**
	 * Register a callback to be invoked when the media file
	 * is loaded and ready to go.
	 *
	 * @param l
	 *            The callback that will be run
	 */
	public void setOnPreparedListener(MediaPlayer.OnPreparedListener l)
	{
		mOnPreparedListener = l;
	}

	/**
	 * Register a callback to be invoked when the end of a media file
	 * has been reached during playback.
	 *
	 * @param l
	 *            The callback that will be run
	 */
	public void setOnCompletionListener(OnCompletionListener l)
	{
		mOnCompletionListener = l;
	}

	/**
	 * Register a callback to be invoked when an error occurs
	 * during playback or setup. If no listener is specified,
	 * or if the listener returned false, VideoView will inform
	 * the user of any errors.
	 *
	 * @param l
	 *            The callback that will be run
	 */
	public void setOnErrorListener(OnErrorListener l)
	{
		mOnErrorListener = l;
	}

	SurfaceHolder.Callback mSHCallback = new SurfaceHolder.Callback() {
		public void surfaceChanged(SurfaceHolder holder, int format, int w, int h)
		{
			mSurfaceWidth = w;
			mSurfaceHeight = h;
			boolean isValidState = (mTargetState == STATE_PLAYING);
			boolean hasValidSize = (mVideoWidth == w && mVideoHeight == h);
			if (mMediaPlayer != null && isValidState && hasValidSize) {
				if (mSeekWhenPrepared != 0) {
					seekTo(mSeekWhenPrepared);
				}
				start();
				if (mMediaController != null) {
					mMediaController.show();
				}
			}
		}

		public void surfaceCreated(SurfaceHolder holder)
		{
			mSurfaceHolder = holder;
			// resume() was called before surfaceCreated()
			/*
			 * if (mMediaPlayer != null && mCurrentState == STATE_SUSPEND &&
			 * mTargetState == STATE_RESUME) {
			 * mMediaPlayer.setDisplay(mSurfaceHolder);
			 * resume();
			 * } else {
			 */
			openVideo(); /*
						 * }
						 */
		}

		public void surfaceDestroyed(SurfaceHolder holder)
		{
			// after we return from this we can't use the surface any more
			mSurfaceHolder = null;
			if (mMediaController != null)
				mMediaController.hide();
			if (mCurrentState != STATE_SUSPEND) {
				release(true);
			}
		}
	};

	/*
	 * release the media player in any state
	 */
	public void release(boolean cleartargetstate)
	{
		if (mMediaPlayer != null) {
			mMediaPlayer.release();
			mMediaPlayer = null;
			mCurrentState = STATE_IDLE;
			if (cleartargetstate) {
				mTargetState = STATE_IDLE;
			}
		}
	}

	@Override
	public boolean onTouchEvent(MotionEvent ev)
	{
		if (isInPlaybackState() && mMediaController != null) {
			toggleMediaControlsVisiblity();
		}
		return false;
	}

	@Override
	public boolean onTrackballEvent(MotionEvent ev)
	{
		if (isInPlaybackState() && mMediaController != null) {
			toggleMediaControlsVisiblity();
		}
		return false;
	}

	@Override
	public boolean onKeyDown(int keyCode, KeyEvent event)
	{
		boolean isKeyCodeSupported = keyCode != KeyEvent.KEYCODE_BACK && keyCode != KeyEvent.KEYCODE_VOLUME_UP
									 && keyCode != KeyEvent.KEYCODE_VOLUME_DOWN && keyCode != KeyEvent.KEYCODE_MENU
									 && keyCode != KeyEvent.KEYCODE_CALL && keyCode != KeyEvent.KEYCODE_ENDCALL;
		if (isInPlaybackState() && isKeyCodeSupported && mMediaController != null) {
			if (keyCode == KeyEvent.KEYCODE_HEADSETHOOK || keyCode == KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE) {
				if (mMediaPlayer.isPlaying()) {
					pause();
					mMediaController.show();
				} else {
					start();
					mMediaController.hide();
				}
				return true;
			} else if (keyCode == KeyEvent.KEYCODE_MEDIA_STOP && mMediaPlayer.isPlaying()) {
				pause();
				mMediaController.show();
			} else {
				toggleMediaControlsVisiblity();
			}
		}

		return super.onKeyDown(keyCode, event);
	}

	private void toggleMediaControlsVisiblity()
	{
		if (mMediaController.isShowing()) {
			mMediaController.hide();
		} else {
			mMediaController.show();
		}
	}

	public void start()
	{
		if (isInPlaybackState()) {
			mMediaPlayer.start();
			int oldState = mCurrentState;
			mCurrentState = STATE_PLAYING;
			// TITANIUM
			if (mPlaybackListener != null) {
				mPlaybackListener.onStartPlayback();
				// Fired after a stop or play is called after a after url change.
				if (oldState == STATE_PREPARED || oldState == STATE_PREPARING) {
					mPlaybackListener.onPlayingPlayback();
				}
			}
		}
		mTargetState = STATE_PLAYING;
	}

	public void pause()
	{
		if (isInPlaybackState()) {
			if (mMediaPlayer.isPlaying()) {
				mMediaPlayer.pause();
				mCurrentState = STATE_PAUSED;
				// TITANIUM
				if (mPlaybackListener != null) {
					mPlaybackListener.onPausePlayback();
				}
			}
		}
		mTargetState = STATE_PAUSED;
	}

	/*
	 * public void suspend()
	 * {
	 * if (isInPlaybackState()) {
	 * if (mMediaPlayer.suspend()) {
	 * mStateWhenSuspended = mCurrentState;
	 * mCurrentState = STATE_SUSPEND;
	 * mTargetState = STATE_SUSPEND;
	 * } else {
	 * release(false);
	 * mCurrentState = STATE_SUSPEND_UNSUPPORTED;
	 * Log.w(TAG, "Unable to suspend video. Release MediaPlayer.");
	 * }
	 * }
	 * }
	 */

	/*
	 * public void resume()
	 * {
	 * if (mSurfaceHolder == null && mCurrentState == STATE_SUSPEND) {
	 * mTargetState = STATE_RESUME;
	 * return;
	 * }
	 * if (mMediaPlayer != null && mCurrentState == STATE_SUSPEND) {
	 * if (mMediaPlayer.resume()) {
	 * mCurrentState = mStateWhenSuspended;
	 * mTargetState = mStateWhenSuspended;
	 * } else {
	 * Log.w(TAG, "Unable to resume video");
	 * }
	 * return;
	 * }
	 * if (mCurrentState == STATE_SUSPEND_UNSUPPORTED) {
	 * openVideo();
	 * }
	 * }
	 */

	// cache duration as mDuration for faster access
	public int getDuration()
	{
		if (isInPlaybackState()) {
			if (mDuration > 0) {
				return mDuration;
			}
			mDuration = mMediaPlayer.getDuration();
			return mDuration;
		}
		mDuration = -1;
		return mDuration;
	}

	public int getCurrentPosition()
	{
		if (isInPlaybackState()) {
			return mMediaPlayer.getCurrentPosition();
		}
		return 0;
	}

	public void seekTo(int msec)
	{
		int currPosition = getCurrentPosition();
		if (isInPlaybackState()) {
			mMediaPlayer.seekTo(msec);
			mSeekWhenPrepared = 0;
		} else {
			mSeekWhenPrepared = msec;
		}

		if (mPlaybackListener != null) {
			if (msec > currPosition) {
				mPlaybackListener.onSeekingForward();
			} else if (msec < currPosition) {
				mPlaybackListener.onSeekingBackward();
			}
		}
	}

	public boolean isPlaying()
	{
		return isInPlaybackState() && mMediaPlayer.isPlaying();
	}

	public int getBufferPercentage()
	{
		if (mMediaPlayer != null) {
			return mCurrentBufferPercentage;
		}
		return 0;
	}

	public boolean isInPlaybackState()
	{
		return (mMediaPlayer != null && mCurrentState != STATE_ERROR && mCurrentState != STATE_IDLE
				&& mCurrentState != STATE_PREPARING);
	}

	public boolean canPause()
	{
		return true;
	}

	public boolean canSeekBackward()
	{
		return true;
	}

	public boolean canSeekForward()
	{
		return true;
	}

	// TITANIUM
	public void setScalingMode(int scalingMode)
	{
		mScalingMode = scalingMode;
	}

	public void setRepeatMode(int repeatMode)
	{
		mLoop = repeatMode;
		if (mMediaPlayer != null) {
			if (mLoop == 0) {
				mMediaPlayer.setLooping(false);
			} else {
				mMediaPlayer.setLooping(true);
			}
		}
	}

	public int getRepeatMode()
	{
		return mLoop;
	}

	@Override
	public int getAudioSessionId()
	{
		// TODO Auto-generated method stub
		return 0;
	}
}

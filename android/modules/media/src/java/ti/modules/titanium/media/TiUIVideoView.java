/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;

import android.media.MediaPlayer;
import android.media.MediaPlayer.OnCompletionListener;
import android.media.MediaPlayer.OnErrorListener;
import android.media.MediaPlayer.OnPreparedListener;
import android.net.Uri;
import android.view.MotionEvent;
import android.view.View;
import android.view.View.OnTouchListener;
import android.widget.MediaController;
import android.widget.TiVideoView8;

public class TiUIVideoView
	extends TiUIView implements OnPreparedListener, OnCompletionListener, OnErrorListener, TiPlaybackListener
{
	private static final String TAG = "TiUIView";

	private TiVideoView8 videoView;
	private MediaController mediaController;

	public TiUIVideoView(TiViewProxy proxy)
	{
		super(proxy);
		TiCompositeLayout.LayoutParams params = getLayoutParams();
		params.autoFillsHeight = true;
		params.autoFillsWidth = true;
	}

	/**
	 * Used when setting video view to one created by our fullscreen TiVideoActivity, in which
	 * case we shouldn't create one of our own in this class.
	 * @param layout The activity's view group this method will attempt to find the VideoView in.
	 */
	public void setVideoViewFromActivityLayout(TiCompositeLayout layout)
	{
		setNativeView(layout);
		for (int i = 0; i < layout.getChildCount(); i++) {
			View child = layout.getChildAt(i);
			if (child instanceof TiVideoView8) {
				videoView = (TiVideoView8) child;
				break;
			}
		}
		initView();
	}

	private void initView()
	{
		if (nativeView == null) {
			TiCompositeLayout layout = new TiCompositeLayout(videoView.getContext(), proxy);
			layout.addView(videoView, new TiCompositeLayout.LayoutParams());
			setNativeView(layout);
		}
		videoView.setOnPreparedListener(this);
		videoView.setOnCompletionListener(this);
		videoView.setOnErrorListener(this);
		videoView.setOnPlaybackListener(this);
		videoView.setOnTouchListener(new OnTouchListener() {
			@Override
			public boolean onTouch(View v, MotionEvent event)
			{
				// TODO recognize clicks
				return false;
			}
		});
	}

	public void seekIfNeeded()
	{
		if (videoView == null) {
			return;
		}
		int seekTo = 0;
		Object initialPlaybackTime = proxy.getProperty(TiC.PROPERTY_INITIAL_PLAYBACK_TIME);
		if (initialPlaybackTime != null) {
			seekTo = TiConvert.toInt(initialPlaybackTime);
		}
		// Resuming from an activity pause?
		Object seekToOnResume = proxy.getProperty(VideoPlayerProxy.PROPERTY_SEEK_TO_ON_RESUME);
		if (seekToOnResume != null) {
			seekTo = TiConvert.toInt(seekToOnResume);
			proxy.setProperty(VideoPlayerProxy.PROPERTY_SEEK_TO_ON_RESUME, 0);
		}
		if (seekTo > 0) {
			videoView.seekTo(seekTo);
		}
	}

	@Override
	public void processProperties(KrollDict d)
	{
		if (videoView == null) {
			videoView = new TiVideoView8(proxy.getActivity());
			initView();
		}
		super.processProperties(d);

		if (videoView == null) {
			return;
		}

		getPlayerProxy().fireLoadState(MediaModule.VIDEO_LOAD_STATE_UNKNOWN);

		String url = d.getString(TiC.PROPERTY_URL);
		if (url != null) {
			videoView.setVideoURI(Uri.parse(proxy.resolveUrl(null, url)));
			seekIfNeeded();
		}

		// Proxy holds the scaling mode directly.
		videoView.setScalingMode(getPlayerProxy().getScalingMode());

		// Proxy holds the media control style directly.
		setMediaControlStyle(getPlayerProxy().getMediaControlStyle());

		if (d.containsKey(TiC.PROPERTY_VOLUME)) {
			videoView.setVolume(TiConvert.toFloat(d, TiC.PROPERTY_VOLUME, 1.0f));
		}
		if (d.containsKey(TiC.PROPERTY_REPEAT_MODE)) {
			videoView.setRepeatMode(TiConvert.toInt(d, TiC.PROPERTY_REPEAT_MODE));
		}
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (videoView == null) {
			return;
		}

		if (key.equals(TiC.PROPERTY_URL)) {
			if (newValue != null) {
				getPlayerProxy().fireLoadState(MediaModule.VIDEO_LOAD_STATE_UNKNOWN);
				videoView.setVideoURI(Uri.parse(proxy.resolveUrl(null, TiConvert.toString(newValue))));
				seekIfNeeded();
			} else {
				videoView.stopPlayback();
			}
		} else if (key.equals(TiC.PROPERTY_SCALING_MODE)) {
			videoView.setScalingMode(TiConvert.toInt(newValue));
		} else if (key.equals(TiC.PROPERTY_VOLUME)) {
			videoView.setVolume(TiConvert.toFloat(newValue));

		} else if (key.equals(TiC.PROPERTY_REPEAT_MODE)) {
			videoView.setRepeatMode(TiConvert.toInt(newValue));
		} else if (key.equals(TiC.PROPERTY_SHOWS_CONTROLS)) {
			setMediaControlStyle(getPlayerProxy().getMediaControlStyle());
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	public boolean isPlaying()
	{
		if (videoView == null) {
			return false;
		}
		return videoView.isPlaying();
	}

	public void setScalingMode(int mode)
	{
		if (videoView == null) {
			return;
		}

		videoView.setScalingMode(mode);
	}

	public void setRepeatMode(int mode)
	{
		if (videoView == null) {
			return;
		}

		videoView.setRepeatMode(mode);
	}

	public void setMediaControlStyle(int style)
	{
		if (videoView == null) {
			return;
		}

		// Determine if the overlaid controls should be shown/hidden based on given media style.
		boolean showController = true;
		switch (style) {
			case MediaModule.VIDEO_CONTROL_DEFAULT:
			case MediaModule.VIDEO_CONTROL_EMBEDDED:
			case MediaModule.VIDEO_CONTROL_FULLSCREEN:
				showController = true;
				break;
			case MediaModule.VIDEO_CONTROL_HIDDEN:
			case MediaModule.VIDEO_CONTROL_NONE:
				showController = false;
				break;
		}

		// If VideoPlayer's "showsControls" property is false,
		// then ignore "mediaControlStyle" property and hide controls.
		VideoPlayerProxy proxy = getPlayerProxy();
		if (proxy != null) {
			Object value = proxy.getProperty(TiC.PROPERTY_SHOWS_CONTROLS);
			if ((value instanceof Boolean) && value.equals(Boolean.FALSE)) {
				showController = false;
			}
		}

		// Show/hide the video's overlaid controls.
		if (showController) {
			if (mediaController == null) {
				mediaController = new MediaController(proxy.getActivity());
			}
			if (style == MediaModule.VIDEO_CONTROL_EMBEDDED) {
				mediaController.setAnchorView(videoView);
			}
			videoView.setMediaController(mediaController);
		} else {
			videoView.setMediaController(null);
		}
	}

	public void hideMediaController()
	{
		if (mediaController != null && mediaController.isShowing()) {
			mediaController.hide();
		}
	}

	public void play()
	{
		if (videoView == null) {
			return;
		}

		if (videoView.isPlaying()) {
			Log.w(TAG, "play() ignored, already playing");
			return;
		}

		if (!videoView.isInPlaybackState()) {
			// Url not loaded yet. Do that first.
			Object urlObj = proxy.getProperty(TiC.PROPERTY_URL);
			if (urlObj == null) {
				Log.w(TAG, "play() ignored, no url set.");
				return;
			}
			getPlayerProxy().fireLoadState(MediaModule.VIDEO_LOAD_STATE_UNKNOWN);
			videoView.setVideoURI(Uri.parse(proxy.resolveUrl(null, TiConvert.toString(urlObj))));
			seekIfNeeded();
		}

		videoView.start();
	}

	public void stop()
	{
		if (videoView == null) {
			return;
		}
		videoView.stopPlayback();
	}

	public void pause()
	{
		if (videoView == null) {
			return;
		}
		videoView.pause();
	}

	public int getCurrentPlaybackTime()
	{
		if (videoView == null) {
			return 0;
		}
		return videoView.getCurrentPosition();
	}

	public void seek(int milliseconds)
	{
		if (videoView == null) {
			return;
		}
		videoView.seekTo(milliseconds);
	}

	public void releaseVideoView()
	{
		if (videoView == null) {
			return;
		}
		try {
			videoView.release(true);
		} catch (Exception e) {
			Log.e(TAG, "Exception while releasing video resources", e);
		}
	}

	@Override
	public void release()
	{
		super.release();
		releaseVideoView();
		videoView = null;
		mediaController = null;
	}

	@Override
	public void onPrepared(MediaPlayer mp)
	{
		getPlayerProxy().onPlaybackReady(mp.getDuration());
	}

	@Override
	public void onCompletion(MediaPlayer mp)
	{
		getPlayerProxy().onPlaybackComplete();
	}

	@Override
	public boolean onError(MediaPlayer mp, int what, int extra)
	{
		getPlayerProxy().onPlaybackError(what);
		return false; // Let completion listener run.
	}

	@Override
	public void onStartPlayback()
	{
		getPlayerProxy().onPlaybackStarted();
	}

	@Override
	public void onPausePlayback()
	{
		getPlayerProxy().onPlaybackPaused();
	}

	@Override
	public void onStopPlayback()
	{
		getPlayerProxy().onPlaybackStopped();
	}

	@Override
	public void onPlayingPlayback()
	{
		getPlayerProxy().onPlaying();
	}

	@Override
	public void onSeekingForward()
	{
		getPlayerProxy().onSeekingForward();
	}

	@Override
	public void onSeekingBackward()
	{
		getPlayerProxy().onSeekingBackward();
	}

	private VideoPlayerProxy getPlayerProxy()
	{
		return ((VideoPlayerProxy) proxy);
	}
}

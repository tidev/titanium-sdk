/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
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

public class TiUIVideoView extends TiUIView
	implements OnPreparedListener, OnCompletionListener, OnErrorListener, TiPlaybackListener
{
	private static final String TAG = "TiUIView";

	private TiVideoView8 videoView;
	private MediaController mediaController;

	public TiUIVideoView(TiViewProxy proxy)
	{
		super(proxy);
	}

	/**
	 * Used when setting video view to one created by our fullscreen TiVideoActivity, in which
	 * case we shouldn't create one of our own in this class.
	 * @param vv instance of TiVideoView8 created by TiVideoActivity
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
			TiCompositeLayout layout = new TiCompositeLayout(videoView.getContext());
			layout.addView(videoView, new TiCompositeLayout.LayoutParams());
			setNativeView(layout);
		}
		videoView.setOnPreparedListener(this);
		videoView.setOnCompletionListener(this);
		videoView.setOnErrorListener(this);
		videoView.setOnTouchListener(new OnTouchListener() {
			@Override
			public boolean onTouch(View v, MotionEvent event)
			{
				// TODO recognize clicks
				return false;
			}
		});
	}

	private void seekIf()
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
		if (url == null) {
			url = d.getString(TiC.PROPERTY_CONTENT_URL);
			if (url != null) {
				Log.w(TAG, "contentURL is deprecated, use url instead");
				proxy.setProperty(TiC.PROPERTY_URL, url);
			}
		}
		if (url != null) {
			videoView.setVideoURI(Uri.parse(proxy.resolveUrl(null, url)));
			seekIf();
		}

		// Proxy holds the scaling mode directly.
		videoView.setScalingMode(getPlayerProxy().getScalingMode());

		// Proxy holds the media control style directly.
		setMediaControlStyle(getPlayerProxy().getMediaControlStyle());
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (videoView == null) {
			return;
		}

		if (key.equals(TiC.PROPERTY_URL) || key.equals(TiC.PROPERTY_CONTENT_URL)) {
			getPlayerProxy().fireLoadState(MediaModule.VIDEO_LOAD_STATE_UNKNOWN);
			videoView.setVideoURI(Uri.parse(proxy.resolveUrl(null, TiConvert.toString(newValue))));
			seekIf();
			if (key.equals(TiC.PROPERTY_CONTENT_URL)) {
				Log.w(TAG, "contentURL is deprecated, use url instead");
				proxy.setProperty(TiC.PROPERTY_URL, newValue);
			}
		} else if (key.equals(TiC.PROPERTY_SCALING_MODE)) {
			videoView.setScalingMode(TiConvert.toInt(newValue));
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

	public void setMediaControlStyle(int style)
	{
		if (videoView == null) {
			return;
		}

		boolean showController = true;

		switch(style) {
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
			seekIf();
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

	private VideoPlayerProxy getPlayerProxy()
	{
		return ((VideoPlayerProxy) proxy);
	}
}

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

	private TiVideoView8 mVideoView;
	private MediaController mMediaController;

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
				mVideoView = (TiVideoView8) child;
				break;
			}
		}
		initView();
	}

	private void initView()
	{
		if (nativeView == null) {
			TiCompositeLayout layout = new TiCompositeLayout(mVideoView.getContext());
			layout.addView(mVideoView, new TiCompositeLayout.LayoutParams());
			setNativeView(layout);
		}
		mVideoView.setOnPreparedListener(this);
		mVideoView.setOnCompletionListener(this);
		mVideoView.setOnErrorListener(this);
		mVideoView.setOnTouchListener(new OnTouchListener() {
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
		if (mVideoView == null) {
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
			mVideoView.seekTo(seekTo);
		}
	}

	@Override
	public void processProperties(KrollDict d)
	{
		if (mVideoView == null) {
			mVideoView = new TiVideoView8(proxy.getActivity());
			initView();
		}
		super.processProperties(d);

		if (mVideoView == null) {
			return;
		}

		((VideoPlayerProxy) proxy).fireLoadState(MediaModule.VIDEO_LOAD_STATE_UNKNOWN);

		String url = d.getString(TiC.PROPERTY_URL);
		if (url == null) {
			url = d.getString(TiC.PROPERTY_CONTENT_URL);
			if (url != null) {
				Log.w(TAG, "contentURL is deprecated, use url instead");
				proxy.setProperty(TiC.PROPERTY_URL, url);
			}
		}
		if (url != null) {
			mVideoView.setVideoURI(Uri.parse(proxy.resolveUrl(null, url)));
			seekIf();
		}

		// Proxy holds the scaling mode directly.
		mVideoView.setScalingMode(((VideoPlayerProxy) proxy).getScalingMode());

		// Proxy holds the media control style directly.
		setMediaControlStyle(((VideoPlayerProxy) proxy).getMediaControlStyle());
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (mVideoView == null) {
			return;
		}

		if (key.equals(TiC.PROPERTY_URL) || key.equals(TiC.PROPERTY_CONTENT_URL)) {
			((VideoPlayerProxy) proxy).fireLoadState(MediaModule.VIDEO_LOAD_STATE_UNKNOWN);
			mVideoView.setVideoURI(Uri.parse(proxy.resolveUrl(null, TiConvert.toString(newValue))));
			seekIf();
			if (key.equals(TiC.PROPERTY_CONTENT_URL)) {
				Log.w(TAG, "contentURL is deprecated, use url instead");
				proxy.setProperty(TiC.PROPERTY_URL, newValue);
			}
		} else if (key.equals(TiC.PROPERTY_SCALING_MODE)) {
			mVideoView.setScalingMode(TiConvert.toInt(newValue));
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	public boolean isPlaying()
	{
		if (mVideoView == null) {
			return false;
		}
		return mVideoView.isPlaying();
	}

	public void setScalingMode(int mode)
	{
		if (mVideoView == null) {
			return;
		}

		mVideoView.setScalingMode(mode);
	}

	public void setMediaControlStyle(int style)
	{
		if (mVideoView == null) {
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
			if (mMediaController == null) {
				mMediaController = new MediaController(proxy.getActivity());
			}
			if (style == MediaModule.VIDEO_CONTROL_EMBEDDED) {
				mMediaController.setAnchorView(mVideoView);
			}
			mVideoView.setMediaController(mMediaController);
		} else {
			mVideoView.setMediaController(null);
		}
	}

	public void hideMediaController()
	{
		if (mMediaController != null && mMediaController.isShowing()) {
			mMediaController.hide();
		}
	}

	public void play()
	{
		if (mVideoView == null) { return; }

		if (mVideoView.isPlaying()) {
			Log.w(TAG, "play() ignored, already playing");
			return;
		}

		if (!mVideoView.isInPlaybackState()) {
			// Url not loaded yet. Do that first.
			Object urlObj = proxy.getProperty(TiC.PROPERTY_URL);
			if (urlObj == null) {
				Log.w(TAG, "play() ignored, no url set.");
				return;
			}
			((VideoPlayerProxy) proxy).fireLoadState(MediaModule.VIDEO_LOAD_STATE_UNKNOWN);
			mVideoView.setVideoURI(Uri.parse(proxy.resolveUrl(null, TiConvert.toString(urlObj))));
			seekIf();
		}

		mVideoView.start();

	}

	public void stop()
	{
		if (mVideoView == null) {
			return;
		}
		mVideoView.stopPlayback();
	}

	public void pause()
	{
		if (mVideoView == null) {
			return;
		}
		mVideoView.pause();
	}

	public int getCurrentPlaybackTime()
	{
		if (mVideoView == null) {
			return 0;
		}
		return mVideoView.getCurrentPosition();
	}

	public void seek(int milliseconds)
	{
		if (mVideoView == null) {
			return;
		}
		mVideoView.seekTo(milliseconds);
	}

	public void releaseVideoView()
	{
		if (mVideoView == null) {
			return;
		}
		try {
			mVideoView.release(true);
		} catch (Exception e) { /* ignore */
		}
	}

	@Override
	public void release()
	{
		super.release();
		try {
			releaseVideoView();
			mVideoView = null;
			mMediaController = null;
		} catch (Exception e) { /* ignore */
		}
	}

	@Override
	public void onPrepared(MediaPlayer mp)
	{
		((VideoPlayerProxy) proxy).onPlaybackReady(mp.getDuration());
	}

	@Override
	public void onCompletion(MediaPlayer mp)
	{
		((VideoPlayerProxy) proxy).onPlaybackComplete();
	}

	@Override
	public boolean onError(MediaPlayer mp, int what, int extra)
	{
		((VideoPlayerProxy) proxy).onPlaybackError(what);
		return false; // Let completion listener run.
	}

	@Override
	public void onStartPlayback()
	{
		((VideoPlayerProxy) proxy).onPlaybackStarted();
	}

	@Override
	public void onPausePlayback()
	{
		((VideoPlayerProxy) proxy).onPlaybackPaused();
	}

	@Override
	public void onStopPlayback()
	{
		((VideoPlayerProxy) proxy).onPlaybackStopped();
	}
}

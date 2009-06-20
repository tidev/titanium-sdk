/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Bundle;
import android.util.Config;
import android.util.Log;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.Window;
import android.view.View.OnKeyListener;
import android.webkit.URLUtil;
import android.widget.FrameLayout;
import android.widget.MediaController;
import android.widget.TiVideoView;

public class TitaniumVideoActivity extends Activity implements MediaPlayer.OnCompletionListener, MediaPlayer.OnErrorListener
{
	private static final String LCAT = "TiVideoActivity";
	private static final boolean DBG = Config.LOGD;

	private String url;
	private TiVideoView vv;
	private FrameLayout layout;

	private boolean paused = false;
	private boolean playOnResume = false;

	@Override
	protected void onCreate(Bundle savedInstanceState)
	{
		super.onCreate(savedInstanceState);

		Intent intent = getIntent();
		if (intent == null) {
			Log.w(LCAT, "You must launch this Activity via an Intent");
			finish();
		}
		this.url = intent.getDataString();
		if (url == null) {
			Log.w(LCAT, "This activity require the url to the video in the Intent");
			finish();
		}

		FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
				FrameLayout.LayoutParams.FILL_PARENT, FrameLayout.LayoutParams.FILL_PARENT);

		layout = new FrameLayout(this);
		layout.setBackgroundColor(Color.argb(230, 32, 32,32));

		layout.setOnTouchListener(new View.OnTouchListener(){

			public boolean onTouch(View arg0, MotionEvent arg1) {
				return true;
			}});

		vv = new TiVideoView(this);
		vv.setId(1000);
		vv.setMediaController(new MediaController(this));
		vv.setOnKeyListener(new OnKeyListener() {

			public boolean onKey(View v, int keyCode, KeyEvent event) {
				boolean handled = false;
		        if ((keyCode == KeyEvent.KEYCODE_BACK)) {

		        	vv.seekTo(vv.getDuration());
		        	if (!vv.isPlaying()) {
		        		vv.start();
		        	}

		        	handled = false;
		        	finish();
		        }
		        return  handled;
			}});

		params.gravity = Gravity.CENTER;
		layout.addView(vv, params);
		if (URLUtil.isAssetUrl(url)) {
			Log.e(LCAT, "Video Path: " + url);
			vv.setVideoPath(url);
		} else {
			vv.setVideoURI(Uri.parse(url));
		}
		vv.setOnCompletionListener(this);
		vv.setOnErrorListener(this);

		requestWindowFeature(Window.FEATURE_NO_TITLE);
		setContentView(layout);

		playOnResume = true;
	}

	public boolean isPaused() {
		return paused;
	}

	public boolean isPlaying() {
		boolean result = false;
		if (vv != null) {
			result = vv.isPlaying();
		}
		return result;
	}

	public void pause() {
		if (vv != null) {
			if(vv.isPlaying()) {
				if (DBG) {
					Log.d(LCAT,"audio is playing, pause");
				}
				vv.pause();
				paused = true;
			}
		}
	}

	public void play() {
		if(!isPlaying()) {
			if (DBG) {
				Log.d(LCAT,"audio is not playing, starting.");
			}
			vv.start();
			paused = false;
		}
	}

	public void reset() {
		if (vv != null) {
			paused = false;
		}
	}

	public void release()
	{
		if (vv != null) {
			vv.setOnCompletionListener(null);
			vv.setOnErrorListener(null);
			vv.setOnKeyListener(null);
			stop();
			vv = null;
			if (DBG) {
				Log.d(LCAT, "Native resources released.");
			}
		}
	}

	public void stop() {
		if (vv.isPlaying() || isPaused()) {
			if (DBG) {
				Log.d(LCAT, "audio is playing, stop()");
			}
			vv.stopPlayback();
		}

		if(isPaused()) {
			paused = false;
		}
	}

	public void onCompletion(MediaPlayer mp) {
		stop();
	}

	public boolean onError(MediaPlayer mp, int what, int extra)
	{
		int code = 0;
		String msg = "Unknown media error.";
		if (what == MediaPlayer.MEDIA_ERROR_SERVER_DIED) {
			msg = "Media server died";
		}

		Log.e(LCAT, "Error during video playback code(" + code + ") : " + msg);
		release();

		return true;
	}

	@Override
	protected void onResume() {
		super.onResume();
		if(playOnResume) {
			play();
			playOnResume = false;
		}
	}

	@Override
	protected void onPause() {
		super.onPause();
		if (isPlaying()) {
			pause();
			playOnResume = true;
		}
	}

	@Override
	protected void onDestroy() {
		release();
		super.onDestroy();
	}
}

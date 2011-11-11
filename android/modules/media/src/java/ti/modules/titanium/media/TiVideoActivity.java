/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiPlatformHelper;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.media.MediaPlayer;
import android.media.MediaPlayer.OnCompletionListener;
import android.media.MediaPlayer.OnPreparedListener;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;
import android.os.ResultReceiver;
import android.util.DisplayMetrics;
import android.view.Display;
import android.view.View;
import android.widget.MediaController;
import android.widget.TiVideoView4;

public class TiVideoActivity extends Activity
	implements Handler.Callback
{
	private static final String LCAT = "TiVideoActivity";
	private static final boolean DBG = TiConfig.LOGD;

	public static final int MSG_PLAY = 10000;
	public static final int MSG_ADD_VIEW = 10001;
	public static final int MSG_STOP_PLAYBACK = 10002;
	public static final int MSG_HIDE = 10003;
	public static final int MSG_MEDIA_CONTROL_STYLE_CHANGE = 10004;
	public static final int MSG_PAUSE_PLAYBACK = 10005;
	public static final int MSG_START_PLAYBACK = 10006;
	public static final int MSG_SCALING_MODE_CHANGE = 10007;

	private Handler handler;
	private String contentUrl;
	private Messenger proxyMessenger;
	private ResultReceiver messengerReceiver;
	private MediaController mediaController;

	private TiCompositeLayout layout;
	private TiVideoView4 videoView;

	private boolean started = false;

	public TiVideoActivity() {
	}

	@Override
	protected void onCreate(Bundle savedInstanceState)
	{
		super.onCreate(savedInstanceState);

		if (DBG) {
			Log.i(LCAT, "TiVideoActivity onCreate");
		}
		handler = new Handler(this);

		final Intent intent = getIntent();

		contentUrl = intent.getStringExtra(TiC.PROPERTY_CONTENT_URL);
		boolean play = intent.getBooleanExtra(TiC.PROPERTY_PLAY, false);
		videoView = new TiVideoView4(this) {

			@Override
			protected void measureVideo(int videoWidth, int videoHeight,
					int widthMeasureSpec, int heightMeasureSpec) 
			{
				if (DBG) {
					Log.e(LCAT, "******* mVideoWidth: " + videoWidth + " mVideoHeight: " + videoHeight +
		    			" width: " + MeasureSpec.getSize(widthMeasureSpec) + " height: " + MeasureSpec.getSize(heightMeasureSpec));
				}

		        int width = getDefaultSize(videoWidth, widthMeasureSpec);
		        int height = getDefaultSize(videoHeight, heightMeasureSpec);
		        if (videoWidth > 0 && videoHeight > 0) {
		        	int mode = intent.getIntExtra(TiC.PROPERTY_SCALING_MODE, MediaModule.VIDEO_SCALING_ASPECT_FIT);
		        	
		        	switch(mode) {
			        	case MediaModule.VIDEO_SCALING_NONE : {
			        		width = videoWidth;
			        		height = videoHeight;
			        		break;
			        	}
			        	case MediaModule.VIDEO_SCALING_ASPECT_FILL : {
				            if ( videoWidth * height  > width * videoHeight ) {
				                width = height * videoWidth / videoHeight;
				            } else if ( videoWidth * height  < width * videoHeight ) {
				                height = width * videoHeight / videoWidth;
				            }
			        		break;
			        	}
			        	case MediaModule.VIDEO_SCALING_ASPECT_FIT : {
				            if ( videoWidth * height  > width * videoHeight ) {
				                height = width * videoHeight / videoWidth;
				            } else if ( videoWidth * height  < width * videoHeight ) {
				                width = height * videoWidth / videoHeight;
				            }
				            break;
			        	}
			        	case MediaModule.VIDEO_SCALING_MODE_FILL : {
			        		width = MeasureSpec.getSize(widthMeasureSpec);
			        		height = MeasureSpec.getSize(heightMeasureSpec);
			        		break;
			        	}
		        	}
		        }
		        String model = TiPlatformHelper.getModel();
		        if (model != null && model.equals("SPH-P100")) {
			        Display d = getWindowManager().getDefaultDisplay();
			        if (d != null) {
			        	DisplayMetrics dm = new DisplayMetrics();
			        	d.getMetrics(dm);
			        	if (TiPlatformHelper.applicationLogicalDensity != dm.densityDpi) {
				        	int maxScaledWidth = (int) Math.floor((d.getWidth() - 1) * TiPlatformHelper.applicationScaleFactor);
				        	int maxScaledHeight = (int) Math.floor((d.getHeight() - 1) * TiPlatformHelper.applicationScaleFactor);
				        	if (width * TiPlatformHelper.applicationScaleFactor > maxScaledWidth) {
				        		int oldWidth = width;		        	
				        		width = d.getWidth() - 1;
						        if (DBG) {
						        	Log.d(LCAT, "TOO WIDE: " + oldWidth + " changed to " + width);
						        }
				        	}
				        	if (height * TiPlatformHelper.applicationScaleFactor >  maxScaledHeight) {
				        		int oldHeight = height;
				        		height = d.getHeight() - 1;
						        if (DBG) {
						        	Log.d(LCAT, "TOO HIGH: " + oldHeight + " changed to " + height);
						        }
				        	}
			        	}
			        }
		        }
		        if (DBG) {
		        	Log.i(LCAT, "setting size: " + width + 'x' + height);
		        }
		        setMeasuredDimension(width, height);
			}			
		};
	
		if (play) {
			Thread t = new Thread(new Runnable(){

				@Override
				public void run() {
					Log.i(LCAT, "Setting URI");
					videoView.setVideoURI(Uri.parse(contentUrl));
					videoView.start();
					Log.i(LCAT, "URI Set, start called.");
				}
			});
			t.setPriority(Thread.MAX_PRIORITY - 1);
			t.start();
		}

		proxyMessenger = intent.getParcelableExtra(TiC.PROPERTY_MESSENGER);
		messengerReceiver = intent.getParcelableExtra(TiC.PROPERTY_MESSENGER_RECEIVER);
		
		if (intent.hasExtra(TiC.PROPERTY_BACKGROUND_COLOR)) {
			ColorDrawable d = new ColorDrawable(intent.getIntExtra(TiC.PROPERTY_BACKGROUND_COLOR, Color.RED));
			getWindow().setBackgroundDrawable(d);
		}

		layout = new TiCompositeLayout(this);
		videoView.setOnPreparedListener(new OnPreparedListener(){

			@Override
			public void onPrepared(MediaPlayer mp)
			{
				sendProxyMessage(VideoPlayerProxy.CONTROL_MSG_LOAD);
			}
		});
		videoView.setOnCompletionListener(new OnCompletionListener(){

			@Override
			public void onCompletion(MediaPlayer mp) {
				sendProxyMessage(VideoPlayerProxy.CONTROL_MSG_COMPLETE);
				started = false;
			}
		});

		int style = MediaModule.VIDEO_CONTROL_DEFAULT;
		
		if (intent.hasExtra(TiC.PROPERTY_MEDIA_CONTROL_STYLE)) {
			style = intent.getIntExtra(TiC.PROPERTY_MEDIA_CONTROL_STYLE, MediaModule.VIDEO_CONTROL_DEFAULT);
			handleControlVisibility(style);
		}
		videoView.requestFocus();

		TiCompositeLayout.LayoutParams params = new TiCompositeLayout.LayoutParams();
//		params.autoFillsHeight = true;
//		params.autoFillsWidth = true;
//		params.autoHeight = true;
//		params.autoWidth = true;
		layout.addView(videoView, params);

		setContentView(layout);
		Log.e(LCAT, "exiting onCreate");
	}

	@Override
	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_PLAY : {

				if (!started) {
					Uri uri = Uri.parse(contentUrl);
					videoView.setVideoURI(uri);
				}
				videoView.start();
				started = true;

				return true;
			}
			case MSG_ADD_VIEW : {

				TiViewProxy proxy = (TiViewProxy) msg.obj;
				proxy.setActivity(this);
				TiUIView tiv = proxy.getOrCreateView();
				View v = tiv.getNativeView();
				if (v != null) {
					layout.addView(v, tiv.getLayoutParams());
				}
				return true;
			}
			
			case MSG_STOP_PLAYBACK: {
				if (videoView != null && started) {
					videoView.stopPlayback();
					started = false;
					return true;
				}
				return false;
			}
			case MSG_PAUSE_PLAYBACK: {
				if (videoView != null && started) {
					videoView.pause();
					started = false;
					return true;
				}
				return false;
			}
			case MSG_START_PLAYBACK: {
				if (videoView != null && !started) {
					videoView.start();
					started = true;
					return true;
				}
				return false;				
			}
			case MSG_HIDE: {
				if (videoView != null && started) {
					videoView.stopPlayback();
					started = false;
				}
				finish();
				return true;
			} 
			case MSG_MEDIA_CONTROL_STYLE_CHANGE : {
				int style = msg.arg1;
				handleControlVisibility(style);
				return true;
			}
			case MSG_SCALING_MODE_CHANGE : {
				int mode = msg.arg1;
				getIntent().putExtra(TiC.PROPERTY_SCALING_MODE, mode);
				layout.requestLayout();
				return true;
			}
		}
		return false;
	}

	private void handleControlVisibility(int style) 
	{
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
				mediaController = new MediaController(this);
			}
			videoView.setMediaController(mediaController);
		} else {
			videoView.setMediaController(null);
		}
	}
	
	@Override
	public void onConfigurationChanged(Configuration newConfig) {
		super.onConfigurationChanged(newConfig);
		if (mediaController != null && mediaController.isShowing()) {
			mediaController.hide();
		}
	}

	@Override
	protected void onStart() {
		super.onStart();

		if (messengerReceiver != null) {
			if (DBG) {
				Log.d(LCAT, "Sending messenger to VideoPlayerProxy");
			}
			Bundle resultData = new Bundle();
			resultData.putParcelable("messenger", new Messenger(handler));
			messengerReceiver.send(0, resultData);
			messengerReceiver = null;
		}
	}

	@Override
	protected void onResume() {
		super.onResume();

		((TiApplication) getApplication()).setCurrentActivity(this, this);

		if (started) {
			videoView.start();
		}
	}

	@Override
	protected void onPause() {
		super.onPause();
		((TiApplication) getApplication()).setCurrentActivity(this, null);
		videoView.pause();
	}

	@Override
	protected void onDestroy() {
		super.onDestroy();
		videoView.stopPlayback();
		layout.removeAllViews();

		if (proxyMessenger != null) {
			sendProxyMessage(VideoPlayerProxy.CONTROL_MSG_COMPLETE);
		}
	}

	private void sendProxyMessage(final int messageId)
	{
		if (proxyMessenger != null) {
			Message msg = Message.obtain();
			msg.what = messageId;
			try {
				proxyMessenger.send(msg);
			} catch (RemoteException e) {
				Log.w(LCAT, "VideoPlayerProxy no longer available: " + e.getMessage());
			}
		}
	}
}

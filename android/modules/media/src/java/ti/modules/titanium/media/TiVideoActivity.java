/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiLifecycle;
import org.appcelerator.titanium.view.TiCompositeLayout;

import android.app.Activity;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;
import android.widget.TiVideoView8;

public class TiVideoActivity extends Activity
{
	private static final String LCAT = "TiVideoActivity";
	private static final boolean DBG = TiConfig.LOGD;

	protected TiCompositeLayout mLayout = null;
	private Messenger mProxyMessenger = null;
	private TiLifecycle.OnLifecycleEvent mLifecycleListener = null;

	public TiVideoActivity() {}

	@Override
	protected void onCreate(Bundle savedInstanceState)
	{
		super.onCreate(savedInstanceState);

		if (DBG) {
			Log.i(LCAT, "TiVideoActivity onCreate");
		}

		final Intent intent = getIntent();

		mProxyMessenger = intent.getParcelableExtra(TiC.PROPERTY_MESSENGER);

		if (intent.hasExtra(TiC.PROPERTY_BACKGROUND_COLOR)) {
			ColorDrawable d = new ColorDrawable(intent.getIntExtra(TiC.PROPERTY_BACKGROUND_COLOR, Color.RED));
			getWindow().setBackgroundDrawable(d);
		}

		mLayout = new TiCompositeLayout(this);
		mLayout.addView(new TiVideoView8(this), new TiCompositeLayout.LayoutParams());

		setContentView(mLayout);

		if (mProxyMessenger != null) {
			Message msg = Message.obtain();
			msg.what = VideoPlayerProxy.CONTROL_MSG_ACTIVITY_AVAILABLE;
			msg.obj = this;
			try {
				mProxyMessenger.send(msg);
			} catch (RemoteException e) {
				Log.e(LCAT, "Cannot send activity available message to proxy", e);
			}
		}

		Log.e(LCAT, "exiting onCreate");
	}

	@Override
	public void onConfigurationChanged(Configuration newConfig) {
		super.onConfigurationChanged(newConfig);
		sendProxyMessage(VideoPlayerProxy.CONTROL_MSG_CONFIG_CHANGED);
	}

	@Override
	protected void onStart() {
		super.onStart();

		if (mLifecycleListener != null) {
			mLifecycleListener.onStart(this);
		}
	}

	@Override
	protected void onResume() {
		super.onResume();

		TiApplication.getInstance().setCurrentActivity(this, this);
		if (mLifecycleListener != null) {
			mLifecycleListener.onResume(this);
		}
	}

	@Override
	protected void onPause() {
		super.onPause();

		TiApplication.getInstance().setCurrentActivity(this, null);
		if (mLifecycleListener != null) {
			mLifecycleListener.onPause(this);
		}
	}

	@Override
	protected void onDestroy() {
		super.onDestroy();

		if (mLifecycleListener != null) {
			mLifecycleListener.onDestroy(this);
		}
	}

	private void sendProxyMessage(final int messageId)
	{
		if (mProxyMessenger != null) {
			Message msg = Message.obtain();
			msg.what = messageId;
			try {
				mProxyMessenger.send(msg);
			} catch (RemoteException e) {
				Log.w(LCAT, "VideoPlayerProxy no longer available: " + e.getMessage());
			}
		}
	}

	public void setOnLifecycleEventListener(TiLifecycle.OnLifecycleEvent listener)
	{
		mLifecycleListener = listener;
	}

}

package ti.modules.titanium.media;

import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.content.Intent;
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
import android.view.View;
import android.widget.TiVideoView4;

public class TiVideoActivity extends Activity
	implements Handler.Callback
{
	private static final String LCAT = "TiVideoActivity";
	private static final boolean DBG = TiConfig.LOGD;

	public static final int MSG_PLAY = 10000;
	public static final int MSG_ADD_VIEW = 10001;

	private Handler handler;
	private String contentUrl;
	private Messenger proxyMessenger;
	private ResultReceiver messengerReceiver;

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

		Intent intent = getIntent();

		contentUrl = intent.getStringExtra("contentURL");
		proxyMessenger = intent.getParcelableExtra("messenger");
		messengerReceiver = intent.getParcelableExtra("messengerReceiver");

		if (intent.hasExtra("backgroundColor")) {
			ColorDrawable d = new ColorDrawable(intent.getIntExtra("backgroundColor", Color.RED));
			getWindow().setBackgroundDrawable(d);
		}

		layout = new TiCompositeLayout(this);
		videoView = new TiVideoView4(this);
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

		TiCompositeLayout.LayoutParams params = new TiCompositeLayout.LayoutParams();
//		params.autoFillsHeight = true;
//		params.autoFillsWidth = true;
		params.autoHeight = true;
		params.autoWidth = true;
		layout.addView(videoView, params);

		setContentView(layout);

	}

	@Override
	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_PLAY : {

				Uri uri = Uri.parse(contentUrl);
				videoView.setVideoURI(uri);
				videoView.start();
				started = true;

				return true;
			}
			case MSG_ADD_VIEW : {

				// TODO do we need to save the proxies?
				TiViewProxy proxy = (TiViewProxy) msg.obj;
				TiUIView tiv = proxy.getView(this);
				View v = tiv.getNativeView();
				if (v != null) {
					layout.addView(v, tiv.getLayoutParams());
				}
				return true;
			}
		}
		return false;
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

		if (started) {
			videoView.start();
		}
	}

	@Override
	protected void onPause() {
		super.onPause();
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

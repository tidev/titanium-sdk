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
import android.widget.MediaController;
import android.widget.TiVideoView8;

public class TiUIVideoView extends TiUIView
	implements OnPreparedListener, OnCompletionListener, OnErrorListener
{
	private static final String TAG = "TiUIView";
	private static final String EVENT_PROPERTY_DURATION = "duration";
	private static final String EVENT_DURATION_AVAILABLE = "durationAvailable";
	private static final String EVENT_LOADSTATE = "loadstate";
	private static final String PROPERTY_LOADSTATE = "loadState";
	private static final String PROPERTY_CURRENT_PLAYBACK_TIME = "currentPlaybackTime";

	private TiVideoView8 mVideoView;
	private MediaController mMediaController;

	public TiUIVideoView(TiViewProxy proxy)
	{
		super(proxy);
		mVideoView = new TiVideoView8(proxy.getActivity());
		TiCompositeLayout layout = new TiCompositeLayout(proxy.getActivity());
		TiCompositeLayout.LayoutParams params = new TiCompositeLayout.LayoutParams();
		layout.addView(mVideoView, new TiCompositeLayout.LayoutParams());
		mVideoView.setOnPreparedListener(this);
		mVideoView.setOnCompletionListener(this);
		mVideoView.setOnErrorListener(this);
		setNativeView(layout);
	}

	@Override
	public void processProperties(KrollDict d)
	{
		super.processProperties(d);

		if (mVideoView == null) {
			return;
		}

		String url = d.getString(TiC.PROPERTY_URL);
		if (url == null) {
			url = d.getString(TiC.PROPERTY_CONTENT_URL);
			if (url != null) {
				Log.w(TAG, "contentURL is deprecated, use url instead");
			}
		}
		if (url != null) {
			fireLoadState(MediaModule.VIDEO_LOAD_STATE_UNKNOWN);
			mVideoView.setVideoURI(Uri.parse(proxy.resolveUrl(null, url)));
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
			fireLoadState(MediaModule.VIDEO_LOAD_STATE_UNKNOWN);
			mVideoView.setVideoURI(Uri.parse(proxy.resolveUrl(null, TiConvert.toString(newValue))));
			if (key.equals(TiC.PROPERTY_CONTENT_URL)) {
				Log.w(TAG, "contentURL is deprecated, use url instead");
			}
		} else if (key.equals(TiC.PROPERTY_SCALING_MODE)) {
			mVideoView.setScalingMode(TiConvert.toInt(newValue));
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
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
			fireLoadState(MediaModule.VIDEO_LOAD_STATE_UNKNOWN);
			mVideoView.setVideoURI(Uri.parse(proxy.resolveUrl(null, TiConvert.toString(urlObj))));
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

	private void fireLoadState(int state)
	{
		KrollDict args = new KrollDict();
		args.put(PROPERTY_LOADSTATE, state);
		int currentPlaybackTime = 0;
		if (mVideoView != null) {
			currentPlaybackTime = mVideoView.getCurrentPosition();
		}
		args.put(PROPERTY_CURRENT_PLAYBACK_TIME, currentPlaybackTime);
		proxy.fireEvent(EVENT_LOADSTATE, args);
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
		KrollDict data = new KrollDict();
		int duration = mp.getDuration();
		data.put(EVENT_PROPERTY_DURATION, duration);
		proxy.setProperty(TiC.PROPERTY_DURATION, duration);
		proxy.fireEvent(EVENT_DURATION_AVAILABLE, data);
		fireLoadState(MediaModule.VIDEO_LOAD_STATE_PLAYABLE);
	}

	@Override
	public void onCompletion(MediaPlayer mp)
	{
		proxy.fireEvent(TiC.EVENT_COMPLETE, null);
	}

	@Override
	public boolean onError(MediaPlayer mp, int what, int extra)
	{
		String message = "Unknown";
		switch(what) {
			case MediaPlayer.MEDIA_ERROR_NOT_VALID_FOR_PROGRESSIVE_PLAYBACK:
				message = "Not valid for progressive playback";
				break;
			case MediaPlayer.MEDIA_ERROR_SERVER_DIED:
				message = "Server died";
				break;
		}
		KrollDict data = new KrollDict();
		data.put(TiC.EVENT_PROPERTY_MESSAGE, message);
		proxy.fireEvent(TiC.EVENT_ERROR, data);
		fireLoadState(MediaModule.VIDEO_LOAD_STATE_UNKNOWN);
		return false; // Let onCompletionListener fire.
	}
}

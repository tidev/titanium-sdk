package ti.modules.titanium.media;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.os.Message;

@Kroll.proxy(creatableInModule = MediaModule.class, propertyAccessors = {
	"url", "initialPlaybackTime", "duration", "scalingMode", "mediaControlStyle"
})
public class VideoViewProxy extends TiViewProxy
{
	private static final String TAG = "TiVideoView";
	private static final boolean DBG = TiConfig.LOGD;

	private static final int MSG_FIRST_ID = TiViewProxy.MSG_LAST_ID + 1;
	private static final int MSG_PLAY = MSG_FIRST_ID + 101;
	private static final int MSG_STOP = MSG_FIRST_ID + 102;
	private static final int MSG_PAUSE = MSG_FIRST_ID + 103;

	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUIVideoView(this);
	}

	private void control(int action)
	{
		if (DBG) {
			Log.d(TAG, getActionName(action));
		}

		if (!TiApplication.isUIThread()) {
			getMainHandler().sendEmptyMessage(action);
			return;
		}

		TiUIView view = peekView();
		if (view == null) {
			Log.w(TAG, "Player action ignored; player has not been created.");
			return;
		}

		TiUIVideoView vv = (TiUIVideoView) view;

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

	@Kroll.method
	public void stop()
	{
		control(MSG_STOP);
	}

	@Kroll.method
	public void pause()
	{
		control(MSG_PAUSE);
	}

	@Kroll.method @Kroll.getProperty
	public int getCurrentPlaybackTime()
	{
		if (view == null) {
			return 0;
		}

		return ((TiUIVideoView) view).getCurrentPlaybackTime();
	}

	@Kroll.method @Kroll.setProperty
	public void setCurrentPlaybackTime(int milliseconds)
	{
		if (DBG) {
			Log.d(TAG, "setCurrentPlaybackTime(" + milliseconds + ")");
		}

		if (view != null) {
			((TiUIVideoView) view).seek(milliseconds);
		}
	}

	@Kroll.method
	public void release()
	{
		if (DBG) {
			Log.d(TAG, "release()");
		}

		if (view != null) {
			((TiUIVideoView) view).releaseVideoView();
		}
	}

	@Override
	public boolean handleMessage(Message msg)
	{
		if (msg.what >= MSG_PLAY && msg.what <= MSG_PAUSE) {
			control(msg.what);
			return true;
		}
		return super.handleMessage(msg);
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
}

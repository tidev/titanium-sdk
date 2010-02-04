package ti.modules.titanium.media;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.TiContext.OnLifecycleEvent;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;

import android.net.Uri;

public class SoundProxy extends TiProxy
	implements OnLifecycleEvent
{
	private static final String LCAT = "SoundProxy";
	private static final boolean DBG = TiConfig.LOGD;

	protected String url;
	protected TiSound snd;

	public SoundProxy(TiContext tiContext, Object[] args) {
		super(tiContext);

		url = (String) args[0];
		tiContext.addOnLifecycleEventListener(this);

		if (DBG) {
			Log.i(LCAT, "Creating sound proxy for url: " + url);
		}
	}

	public void play() {
		TiSound s = getSound();
		if (s != null) {
			s.play();
		}
	}

	public void pause() {
		TiSound s = getSound();
		if (s != null) {
			s.pause();
		}
	}

	public void reset() {
		TiSound s = getSound();
		if (s != null) {
			s.reset();
		}
	}

	public void release() {
		TiSound s = getSound();
		if (s != null) {
			s.release();
			snd = null;
		}
	}

	public void stop() {
		TiSound s = getSound();
		if (s != null) {
			s.stop();
		}
	}

	protected TiSound getSound() {
		if (snd == null) {
			snd = new TiSound(this, Uri.parse(url));
		}
		return snd;
	}

	public void onStart() {
	}

	public void onResume() {
		if (snd != null) {
			snd.onResume();
		}
	}

	public void onPause() {
		if (snd != null) {
			snd.onPause();
		}
	}

	public void onStop() {
	}

	public void onDestroy() {
		if (snd != null) {
			snd.onDestroy();
		}
		snd = null;
	}
}

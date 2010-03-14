/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.TiContext.OnLifecycleEvent;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;

import ti.modules.titanium.filesystem.FileProxy;
import android.net.Uri;

public class SoundProxy extends TiProxy
	implements OnLifecycleEvent
{
	private static final String LCAT = "SoundProxy";
	private static final boolean DBG = TiConfig.LOGD;

	protected String url;
	protected TiSound snd;

	public SoundProxy(TiContext tiContext, Object[] args)
	{
		super(tiContext);

		TiDict options = (TiDict) args[0];
		if (options != null) {
			if (options.containsKey("url")) {
				this.url = tiContext.resolveUrl(null, TiConvert.toString(options, "url"));
			} else if (options.containsKey("sound")) {
				FileProxy fp = (FileProxy) options.get("sound");
				if (fp != null) {
					url = fp.getNativePath();
				}
			}

			tiContext.addOnLifecycleEventListener(this);

			if (DBG) {
				Log.i(LCAT, "Creating sound proxy for url: " + url);
			}
		}
	}

	public boolean isPlaying() {
		TiSound s = getSound();
		if (s != null) {
			return s.isPlaying();
		}
		return false;
	}

	public boolean isPaused() {
		TiSound s = getSound();
		if (s != null) {
			return s.isPaused();
		}
		return false;
	}

	public boolean isLooping() {
		TiSound s = getSound();
		if (s != null) {
			return s.isLooping();
		}
		return false;
	}

	public boolean getLooping() {
		TiSound s = getSound();
		if (s != null) {
			return s.isLooping();
		}
		return false;
	}

	public void setLooping(boolean looping) {
		TiSound s = getSound();
		if (s != null) {
			s.setLooping(looping);
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

	protected TiSound getSound()
	{
		if (snd == null) {
			if (url != null) {
				snd = new TiSound(this, Uri.parse(url));
			}
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

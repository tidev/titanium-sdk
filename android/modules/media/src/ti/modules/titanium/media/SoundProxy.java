/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiContext.OnLifecycleEvent;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;

import ti.modules.titanium.filesystem.FileProxy;

@Kroll.proxy(creatableInModule=MediaModule.class)
public class SoundProxy extends KrollProxy
	implements OnLifecycleEvent
{
	private static final String LCAT = "SoundProxy";
	private static final boolean DBG = TiConfig.LOGD;

	protected TiSound snd;

	public SoundProxy(TiContext tiContext)
	{
		super(tiContext);
		tiContext.addOnLifecycleEventListener(this);
		setProperty("volume", 0.5, true);
	}
	
	@Override
	public void handleCreationDict(KrollDict options) {
		super.handleCreationDict(options);
		if (options.containsKey("url")) {
			setProperty("url", getTiContext().resolveUrl(null, TiConvert.toString(options, "url")));
		} else if (options.containsKey("sound")) {
			FileProxy fp = (FileProxy) options.get("sound");
			if (fp != null) {
				String url = fp.getNativePath();
				setProperty("url", url);
			}
		}
		if (options.containsKey("allowBackground")) {
			setProperty("allowBackground", options.get("allowBackground"));
		}
		if (DBG) {
			Log.i(LCAT, "Creating sound proxy for url: " + TiConvert.toString(getProperty("url")));
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

	// An alias for play so that sound can be used instead of an audioplayer
	public void start() {
		play();
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

	public void destroy() {
		release();
	}

	public void stop() {
		TiSound s = getSound();
		if (s != null) {
			s.stop();
		}
	}

	public int getDuration() {
		TiSound s = getSound();
		if (s != null) {
			return s.getDuration();
		}

		return 0;
	}

	public int getTime() {
		TiSound s = getSound();
		if (s != null) {
			return s.getTime();
		}
		return 0;
	}

	public void setTime(Object pos) {
		if (pos != null) {
			TiSound s = getSound();
			if (s != null) {
				s.setTime(TiConvert.toInt(pos));
			}
		}
	}
	protected TiSound getSound()
	{
		if (snd == null) {
			snd = new TiSound(this);
			setModelListener(snd);
		}
		return snd;
	}

	private boolean allowBackground() {
		boolean allow = false;
		if (hasProperty("allowBackground")) {
			allow = TiConvert.toBoolean(getProperty("allowBackground"));
		}
		return allow;
	}

	public void onStart() {
	}

	public void onResume() {
		if (!allowBackground()) {
			if (snd != null) {
				snd.onResume();
			}
		}
	}

	public void onPause() {
		if (!allowBackground()) {
			if (snd != null) {
				snd.onPause();
			}
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

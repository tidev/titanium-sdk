/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiContext.OnLifecycleEvent;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;

import ti.modules.titanium.filesystem.FileProxy;

public class AudioPlayerProxy extends KrollProxy
	implements OnLifecycleEvent
{
	private static final String LCAT = "AudioPlayerProxy";
	private static final boolean DBG = TiConfig.LOGD;

	protected static KrollDict constants;

	protected TiSound snd;

	public AudioPlayerProxy(TiContext tiContext, Object[] args)
	{
		super(tiContext);

		if (args != null && args.length > 0) {
			KrollDict options = (KrollDict) args[0];
			if (options != null) {
				if (options.containsKey("url")) {
					internalSetDynamicValue("url", tiContext.resolveUrl(null, TiConvert.toString(options, "url")), false);
				} else if (options.containsKey("sound")) {
					FileProxy fp = (FileProxy) options.get("sound");
					if (fp != null) {
						String url = fp.getNativePath();
						internalSetDynamicValue("url", url, false);
					}
				}
				if (options.containsKey("allowBackground")) {
					internalSetDynamicValue("allowBackground", options.get("allowBackground"), false);
				}
				if (DBG) {
					Log.i(LCAT, "Creating audio player proxy for url: " + TiConvert.toString(getDynamicValue("url")));
				}
			}
		}
		tiContext.addOnLifecycleEventListener(this);
		setDynamicValue("volume", 0.5);
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

	// An alias for play so that
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
		if (hasDynamicValue("allowBackground")) {
			allow = TiConvert.toBoolean(getDynamicValue("allowBackground"));
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

	@Override
	public KrollDict getConstants()
	{
		if (constants == null) {
			constants = new KrollDict();
			constants.put("STATE_BUFFERING",TiSound.STATE_BUFFERING);
			constants.put("STATE_INITIALIZED", TiSound.STATE_INITIALIZED);
			constants.put("STATE_PAUSED", TiSound.STATE_PAUSED);
			constants.put("STATE_PLAYING", TiSound.STATE_PLAYING);
			constants.put("STATE_STARTING", TiSound.STATE_STARTING);
			constants.put("STATE_STOPPED", TiSound.STATE_STOPPED);
			constants.put("STATE_STOPPING", TiSound.STATE_STOPPING);
			constants.put("STATE_WAITING_FOR_DATA", TiSound.STATE_WAITING_FOR_DATA);
			constants.put("STATE_WAITING_FOR_QUEUE", TiSound.STATE_WAITING_FOR_QUEUE);
		}

		return constants;
	}
}

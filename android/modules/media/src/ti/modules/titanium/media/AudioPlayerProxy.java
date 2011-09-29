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
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiLifecycle.OnLifecycleEvent;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;

import ti.modules.titanium.filesystem.FileProxy;
import android.app.Activity;

@Kroll.proxy(creatableInModule=MediaModule.class)
public class AudioPlayerProxy extends KrollProxy
	implements OnLifecycleEvent
{
	private static final String LCAT = "AudioPlayerProxy";
	private static final boolean DBG = TiConfig.LOGD;

	@Kroll.constant public static final int STATE_BUFFERING = TiSound.STATE_BUFFERING;
	@Kroll.constant public static final int STATE_INITIALIZED = TiSound.STATE_INITIALIZED;
	@Kroll.constant public static final int STATE_PAUSED = TiSound.STATE_PAUSED;
	@Kroll.constant public static final int STATE_PLAYING = TiSound.STATE_PLAYING;
	@Kroll.constant public static final int STATE_STARTING = TiSound.STATE_STARTING;
	@Kroll.constant public static final int STATE_STOPPED = TiSound.STATE_STOPPED;
	@Kroll.constant public static final int STATE_STOPPING = TiSound.STATE_STOPPING;
	@Kroll.constant public static final int STATE_WAITING_FOR_DATA = TiSound.STATE_WAITING_FOR_DATA;
	@Kroll.constant public static final int STATE_WAITING_FOR_QUEUE = TiSound.STATE_WAITING_FOR_QUEUE;
	
	protected TiSound snd;

	public AudioPlayerProxy()
	{
		// TODO this needs to happen post-set
		((TiBaseActivity)getActivity()).addOnLifecycleEventListener(this);
		setProperty("volume", 0.5, true);
	}

	@Override
	public void handleCreationDict(KrollDict options) {
		super.handleCreationDict(options);
		if (options.containsKey(TiC.PROPERTY_URL)) {
			setProperty(TiC.PROPERTY_URL, resolveUrl(null, TiConvert.toString(options, TiC.PROPERTY_URL)));
		} else if (options.containsKey(TiC.PROPERTY_SOUND)) {
			FileProxy fp = (FileProxy) options.get(TiC.PROPERTY_SOUND);
			if (fp != null) {
				String url = fp.getNativePath();
				setProperty(TiC.PROPERTY_URL, url);
			}
		}
		if (options.containsKey(TiC.PROPERTY_ALLOW_BACKGROUND)) {
			setProperty(TiC.PROPERTY_ALLOW_BACKGROUND, options.get(TiC.PROPERTY_ALLOW_BACKGROUND));
		}
		if (DBG) {
			Log.i(LCAT, "Creating audio player proxy for url: " + TiConvert.toString(getProperty("url")));
		}
	}
	
	
	@Kroll.getProperty
	public String getUrl() {
		return TiConvert.toString(getProperty(TiC.PROPERTY_URL));
	}
	
	@Kroll.setProperty @Kroll.method
	public void setUrl(String url) {
		if (url != null) {
			setProperty(TiC.PROPERTY_URL, resolveUrl(null, TiConvert.toString(url)));
		}
	}

	@Kroll.getProperty @Kroll.method
	public boolean isPlaying() {
		TiSound s = getSound();
		if (s != null) {
			return s.isPlaying();
		}
		return false;
	}

	@Kroll.getProperty @Kroll.method
	public boolean isPaused() {
		TiSound s = getSound();
		if (s != null) {
			return s.isPaused();
		}
		return false;
	}

	// An alias for play so that
	@Kroll.method
	public void start() {
		play();
	}

	@Kroll.method
	public void play() {
		TiSound s = getSound();
		if (s != null) {
			s.play();
		}
	}

	@Kroll.method
	public void pause() {
		TiSound s = getSound();
		if (s != null) {
			s.pause();
		}
	}

	@Kroll.method
	public void release() {
		TiSound s = getSound();
		if (s != null) {
			s.release();
			snd = null;
		}
	}

	@Kroll.method
	public void destroy() {
		release();
	}

	@Kroll.method
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
		if (hasProperty(TiC.PROPERTY_ALLOW_BACKGROUND)) {
			allow = TiConvert.toBoolean(getProperty(TiC.PROPERTY_ALLOW_BACKGROUND));
		}
		return allow;
	}

	public void onStart(Activity activity) {
	}

	public void onResume(Activity activity) {
		if (!allowBackground()) {
			if (snd != null) {
				snd.onResume();
			}
		}
	}

	public void onPause(Activity activity) {
		if (!allowBackground()) {
			if (snd != null) {
				snd.onPause();
			}
		}
	}

	public void onStop(Activity activity) {
	}

	public void onDestroy(Activity activity) {
		if (snd != null) {
			snd.onDestroy();
		}
		snd = null;
	}
}

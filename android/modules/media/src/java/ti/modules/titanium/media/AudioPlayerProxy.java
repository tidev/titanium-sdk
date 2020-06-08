/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiLifecycle.OnLifecycleEvent;
import org.appcelerator.titanium.TiLifecycle.OnWindowFocusChangedEvent;
import org.appcelerator.titanium.util.TiConvert;

import ti.modules.titanium.filesystem.FileProxy;
import android.app.Activity;

@Kroll.proxy(creatableInModule = MediaModule.class, propertyAccessors = { TiC.PROPERTY_VOLUME })
public class AudioPlayerProxy extends KrollProxy implements OnLifecycleEvent, OnWindowFocusChangedEvent
{
	private static final String TAG = "AudioPlayerProxy";

	@Kroll.constant
	public static final int STATE_BUFFERING = TiSound.STATE_BUFFERING;
	@Kroll.constant
	public static final int STATE_INITIALIZED = TiSound.STATE_INITIALIZED;
	@Kroll.constant
	public static final int STATE_PAUSED = TiSound.STATE_PAUSED;
	@Kroll.constant
	public static final int STATE_PLAYING = TiSound.STATE_PLAYING;
	@Kroll.constant
	public static final int STATE_STARTING = TiSound.STATE_STARTING;
	@Kroll.constant
	public static final int STATE_STOPPED = TiSound.STATE_STOPPED;
	@Kroll.constant
	public static final int STATE_STOPPING = TiSound.STATE_STOPPING;
	@Kroll.constant
	public static final int STATE_WAITING_FOR_DATA = TiSound.STATE_WAITING_FOR_DATA;
	@Kroll.constant
	public static final int STATE_WAITING_FOR_QUEUE = TiSound.STATE_WAITING_FOR_QUEUE;

	@Kroll.constant
	public static final int AUDIO_TYPE_MEDIA = TiSound.AUDIO_TYPE_MEDIA;
	@Kroll.constant
	public static final int AUDIO_TYPE_ALARM = TiSound.AUDIO_TYPE_ALARM;
	@Kroll.constant
	public static final int AUDIO_TYPE_SIGNALLING = TiSound.AUDIO_TYPE_SIGNALLING;
	@Kroll.constant
	public static final int AUDIO_TYPE_RING = TiSound.AUDIO_TYPE_RING;
	@Kroll.constant
	public static final int AUDIO_TYPE_VOICE = TiSound.AUDIO_TYPE_VOICE;
	@Kroll.constant
	public static final int AUDIO_TYPE_NOTIFICATION = TiSound.AUDIO_TYPE_NOTIFICATION;

	protected TiSound snd;
	private boolean windowFocused;
	private boolean resumeInOnWindowFocusChanged;

	public AudioPlayerProxy()
	{
		super();

		// TODO - we shouldnt need this as this proxy is created only from the runtime - double check
		// TODO this needs to happen post-set
		//((TiBaseActivity)getActivity()).addOnLifecycleEventListener(this);

		defaultValues.put(TiC.PROPERTY_VOLUME, 1.0f);
		defaultValues.put(TiC.PROPERTY_TIME, 0);
		defaultValues.put(TiC.PROPERTY_AUDIO_TYPE, AUDIO_TYPE_MEDIA);
	}

	@Override
	protected void initActivity(Activity activity)
	{
		super.initActivity(activity);
		((TiBaseActivity) getActivity()).addOnLifecycleEventListener(this);
		((TiBaseActivity) getActivity()).addOnWindowFocusChangedEventListener(this);
	}

	@Override
	public void handleCreationDict(KrollDict options)
	{
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
		if (options.containsKey(TiC.PROPERTY_AUDIO_FOCUS)) {
			boolean audioFocus = TiConvert.toBoolean(options.get(TiC.PROPERTY_AUDIO_FOCUS));
			setProperty(TiC.PROPERTY_AUDIO_FOCUS, audioFocus);
			TiSound.audioFocus = audioFocus;
		}
		Log.i(TAG, "Creating audio player proxy for url: " + TiConvert.toString(getProperty(TiC.PROPERTY_URL)),
			  Log.DEBUG_MODE);
	}

	@Kroll.method
	@Kroll.getProperty
	public String getUrl()
	{
		return TiConvert.toString(getProperty(TiC.PROPERTY_URL));
	}

	@Kroll.method
	@Kroll.setProperty
	public void setUrl(String url)
	{
		if (url != null) {
			setProperty(TiC.PROPERTY_URL, resolveUrl(null, TiConvert.toString(url)));
		}
	}

	@Kroll.method
	@Kroll.getProperty
	public int getDuration()
	{
		TiSound s = getSound();
		if (s != null) {
			return s.getDuration();
		}
		return 0;
	}

	@Kroll.method
	@Kroll.getProperty
	public int getAudioType()
	{
		return TiConvert.toInt(getProperty(TiC.PROPERTY_AUDIO_TYPE));
	}

	@Kroll.method
	@Kroll.setProperty
	public void setAudioType(int val)
	{
		setProperty(TiC.PROPERTY_AUDIO_TYPE, val);
	}

	@Kroll.method
	@Kroll.getProperty
	public boolean isPlaying()
	{
		TiSound s = getSound();
		if (s != null) {
			return s.isPlaying();
		}
		return false;
	}

	@Kroll.method
	@Kroll.getProperty
	public boolean isPaused()
	{
		TiSound s = getSound();
		if (s != null) {
			return s.isPaused();
		}
		return false;
	}

	@Kroll.method
	public void start()
	{
		TiSound s = getSound();
		if (s != null) {
			s.play();
		}
	}

	@Kroll.method
	public void restart()
	{
		stop();
		start();
	}

	@Kroll.method
	public void play()
	{
		Log.w(TAG,
			"The play() method has been deprecated in favor of the cross-platform start() method in Titanium 7.4.0.");
		start();
	}

	@Kroll.method
	public void pause()
	{
		TiSound s = getSound();
		if (s != null) {
			s.pause();
		}
	}

	@Kroll.method
	public void release()
	{
		TiSound s = getSound();
		if (s != null) {
			s.reset();
			s.release();
			snd = null;
		}
	}

	@Kroll.method
	public void destroy()
	{
		release();
	}

	@Kroll.method
	public void stop()
	{
		TiSound s = getSound();
		if (s != null) {
			s.stop();
		}
	}

	@Kroll.method
	public int getAudioSessionId()
	{
		TiSound s = getSound();
		if (s != null) {
			return s.getAudioSessionId();
		}
		return 0;
	}

	@Kroll.method
	@Kroll.getProperty
	public boolean getMuted()
	{
		TiSound s = getSound();
		if (s != null) {
			return s.isMuted();
		}
		return false;
	}

	@Kroll.method
	@Kroll.setProperty
	public void setMuted(boolean muted)
	{
		TiSound s = getSound();
		if (s != null) {
			s.setMuted(muted);
		}
	}

	@Kroll.method
	@Kroll.getProperty
	public double getTime()
	{
		TiSound s = getSound();
		if (s != null) {
			int time = s.getTime();
			setProperty(TiC.PROPERTY_TIME, time);
		}
		return TiConvert.toDouble(getProperty(TiC.PROPERTY_TIME));
	}

	@Kroll.method
	@Kroll.setProperty
	public void setTime(Object pos)
	{
		if (pos != null) {
			TiSound s = getSound();
			if (s != null) {
				s.setTime(TiConvert.toInt(pos));
			} else {
				setProperty(TiC.PROPERTY_TIME, TiConvert.toDouble(pos));
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

	private boolean allowBackground()
	{
		boolean allow = false;
		if (hasProperty(TiC.PROPERTY_ALLOW_BACKGROUND)) {
			allow = TiConvert.toBoolean(getProperty(TiC.PROPERTY_ALLOW_BACKGROUND));
		}
		return allow;
	}

	public void onStart(Activity activity)
	{
	}

	public void onResume(Activity activity)
	{
		if (windowFocused && !allowBackground()) {
			if (snd != null) {
				snd.onResume();
			}
		} else {
			resumeInOnWindowFocusChanged = true;
		}
	}

	public void onPause(Activity activity)
	{
		if (!allowBackground()) {
			if (snd != null) {
				snd.onPause();
			}
		}
	}

	public void onStop(Activity activity)
	{
	}

	public void onDestroy(Activity activity)
	{
		if (snd != null) {
			snd.onDestroy();
		}
		snd = null;
	}

	public void onWindowFocusChanged(boolean hasFocus)
	{
		windowFocused = hasFocus;
		if (resumeInOnWindowFocusChanged && !allowBackground()) {
			if (snd != null) {
				snd.onResume();
			}
			resumeInOnWindowFocusChanged = false;
		}
	}

	@Override
	public String getApiName()
	{
		return "Ti.Media.AudioPlayer";
	}
}

/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiConvert;

import ti.modules.titanium.filesystem.FileProxy;
import android.app.Activity;

@Kroll.proxy(creatableInModule=MediaModule.class, propertyAccessors = {
	TiC.PROPERTY_VOLUME
})
public class SoundProxy extends KrollProxy
	implements org.appcelerator.titanium.TiLifecycle.OnLifecycleEvent, org.appcelerator.titanium.TiLifecycle.OnWindowFocusChangedEvent
{
	private static final String TAG = "SoundProxy";

	protected TiSound snd;

	public SoundProxy()
	{
		super();

		// TODO - we shouldnt need this as this proxy is created only from the runtime - double check
		// TODO needs to happen post-activity assignment
		//((TiBaseActivity)getActivity()).addOnLifecycleEventListener(this);
		
		defaultValues.put(TiC.PROPERTY_VOLUME, 1.0f);
		defaultValues.put(TiC.PROPERTY_TIME, 0d);
	}

	public SoundProxy(TiContext tiContext)
	{
		this();
	}

	@Override
	protected void initActivity(Activity activity) {
		super.initActivity(activity);
		((TiBaseActivity) activity).addOnLifecycleEventListener(this);
		((TiBaseActivity) activity).addOnWindowFocusChangedEventListener(this);
	}

	private String parseURL(Object url)
	{
		String path = null;
		if (url instanceof FileProxy) {
			path = ((FileProxy) url).getNativePath();
		} else if (url instanceof String) {
			path = resolveUrl(null, (String) url);
		} else if (url instanceof TiBlob) {
			TiBlob blob = (TiBlob) url;
			if (blob.getType() == TiBlob.TYPE_FILE) {
				path = blob.getFile().getNativePath();
			}
		} else {
			Log.e(TAG, "Invalid type for url.");
		}
		return path;
	}

	@Override
	public void handleCreationDict(KrollDict options)
	{
		super.handleCreationDict(options);
		if (options.containsKey(TiC.PROPERTY_URL)) {
			Object url = options.get(TiC.PROPERTY_URL);
			String path = parseURL(url);
			if (path != null) {
				setProperty(TiC.PROPERTY_URL, path);
			}
		}
		if (options.containsKey(TiC.PROPERTY_ALLOW_BACKGROUND)) {
			setProperty(TiC.PROPERTY_ALLOW_BACKGROUND, options.get(TiC.PROPERTY_ALLOW_BACKGROUND));
		}
		Log.i(TAG, "Creating sound proxy for url: " + TiConvert.toString(getProperty(TiC.PROPERTY_URL)), Log.DEBUG_MODE);
	}
	
	@Kroll.getProperty
	public String getUrl() {
		return TiConvert.toString(getProperty(TiC.PROPERTY_URL));
	}

	@Kroll.setProperty
	public void setUrl(Object url) {
		String path = parseURL(url);
		if (path != null) {
			setProperty(TiC.PROPERTY_URL, path);
		}
	}

	@Kroll.method @Kroll.getProperty
	public boolean isPlaying() {
		TiSound s = getSound();
		if (s != null) {
			return s.isPlaying();
		}
		return false;
	}

	@Kroll.method @Kroll.getProperty
	public boolean isPaused() {
		TiSound s = getSound();
		if (s != null) {
			return s.isPaused();
		}
		return false;
	}

	@Kroll.method @Kroll.getProperty
	public boolean isLooping() {
		TiSound s = getSound();
		if (s != null) {
			return s.isLooping();
		}
		return false;
	}
	
	@Kroll.method @Kroll.setProperty
	public void setLooping(boolean looping) {
		TiSound s = getSound();
		if (s != null) {
			s.setLooping(looping);
		}
	}

	@Kroll.method
	// An alias for play so that sound can be used instead of an audioplayer
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
	public void reset() {
		TiSound s = getSound();
		if (s != null) {
			s.reset();
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

	@Kroll.method @Kroll.getProperty
	public int getDuration() {
		TiSound s = getSound();
		if (s != null) {
			return s.getDuration();
		}

		return 0;
	}

	@Kroll.method @Kroll.getProperty
	public double getTime() {
		TiSound s = getSound();
		if (s != null) {
			int time = s.getTime();
			setProperty(TiC.PROPERTY_TIME, time);
		} 
		return TiConvert.toDouble(getProperty(TiC.PROPERTY_TIME));
	}

	@Kroll.method @Kroll.setProperty
	public void setTime(Object pos) {
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

	public void onWindowFocusChanged(boolean hasFocus)
	{
		if (hasFocus && !allowBackground()) {
			if (snd != null) {
				snd.onResume();
			}
		}
	}

}

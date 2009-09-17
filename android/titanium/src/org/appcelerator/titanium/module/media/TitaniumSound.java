/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module.media;

import java.io.IOException;
import java.lang.ref.SoftReference;

import org.appcelerator.titanium.api.ITitaniumLifecycle;
import org.appcelerator.titanium.api.ITitaniumSound;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.TitaniumMedia;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumJSEventManager;

import android.content.Context;
import android.content.res.AssetFileDescriptor;
import android.media.MediaPlayer;
import android.net.Uri;
import android.webkit.URLUtil;
import android.webkit.WebView;

public class TitaniumSound
	implements ITitaniumSound, MediaPlayer.OnCompletionListener, MediaPlayer.OnErrorListener, ITitaniumLifecycle
{
	private static final String LCAT = "TiSnd";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private static final String ASSET_URL = "file:///android_asset/"; // class scope on URLUtil
	public static final String EVENT_COMPLETE = "complete";
	public static final String EVENT_ERROR = "error";
	public static final String EVENT_COMPLETE_JSON = "{ type : '" + EVENT_COMPLETE + "' }";

	private static final float VOLUME_SCALING_FACTOR = 3.0f;

	private boolean paused = false;
	private boolean looping = false;

	protected MediaPlayer mp;
	protected TitaniumJSEventManager eventListeners;
	protected SoftReference<TitaniumMedia> softMediaModule;
	protected String url;
	protected float volume;
	protected boolean playOnResume;

	public TitaniumSound(TitaniumMedia mediaModule, Uri uri )
	{
		if (DBG) {
			Log.d(LCAT, "Creating sound from " + uri.toString());
		}

		this.softMediaModule = new SoftReference<TitaniumMedia>(mediaModule);
		this.url = uri.toString();
		this.volume = 0.5f;
		this.playOnResume = false;

		this.eventListeners = new TitaniumJSEventManager(mediaModule);
		this.eventListeners.supportEvent(EVENT_COMPLETE);
		this.eventListeners.supportEvent(EVENT_ERROR);
	}

	protected void initialize()
		throws IOException
	{
		try {
			TitaniumMedia mediaModule = softMediaModule.get();
			if (mediaModule != null) {
				WebView webView = mediaModule.getWebView();
				if (webView != null) {
					mp = new MediaPlayer();
					if (URLUtil.isAssetUrl(url)) {
						Context context = webView.getContext();
						String path = url.substring(ASSET_URL.length());
						AssetFileDescriptor afd = null;
						try {
							afd = context.getAssets().openFd(path);
							// Why mp.setDataSource(afd) doesn't work is a problem for another day.
							// http://groups.google.com/group/android-developers/browse_thread/thread/225c4c150be92416
							mp.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
						} catch (IOException e) {
							Log.e(LCAT, "Error setting file descriptor: ", e);
						} finally {
							if (afd != null) {
								afd.close();
							}
						}
					} else {
						Uri uri = Uri.parse(url);
						if (uri.getScheme().equals("file")) {
							mp.setDataSource(uri.getPath());
						} else {
							mp.setDataSource(url);
						}
					}
					mp.prepare();
					mp.setVolume(volume, volume);
					mp.setLooping(looping);
					mp.setOnCompletionListener(this);
					mp.setOnErrorListener(this);
				}
			}
		} catch (Throwable t) {
			Log.w(LCAT, "Issue while initializing : " , t);
		}
	}

	public float getVolume()
	{
		return volume;
	}

	public boolean isLooping() {
		return looping;
	}

	public boolean isPaused() {
		return paused;
	}

	public boolean isPlaying() {
		boolean result = false;
		if (mp != null) {
			result = mp.isPlaying();
		}
		return result;
	}

	public void pause() {
		try {
			if (mp != null) {
				if(mp.isPlaying()) {
					if (DBG) {
						Log.d(LCAT,"audio is playing, pause");
					}
					mp.pause();
					paused = true;
				}
			}
		} catch (Throwable t) {
			Log.w(LCAT, "Issue while pausing : " , t);
		}
	}

	public void play() {
		try {
			if (mp == null) {
				try {
					initialize();
					TitaniumMedia mediaModule = softMediaModule.get();
					if (mediaModule != null) {
						mediaModule.addLifecycleListener(this);
					}
				} catch (IOException e) {
					Log.e(LCAT, "Error during initialization.",e);
					if (mp != null) {
						mp.release();
						mp = null;
					}
				}
			}

			if (mp != null) {
				if(!isPlaying()) {
					if (DBG) {
						Log.d(LCAT,"audio is not playing, starting.");
					}
					mp.setVolume(volume, volume);
					if (DBG) {
						Log.d(LCAT, "Play: Volume set to " + volume);
					}
					mp.start();
					paused = false;
				}
			}
		} catch (Throwable t) {
			Log.w(LCAT, "Issue while playing : " , t);
		}
	}

	public void reset() {
		try {
			if (mp != null) {
				mp.seekTo(0);
				looping = false;
				paused = false;
			}
		} catch (Throwable t) {
			Log.w(LCAT, "Issue while resetting : " , t);
		}
	}

	public void release()
	{
		try {
			if (mp != null) {

				TitaniumMedia mediaModule = softMediaModule.get();
				if (mediaModule != null) {
					mediaModule.removeLifecyleListener(this);
				}

				mp.setOnCompletionListener(null);
				mp.setOnErrorListener(null);
				mp.release();
				mp = null;
				if (DBG) {
					Log.d(LCAT, "Native resources released.");
				}
			}
		} catch (Throwable t) {
			Log.w(LCAT, "Issue while releasing : " , t);
		}
	}

	public void setLooping(boolean loop) {
		try {
			if(loop != looping) {
				if (mp != null) {
					mp.setLooping(loop);
				}
				looping = loop;
			}
		} catch (Throwable t) {
			Log.w(LCAT, "Issue while configuring looping : " , t);
		}
	}

	public void setVolume(float volume)
	{
		try {
			if (volume < 0.0f) {
				this.volume = 0.0f;
				Log.w(LCAT, "Attempt to set volume less than 0.0. Volume set to 0.0");
			} else if (volume > 1.0) {
				this.volume = 1.0f;
				Log.w(LCAT, "Attempt to set volume greater than 1.0. Volume set to 1.0");
			} else {
				this.volume = volume; // Store in 0.0 to 1.0, scale when setting hw
			}
			if (mp != null) {
				float scaledVolume = this.volume * VOLUME_SCALING_FACTOR;
				mp.setVolume(scaledVolume, scaledVolume);
			}
		} catch (Throwable t) {
			Log.w(LCAT, "Issue while setting volume : " , t);
		}
	}

	public void stop() {
		try {
			if (mp != null) {

				if (mp.isPlaying() || isPaused()) {
					if (DBG) {
						Log.d(LCAT, "audio is playing, stop()");
					}
					mp.stop();
					try {
						mp.prepare();
					} catch (IOException e) {
						Log.e(LCAT,"Error while preparing audio after stop(). Ignoring.");
					} catch (IllegalStateException e) {
						Log.w(LCAT, "Error while preparing audio after stop(). Ignoring.");
					}
				}

				if(isPaused()) {
					paused = false;
				}
			}
		} catch (Throwable t) {
			Log.e(LCAT, "Error : " , t);
		}
	}

	public int addEventListener(String eventName, String listener) {
		return eventListeners.addListener(eventName, listener);
	}

	public void removeEventListener(String eventName, int listenerId) {
		eventListeners.removeListener(eventName, listenerId);
	}

	public void onCompletion(MediaPlayer mp) {
		eventListeners.invokeSuccessListeners(EVENT_COMPLETE, EVENT_COMPLETE_JSON);
		stop();
	}

	public boolean onError(MediaPlayer mp, int what, int extra)
	{
		int code = 0;
		String msg = "Unknown media error.";
		if (what == MediaPlayer.MEDIA_ERROR_SERVER_DIED) {
			msg = "Media server died";
		}
		release();

		eventListeners.invokeSuccessListeners(EVENT_ERROR, " { 'code' : " + code + ", 'message' : '" + msg + "' }");

		return true;
	}

	public void onDestroy()
	{
		if (mp != null) {
			mp.release();
			mp = null;
		}
		// TitaniumMedia clears out the references after onDestroy.
	}

	public void onPause() {
		if (mp != null) {
			if (isPlaying()) {
				pause();
				playOnResume = true;
			}
		}
	}

	public void onResume() {
		if (mp != null) {
			if (playOnResume) {
				play();
				playOnResume = false;
			}
		}
	}
}

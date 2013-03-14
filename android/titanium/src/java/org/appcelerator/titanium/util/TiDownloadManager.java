/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.io.InputStream;
import java.lang.ref.SoftReference;
import java.net.URI;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.apache.commons.codec.digest.DigestUtils;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.util.KrollStreamHelper;

import android.os.Handler;
import android.os.Message;

/**
 * Manages the asynchronous opening of InputStreams from URIs so that
 * the resources get put into our TiResponseCache.
 */
public class TiDownloadManager implements Handler.Callback
{
	private static final String TAG = "TiDownloadManager";
	private static final int MSG_FIRE_DOWNLOAD_FINISHED = 1000;
	private static final int MSG_FIRE_DOWNLOAD_FAILED = 1001;
	protected static TiDownloadManager _instance;
	public static final int THREAD_POOL_SIZE = 2;

	protected HashMap<String, ArrayList<SoftReference<TiDownloadListener>>> listeners = new HashMap<String, ArrayList<SoftReference<TiDownloadListener>>>();
	protected ArrayList<String> downloadingURIs = new ArrayList<String>();
	protected ExecutorService threadPool;
	protected Handler handler;

	public static TiDownloadManager getInstance()
	{
		if (_instance == null) {
			_instance = new TiDownloadManager();
		}
		return _instance;
	}

	protected TiDownloadManager()
	{
		handler = new Handler(this);
		threadPool = Executors.newFixedThreadPool(THREAD_POOL_SIZE);
	}

	public void download(URI uri, TiDownloadListener listener)
	{
		if (TiResponseCache.peek(uri)) {
			sendMessage(uri, MSG_FIRE_DOWNLOAD_FINISHED);
		} else {
			startDownload(uri, listener);
		}
	}

	private void sendMessage(URI uri, int what)
	{
		Message msg = handler.obtainMessage(what);
		msg.obj = uri;
		msg.sendToTarget();
	}

	protected void startDownload(URI uri, TiDownloadListener listener)
	{
		String hash = DigestUtils.shaHex(uri.toString());
		ArrayList<SoftReference<TiDownloadListener>> listenerList = null;
		synchronized (listeners) {
			if (!listeners.containsKey(hash)) {
				listenerList = new ArrayList<SoftReference<TiDownloadListener>>();
				listeners.put(hash, listenerList);
			} else {
				listenerList = listeners.get(hash);
			}
			// We only allow a listener once per URI
			for (SoftReference<TiDownloadListener> l : listenerList) {
				if (l.get() == listener) {
					return;
				}
			}
			listenerList.add(new SoftReference<TiDownloadListener>(listener));
		}
		synchronized (downloadingURIs) {
			if (!downloadingURIs.contains(hash)) {
				downloadingURIs.add(hash);
				threadPool.execute(new DownloadJob(uri));
			}
		}
	}

	protected void handleFireDownloadMessage(URI uri, int what)
	{
		ArrayList<SoftReference<TiDownloadListener>> toRemove = new ArrayList<SoftReference<TiDownloadListener>>();
		synchronized (listeners) {
			String hash = DigestUtils.shaHex(uri.toString());
			ArrayList<SoftReference<TiDownloadListener>> listenerList = listeners.get(hash);
			for (SoftReference<TiDownloadListener> listener : listenerList) {
				TiDownloadListener downloadListener = listener.get();
				if (downloadListener != null) {
					if (what == MSG_FIRE_DOWNLOAD_FINISHED) {
						downloadListener.downloadTaskFinished(uri);
					} else {
						downloadListener.downloadTaskFailed(uri);
					}
					toRemove.add(listener);
				}
			}
			for (SoftReference<TiDownloadListener> listener : toRemove) {
				listenerList.remove(listener);
			}
		}
	}

	protected class DownloadJob implements Runnable
	{
		protected URI uri;

		public DownloadJob(URI uri)
		{
			this.uri = uri;
		}

		public void run()
		{
			try {
				// all we want to do is instigate putting this into the cache, and this
				// is enough for that:
				InputStream stream = uri.toURL().openStream();
				KrollStreamHelper.pump(stream, null);
				stream.close();

				synchronized (downloadingURIs) {
					downloadingURIs.remove(DigestUtils.shaHex(uri.toString()));
				}

				// If there is additional background task, run it here.
				String hash = DigestUtils.shaHex(uri.toString());
				ArrayList<SoftReference<TiDownloadListener>> listenerList;
				synchronized (listeners) {
					listenerList = listeners.get(hash);
				}
				for (SoftReference<TiDownloadListener> listener : listenerList) {
					if (listener.get() != null) {
						listener.get().postDownload(uri);
					}
				}

				sendMessage(uri, MSG_FIRE_DOWNLOAD_FINISHED);
			} catch (Exception e) {
				// fire a download fail event if we are unable to download
				sendMessage(uri, MSG_FIRE_DOWNLOAD_FAILED);
				Log.e(TAG, "Exception downloading " + uri, e);
			}
		}
	}

	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_FIRE_DOWNLOAD_FINISHED:
			case MSG_FIRE_DOWNLOAD_FAILED:
				handleFireDownloadMessage((URI) msg.obj, msg.what);
				return true;
		}
		return false;
	}
}

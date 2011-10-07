/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
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
	protected static TiDownloadManager _instance;
	public static final int THREAD_POOL_SIZE = 2; 

	protected HashMap<String, ArrayList<SoftReference<TiDownloadListener>>> listeners =
		new HashMap<String, ArrayList<SoftReference<TiDownloadListener>>>();
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
			fireDownloadFinished(uri);
		} else {
			startDownload(uri, listener);
		}
	}

	protected void fireDownloadFinished(URI uri)
	{
		Message msg = handler.obtainMessage(MSG_FIRE_DOWNLOAD_FINISHED);
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

	protected void handleFireDownloadFinished(URI uri)
	{
		ArrayList<SoftReference<TiDownloadListener>> toRemove = new ArrayList<SoftReference<TiDownloadListener>>();
		synchronized (listeners) {
			String hash = DigestUtils.shaHex(uri.toString());
			for (SoftReference<TiDownloadListener> listener : listeners.get(hash)) {
				if (listener.get() != null) {
					fireDownloadFinished(uri, listener.get());
					toRemove.add(listener);
				}
			}
			for (SoftReference<TiDownloadListener> listener : toRemove) {
				listeners.get(hash).remove(listener);
			}
		}
	}

	protected void fireDownloadFinished(URI uri, TiDownloadListener listener)
	{
		if (listener != null) {
			listener.downloadFinished(uri);
		}
	}

	protected class DownloadJob implements Runnable
	{
		protected URI uri;
		public DownloadJob(URI uri)
		{
			this.uri = uri;
		}
		
		// TODO // TODO @Override
		public void run()
		{
			try {
				// all we want to do is instigate putting this into the cache, and this 
				// is enough for that:
				InputStream stream = uri.toURL().openStream();
				TiStreamHelper.pump(stream, null);
				stream.close();
				synchronized (downloadingURIs) {
					downloadingURIs.remove(DigestUtils.shaHex(uri.toString()));
				}
				fireDownloadFinished(uri);
			} catch (Exception e) {
				Log.e(TAG, "Exception downloading " + uri, e);
			}
		}
	}

	// TODO @Override
	public boolean handleMessage(Message msg) {
		switch (msg.what) {
			case MSG_FIRE_DOWNLOAD_FINISHED:
				handleFireDownloadFinished((URI)msg.obj);
				return true;
		}
		return false;
	}
}

/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.io.IOException;
import java.io.InputStream;
import java.lang.ref.SoftReference;
import java.lang.reflect.Constructor;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.net.URLConnection;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.util.KrollStreamHelper;
import org.appcelerator.titanium.io.TiInputStreamWrapper;
import org.appcelerator.titanium.TiApplication;

import android.os.Handler;
import android.os.Looper;
import android.os.Message;

import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLSocketFactory;

/**
 * Manages the asynchronous opening of InputStreams from URIs so that
 * the resources get put into our TiResponseCache.
 */
public class TiDownloadManager implements Handler.Callback
{
	private static final String TAG = "TiDownloadManager";
	private static final int MSG_FIRE_DOWNLOAD_FINISHED = 1000;
	private static final int MSG_FIRE_DOWNLOAD_FAILED = 1001;
	private static final int TIMEOUT_IN_MILLISECONDS = 10000;
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
		handler = new Handler(Looper.getMainLooper(), this);
		threadPool = Executors.newFixedThreadPool(THREAD_POOL_SIZE);
	}

	/**
	 * Downloads the content from URI asynchronously and provides the result via the given listener.
	 * @param uri The URI to download the file/content from.
	 * @param listener The listener to be invoked with the result of the download operation.
	 */
	public void download(URI uri, TiDownloadListener listener)
	{
		if (TiResponseCache.peekFollowingRedirects(uri)) {
			sendMessage(uri, MSG_FIRE_DOWNLOAD_FINISHED);
		} else {
			startDownload(uri, listener);
		}
	}

	/**
	 * Blocks the calling thread while download the file/content from the given URI.
	 * <p>
	 * Can be called on the main UI thread, but it is not recommended. The async download() method is preferred.
	 * @param uri The URI to download the file/content from.
	 * @return
	 * Returns a stream to the file/content being downloaded.
	 * <p>
	 * Returns null if failed to download content or if given an invalid argument.
	 */
	public InputStream blockingDownload(final URI uri) throws Exception
	{
		// Validate.
		if (uri == null) {
			return null;
		}

		// First, check if the URI to the content/file has already been cached.
		// Note: This is an optimization and avoids downloading the same content twice.
		InputStream inputStream = null;
		try {
			URI cachedUri = TiResponseCache.fetchEndpointFollowingRedirects(uri);
			if (cachedUri != null) {
				inputStream = TiResponseCache.openCachedStream(cachedUri);
				if (inputStream != null) {
					return inputStream;
				}
			}
		} catch (Exception ex) {
		}

		// If running on main UI thread, then block this thread while doing download on another thread.
		// Note: Using "HttpUrlConnection" on UI thread will cause a "NetworkOnMainThreadException" to be thrown.
		if (TiApplication.isUIThread()) {
			// Perform the blocking download on another thread.
			// Downloaded content will be made available via Titanium's "TiResponseCache".
			try {
				Thread thread = new Thread(new Runnable() {
					@Override
					public void run()
					{
						try (InputStream stream = blockingDownload(uri)) {
							if (stream != null) {
								KrollStreamHelper.pump(stream, null);
							}
						} catch (Exception ex) {
							Log.e(TAG, "Exception downloading from: " + uri.toString(), ex);
						}
					}
				});
				thread.start();
				thread.join();
			} catch (Exception ex) {
			}

			// Return a stream to the downloaded file/content via our response cache.
			URI cachedUri = TiResponseCache.fetchEndpointFollowingRedirects(uri);
			if (cachedUri != null) {
				try {
					inputStream = TiResponseCache.openCachedStream(cachedUri);
				} catch (Exception ex) {
				}
			}
			return inputStream;
		}

		// Convert the given URI to a URL object.
		// Note: This object will validate the string and throw an exception if malformed.
		URL url = new URL(uri.toString());

		// Attempt to download the file.
		URLConnection connection = null;
		try {
			int redirectCount = 0;
			while (true) {
				// Attempt to connect to the given URL.
				connection = url.openConnection();
				connection.setConnectTimeout(TIMEOUT_IN_MILLISECONDS);
				connection.setReadTimeout(TIMEOUT_IN_MILLISECONDS);
				connection.setDoInput(true);
				if (connection instanceof HttpsURLConnection) {
					final HttpsURLConnection httpsConnection = (HttpsURLConnection) connection;

					// NOTE: use reflection to prevent circular reference to the network module
					// TODO: move TiDownloadManager into network module
					final Class TiSocketFactory = Class.forName("ti.modules.titanium.network.TiSocketFactory");
					final Constructor constructor = TiSocketFactory.getConstructors()[0];
					final SSLSocketFactory socketFactory = (SSLSocketFactory) constructor.newInstance(null, null, 0);

					httpsConnection.setSSLSocketFactory(socketFactory);
				}
				if (connection instanceof HttpURLConnection) {
					// Connect via HTTP/HTTPS.
					HttpURLConnection httpConnection = (HttpURLConnection) connection;
					httpConnection.setInstanceFollowRedirects(true);
					httpConnection.connect();
					int responseCode = httpConnection.getResponseCode();
					if (responseCode == 200) {
						// A valid response has been received. Fetch its download stream.
						inputStream = httpConnection.getInputStream();
					} else if ((responseCode >= 300) && (responseCode < 400)) {
						// A redirect response has been received.
						// We have to handle redirects between HTTP/HTTPS protocols ourselves.
						// First, make sure we haven't been redirected too many times. (Avoids recursive redirects.)
						redirectCount++;
						if (redirectCount > 10) {
							break;
						}

						// Acquire the URL we're being asked to redirect to.
						String redirectUrl = httpConnection.getHeaderField("Location");
						if ((redirectUrl == null) || (redirectUrl.length() <= 0)) {
							break;
						}
						url = new URL(redirectUrl);

						// Close the connection and attempt to connect to the redirect URL.
						httpConnection.disconnect();
						continue;
					} else {
						// Server did not provide the expected response, such as a 404.
						Log.e(TAG, "Received unexpected response code " + responseCode + " from: " + uri);
					}
				} else {
					// Connect to the endpoint and acquire the downloaded content.
					// Note: We'll only be here if not using an HTTP/HTTPS protocol.
					connection.connect();
					inputStream = connection.getInputStream();
				}
				break;
			}
		} finally {
			// Close the connection if we don't have a stream to the response body. (Nothing to download.)
			if ((inputStream == null) && (connection instanceof HttpURLConnection)) {
				try {
					((HttpURLConnection) connection).disconnect();
				} catch (Exception ex) {
				}
			}
		}

		// If we've acquried an HTTP/HTTPS download stream, then wrap the stream.
		// The stream wrapper will automatically close the HTTP connection when the stream has been closed.
		if ((inputStream != null) && (connection instanceof HttpURLConnection)) {
			final HttpURLConnection httpConnection = (HttpURLConnection) connection;
			inputStream = new TiInputStreamWrapper(inputStream, new TiInputStreamWrapper.ClosedListener() {
				@Override
				public void onClosed()
				{
					try {
						httpConnection.disconnect();
					} catch (Exception ex) {
					}
				}
			});
		}

		// Return the download stream, if successful. (Will return null if failed.)
		return inputStream;
	}

	private void sendMessage(URI uri, int what)
	{
		Message msg = handler.obtainMessage(what);
		msg.obj = uri;
		msg.sendToTarget();
	}

	protected void startDownload(URI uri, TiDownloadListener listener)
	{
		String key = uri.toString();
		ArrayList<SoftReference<TiDownloadListener>> listenerList = null;
		synchronized (listeners)
		{
			if (!listeners.containsKey(key)) {
				listenerList = new ArrayList<SoftReference<TiDownloadListener>>();
				listeners.put(key, listenerList);
			} else {
				listenerList = listeners.get(key);
			}
			// We only allow a listener once per URI
			for (SoftReference<TiDownloadListener> l : listenerList) {
				if (l.get() == listener) {
					return;
				}
			}
			listenerList.add(new SoftReference<TiDownloadListener>(listener));
		}
		synchronized (downloadingURIs)
		{
			if (!downloadingURIs.contains(key)) {
				downloadingURIs.add(key);
				threadPool.execute(new DownloadJob(uri));
			}
		}
	}

	protected void handleFireDownloadMessage(URI uri, int what)
	{
		ArrayList<SoftReference<TiDownloadListener>> listenerList;
		synchronized (listeners)
		{
			listenerList = listeners.get(uri.toString());
		}
		if (listenerList != null) {
			for (Iterator<SoftReference<TiDownloadListener>> i = listenerList.iterator(); i.hasNext();) {
				TiDownloadListener downloadListener = i.next().get();
				if (downloadListener != null) {
					if (what == MSG_FIRE_DOWNLOAD_FINISHED) {
						downloadListener.downloadTaskFinished(uri);
					} else {
						downloadListener.downloadTaskFailed(uri);
					}
					i.remove();
				}
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
				// Download the file/content referenced by the URI.
				// Once all content has been pumped below, content will be made available via "TiResponseCache".
				try (InputStream stream = blockingDownload(uri)) {
					if (stream != null) {
						KrollStreamHelper.pump(stream, null);
					}
				}

				synchronized (downloadingURIs)
				{
					downloadingURIs.remove(uri.toString());
				}

				// If there is additional background task, run it here.
				ArrayList<SoftReference<TiDownloadListener>> listenerList;
				synchronized (listeners)
				{
					listenerList = listeners.get(uri.toString());
				}
				if (listenerList != null) {
					for (Iterator<SoftReference<TiDownloadListener>> i = listenerList.iterator(); i.hasNext();) {
						TiDownloadListener downloadListener = i.next().get();
						if (downloadListener != null) {
							downloadListener.postDownload(uri);
						}
					}
				}

				sendMessage(uri, MSG_FIRE_DOWNLOAD_FINISHED);
			} catch (Exception e) {

				synchronized (downloadingURIs)
				{
					downloadingURIs.remove(uri.toString());
				}

				// fire a download fail event if we are unable to download
				sendMessage(uri, MSG_FIRE_DOWNLOAD_FAILED);
				Log.e(TAG, "Exception downloading from: " + uri + "\n" + e.getMessage());
			}
		}
	}

	@Override
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

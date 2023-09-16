/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import java.io.InputStream;
import java.lang.ref.SoftReference;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.net.URLConnection;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicReference;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLSocketFactory;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.util.KrollStreamHelper;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.io.TiInputStreamWrapper;

import ti.modules.titanium.network.NetworkModule;
import ti.modules.titanium.network.TiSocketFactory;

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

	protected Map<String, List<SoftReference<TiDownloadListener>>> listeners = new HashMap<>();
	protected List<String> downloadingURIs = Collections.synchronizedList(new ArrayList<>());
	protected ExecutorService threadPool;
	protected Handler handler;

	private static class InstanceHolder
	{
		private static final TiDownloadManager INSTANCE = new TiDownloadManager();
	}

	public static TiDownloadManager getInstance()
	{
		return InstanceHolder.INSTANCE;
	}

	protected TiDownloadManager()
	{
		handler = new Handler(Looper.getMainLooper(), this);
		threadPool = Executors.newFixedThreadPool(Math.max(Runtime.getRuntime().availableProcessors(), 2));
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
	 * Throws exception if failed to download content.
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
			// Downloaded content will be made available via Titanium's "TiResponseCache"
			AtomicReference<Exception> exception = new AtomicReference<>(null);
			Thread thread = new Thread(() -> {
				try (InputStream stream = blockingDownload(uri)) {
					if (stream != null) {
						KrollStreamHelper.pump(stream, null);
					}
				} catch (Exception ex) {
					exception.set(ex);
				}
			});
			thread.start();
			thread.join();

			// Handle download thread exception.
			if (exception.get() != null) {
				throw exception.get();
			}

			// Return a stream to the downloaded file/content via our response cache.
			URI cachedUri = TiResponseCache.fetchEndpointFollowingRedirects(uri);
			if (cachedUri != null) {
				inputStream = TiResponseCache.openCachedStream(cachedUri);
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
					final SSLSocketFactory socketFactory = new TiSocketFactory(null, null, NetworkModule.TLS_DEFAULT);
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
		List<SoftReference<TiDownloadListener>> listenerList;

		synchronized (listeners)
		{
			listenerList = listeners.get(key);

			if (listenerList == null) {
				listenerList = new ArrayList<>();
				listeners.put(key, listenerList);
			}
		}

		synchronized (listenerList)
		{
			for (Iterator<SoftReference<TiDownloadListener>> i = listenerList.iterator(); i.hasNext(); ) {
				TiDownloadListener downloadListener = i.next().get();

				if (downloadListener == listener) {
					return;
				}
			}
			listenerList.add(new SoftReference<>(listener));
		}

		if (downloadingURIs.add(key)) {
			threadPool.execute(new DownloadJob(uri));
		}
	}

	protected void handleFireDownloadMessage(URI uri, int what)
	{
		List<SoftReference<TiDownloadListener>> listenerList;

		synchronized (listeners)
		{
			listenerList = listeners.get(uri.toString());
		}

		if (listenerList == null) {
			return;
		}

		synchronized (listenerList)
		{
			for (Iterator<SoftReference<TiDownloadListener>> i = listenerList.iterator(); i.hasNext(); ) {
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
			boolean wasSuccessful = false;
			try {
				// Download the file/content referenced by the URI.
				// Once all content has been pumped below, content will be made available via "TiResponseCache".
				try (InputStream stream = blockingDownload(uri)) {
					if (stream != null) {
						KrollStreamHelper.pump(stream, null);
						wasSuccessful = true;
					}
				}

				downloadingURIs.remove(uri.toString());

				// If there is additional background task, run it here.

				List<SoftReference<TiDownloadListener>> listenerList;

				synchronized (listeners)
				{
					listenerList = listeners.get(uri.toString());

					if (listenerList != null) {
						listenerList = new ArrayList<>(listenerList);
					}
				}

				if (listenerList != null) {
					for (SoftReference<TiDownloadListener> listener : listenerList) {
						TiDownloadListener downloadListener = listener.get();

						if (downloadListener != null) {
							downloadListener.postDownload(uri);
						}
					}
				}
			} catch (Exception e) {
				wasSuccessful = false;
				Log.e(TAG, "Exception downloading from: " + uri + "\n" + e.getMessage());
			} finally {
				downloadingURIs.remove(uri.toString());
			}

			if (wasSuccessful) {
				sendMessage(uri, MSG_FIRE_DOWNLOAD_FINISHED);
			} else {
				sendMessage(uri, MSG_FIRE_DOWNLOAD_FAILED);
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

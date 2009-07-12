/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module.net;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.lang.ref.SoftReference;
import java.lang.ref.WeakReference;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.HashMap;

import org.apache.http.Header;
import org.apache.http.HttpEntityEnclosingRequest;
import org.apache.http.HttpHost;
import org.apache.http.HttpRequest;
import org.apache.http.HttpResponse;
import org.apache.http.MethodNotSupportedException;
import org.apache.http.NameValuePair;
import org.apache.http.client.HttpResponseException;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.entity.StringEntity;
import org.apache.http.entity.mime.MultipartEntity;
import org.apache.http.entity.mime.content.ContentBody;
import org.apache.http.entity.mime.content.FileBody;
import org.apache.http.entity.mime.content.StringBody;
import org.apache.http.impl.DefaultHttpRequestFactory;
import org.apache.http.impl.client.BasicResponseHandler;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.message.BasicHttpEntityEnclosingRequest;
import org.apache.http.message.BasicNameValuePair;
import org.appcelerator.titanium.TitaniumWebView;
import org.appcelerator.titanium.api.ITitaniumFile;
import org.appcelerator.titanium.api.ITitaniumHttpClient;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.fs.TitaniumBlob;
import org.appcelerator.titanium.module.fs.TitaniumFile;
import org.appcelerator.titanium.module.fs.TitaniumResourceFile;

import android.net.Uri;
import android.os.Handler;
import android.util.Log;
import android.webkit.WebView;

public class TitaniumHttpClient implements ITitaniumHttpClient
{
	private static final String LCAT = "TiHttpClient";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private WeakReference<Handler> weakGuiHandler;
	private SoftReference<TitaniumWebView> softWebView;

	private String userAgent;
	private String onReadyStateChangeCallback;
	private int readyState;
	private String responseText;
	private int status;
	private String statusText;

	private HttpRequest request;
	private HttpResponse response;
	private HttpHost host;
	private DefaultHttpClient client;

	private ArrayList<NameValuePair> nvPairs;
	private HashMap<String, ContentBody> parts;

	class LocalResponseHandler extends BasicResponseHandler
	{
		private WeakReference<TitaniumHttpClient> client;

		public LocalResponseHandler(TitaniumHttpClient client) {
			this.client = new WeakReference<TitaniumHttpClient>(client);
		}

		@Override
		public String handleResponse(HttpResponse response)
				throws HttpResponseException, IOException
		{
			TitaniumHttpClient c = client.get();
			if (c != null) {
				c.response = response;
				c.setReadyState(READY_STATE_LOADED);
				c.setStatus(response.getStatusLine().getStatusCode());
				c.setStatusText(response.getStatusLine().getReasonPhrase());
				c.setReadyState(READY_STATE_INTERACTIVE);
			}
			return super.handleResponse(response);
		}

	}
	public TitaniumHttpClient(TitaniumWebView webView, Handler handler, String userAgent)
	{
		onReadyStateChangeCallback = null;
		readyState = 0;
		responseText = "";
		this.userAgent = userAgent;
		this.softWebView = new SoftReference<TitaniumWebView>(webView);
		this.weakGuiHandler = new WeakReference<Handler>(handler);
		this.nvPairs = new ArrayList<NameValuePair>();
		this.parts = new HashMap<String,ContentBody>();
	}

	/* (non-Javadoc)
	 * @see org.appcelerator.titanium.module.ITitaniumHttpClient#getOnReadyStateChangeCallback()
	 */
	public synchronized String getOnReadyStateChangeCallback() {
		return onReadyStateChangeCallback;
	}

	/* (non-Javadoc)
	 * @see org.appcelerator.titanium.module.ITitaniumHttpClient#setOnReadyStateChangeCallback(java.lang.String)
	 */
	public synchronized void setOnReadyStateChangeCallback(String onReadyStateChangeCallback) {
		if (DBG) {
			Log.d(LCAT, "Setting callback to " + onReadyStateChangeCallback);
		}
		this.onReadyStateChangeCallback = onReadyStateChangeCallback;
	}

	/* (non-Javadoc)
	 * @see org.appcelerator.titanium.module.ITitaniumHttpClient#getReadyState()
	 */
	public synchronized int getReadyState() {
		return readyState;
	}

	/* (non-Javadoc)
	 * @see org.appcelerator.titanium.module.ITitaniumHttpClient#setReadyState(int)
	 */
	public synchronized void setReadyState(final int readyState) {
		Log.d(LCAT, "Setting ready state to " + readyState);
		this.readyState = readyState;
		TitaniumWebView webView = softWebView.get();
		if (webView != null) {
			if (getOnReadyStateChangeCallback() != null) {
				webView.evalJS(getOnReadyStateChangeCallback());
			}
		}
	}

	/* (non-Javadoc)
	 * @see org.appcelerator.titanium.module.ITitaniumHttpClient#getResponseText()
	 */
	public synchronized String getResponseText() {
		return responseText;
	}

	/* (non-Javadoc)
	 * @see org.appcelerator.titanium.module.ITitaniumHttpClient#setResponseText(java.lang.String)
	 */
	public synchronized void setResponseText(String responseText) {
		this.responseText = responseText;
	}

	/* (non-Javadoc)
	 * @see org.appcelerator.titanium.module.ITitaniumHttpClient#getStatus()
	 */
	public synchronized int getStatus() {
		return status;
	}

	/* (non-Javadoc)
	 * @see org.appcelerator.titanium.module.ITitaniumHttpClient#setStatus(int)
	 */
	public synchronized void setStatus(int status) {
		this.status = status;
	}

	/* (non-Javadoc)
	 * @see org.appcelerator.titanium.module.ITitaniumHttpClient#getStatusText()
	 */
	public synchronized String getStatusText() {
		return statusText;
	}

	/* (non-Javadoc)
	 * @see org.appcelerator.titanium.module.ITitaniumHttpClient#setStatusText(java.lang.String)
	 */
	public synchronized void setStatusText(String statusText) {
		this.statusText = statusText;
	}

	/* (non-Javadoc)
	 * @see org.appcelerator.titanium.module.ITitaniumHttpClient#abort()
	 */
	public synchronized void abort() {
		if (readyState > READY_STATE_UNINITIALIZED && readyState < READY_STATE_COMPLETE) {
			if (client != null) {
				if (DBG) {
					Log.d(LCAT, "Calling shutdown on clientConnectionManager");
				}
				client.getConnectionManager().shutdown();
			}
		}
	}

	/* (non-Javadoc)
	 * @see org.appcelerator.titanium.module.ITitaniumHttpClient#getAllResponseHeaders()
	 */
	public synchronized String getAllResponseHeaders() {
		String result = "";
		if (readyState >= READY_STATE_LOADED)
		{
			StringBuilder sb = new StringBuilder(1024);

			Header[] headers = request.getAllHeaders();
			int len = headers.length;
			for(int i = 0; i < len; i++) {
				Header h = headers[i];
				sb.append(h.getName()).append(":").append(h.getValue()).append("\n");
			}
			result = sb.toString();
		} else {
			// Spec says return "";
		}

		return result;
	}

	/* (non-Javadoc)
	 * @see org.appcelerator.titanium.module.ITitaniumHttpClient#setRequestHeader(java.lang.String, java.lang.String)
	 */
	public synchronized void setRequestHeader(String header, String value)
	{
		if (readyState == READY_STATE_LOADING) {
			request.addHeader(header, value);
		} else {
			throw new IllegalStateException("setRequestHeader can only be called before invoking send.");
		}
	}

	/* (non-Javadoc)
	 * @see org.appcelerator.titanium.module.ITitaniumHttpClient#getResponseHeader(java.lang.String)
	 */
	public synchronized String getResponseHeader(String header) {
		String result = "";

		if (readyState > READY_STATE_LOADING) {
			result = response.getFirstHeader(header).getValue();
		} else {
			throw new IllegalStateException("getResponseHeader can only be called when readyState > 1");
		}

		return result;
	}

	/* (non-Javadoc)
	 * @see org.appcelerator.titanium.module.ITitaniumHttpClient#open(java.lang.String, java.lang.String)
	 */
	public synchronized void open(String method, String url) throws MethodNotSupportedException
	{
		if (DBG) {
			Log.d(LCAT, "open request method=" + method + " url=" + url);
		}
		request = new DefaultHttpRequestFactory().newHttpRequest(method, url);
		Uri uri = Uri.parse(url);
		host = new HttpHost(uri.getHost(), uri.getPort(), uri.getScheme());
		setReadyState(READY_STATE_LOADING);
		setRequestHeader("User-Agent",userAgent);
		setRequestHeader("X-Requested-With","XMLHttpRequest");
	}

	public synchronized void addPostData(String name, String value) {
		if (value == null) {
			value = "";
		}
		try {
			parts.put(name, new StringBody(value));
		} catch (UnsupportedEncodingException e) {
			nvPairs.add(new BasicNameValuePair(name,value));
		}
	}

	public synchronized void addTitaniumFileAsPostData(String name, ITitaniumFile value) {
		if (value instanceof TitaniumBlob) {
			TitaniumBlob blob = (TitaniumBlob) value;
			FileBody body = new FileBody(blob.getFile(), blob.getContentType());
			parts.put(name, body);
		} else if (value instanceof TitaniumFile) {
			Log.e(LCAT, name + " is a TitaniumFile");
		} else if (value instanceof TitaniumResourceFile) {
			Log.e(LCAT, name + " is a TitaniumResourceFile");
		} else {
			if (value != null) {
				Log.e(LCAT, name + " is a " + value.getClass().getSimpleName());
			} else {
				Log.e(LCAT, name + " is null");
			}
		}
	}

	/* (non-Javadoc)
	 * @see org.appcelerator.titanium.module.ITitaniumHttpClient#send(java.lang.String)
	 */
	public synchronized void send(String data)
	{
		if (DBG) {
			Log.d(LCAT, "send()");
		}
		Header[] h = request.getAllHeaders();
		for(int i=0; i < h.length; i++) {
			Header hdr = h[i];
			//Log.e(LCAT, "HEADER: " + hdr.toString());
		}

		final LocalResponseHandler handler = new LocalResponseHandler(this);
		client = new DefaultHttpClient();

		final TitaniumHttpClient me = this;

		if(request instanceof BasicHttpEntityEnclosingRequest) {

			UrlEncodedFormEntity form = null;
			MultipartEntity mpe = null;

			if (nvPairs.size() > 0) {
				try {
					form = new UrlEncodedFormEntity(nvPairs, "UTF-8");
				} catch (UnsupportedEncodingException e) {
					Log.e(LCAT, "Unsupported encoding: ", e);
				}
			}

			if(parts.size() > 0) {
				mpe = new MultipartEntity();

				for(String name : parts.keySet()) {
					mpe.addPart(name, parts.get(name));
				}
				if (form != null) {
					try {
						ByteArrayOutputStream bos = new ByteArrayOutputStream((int) form.getContentLength());
						form.writeTo(bos);
						mpe.addPart("form", new StringBody(bos.toString(), "application/x-www-form-urlencoded", Charset.forName("UTF-8")));
					} catch (UnsupportedEncodingException e) {
						Log.e(LCAT, "Unsupported encoding: ", e);
					} catch (IOException e) {
						Log.e(LCAT, "Error converting form to string: ", e);
					}
				}

				HttpEntityEnclosingRequest e = (HttpEntityEnclosingRequest) request;
				e.setEntity(mpe);
			} else {
				HttpEntityEnclosingRequest e = (HttpEntityEnclosingRequest) request;
				e.setEntity(form);
			}

			if (data!=null)
			{
				try
				{
					StringEntity requestEntity = new StringEntity(data, "UTF-8");
					//TODO: you'll only want to do this if you don't have a header
					requestEntity.setContentType("application/x-www-form-urlencoded");
					HttpEntityEnclosingRequest e = (HttpEntityEnclosingRequest)request;
					e.setEntity(requestEntity);

				}
				catch(Exception ex)
				{
					//FIXME
					Log.e(LCAT, "Exception, implement recovery: ", ex);
				}
			}
		}

		// TODO consider using task manager

		Thread t = new Thread(new Runnable(){

			public void run() {
				try {
					Log.d(LCAT, "Preparing to execute request");
					String result = client.execute(me.host, me.request, handler);
					if(result != null) {
						Log.d(LCAT, "Have result back from request len=" + result.length());
					}
					me.setResponseText(result);
					me.setReadyState(READY_STATE_COMPLETE);
				} catch(Exception e) {
					TitaniumWebView webView = softWebView.get();
					Handler guiHandler = weakGuiHandler.get();
					if (webView != null && guiHandler != null) {
						if (TitaniumConfig.LOGD) {
							Log.e(LCAT, "Error trying to handle request. ", e);
						}
						//TODO possibly add error handler callback
					} else {
						Log.e(LCAT, "HTTP Error: " + e.getMessage(), e);
					}
				}
			}});

		t.start();

	}
}

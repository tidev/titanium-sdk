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
import org.appcelerator.titanium.util.Log;

import android.net.Uri;

public class TitaniumHttpClient implements ITitaniumHttpClient
{
	private static final String LCAT = "TiHttpClient";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private SoftReference<TitaniumWebView> softWebView;

	private String userAgent;
	private String onReadyStateChangeCallback;
	private String onLoadCallback;
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
	private String data;

	private final TitaniumHttpClient me;
	String syncId;

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
				c.setReadyState(READY_STATE_LOADED, syncId);
				c.setStatus(response.getStatusLine().getStatusCode());
				c.setStatusText(response.getStatusLine().getReasonPhrase());
				c.setReadyState(READY_STATE_INTERACTIVE, syncId);
			}
			return super.handleResponse(response);
		}

	}
	public TitaniumHttpClient(TitaniumWebView webView, String userAgent)
	{
		me = this;
		onReadyStateChangeCallback = null;
		readyState = 0;
		responseText = "";
		this.userAgent = userAgent;
		this.softWebView = new SoftReference<TitaniumWebView>(webView);
		this.nvPairs = new ArrayList<NameValuePair>();
		this.parts = new HashMap<String,ContentBody>();
	}

	/* (non-Javadoc)
	 * @see org.appcelerator.titanium.module.ITitaniumHttpClient#getOnReadyStateChangeCallback()
	 */
	public  String getOnReadyStateChangeCallback() {
		return onReadyStateChangeCallback;
	}

	/* (non-Javadoc)
	 * @see org.appcelerator.titanium.module.ITitaniumHttpClient#setOnReadyStateChangeCallback(java.lang.String)
	 */
	public  void setOnReadyStateChangeCallback(String onReadyStateChangeCallback) {
		if (DBG) {
			Log.d(LCAT, "Setting callback to " + onReadyStateChangeCallback);
		}
		this.onReadyStateChangeCallback = onReadyStateChangeCallback;
	}

	/* (non-Javadoc)
	 * @see org.appcelerator.titanium.module.ITitaniumHttpClient#getReadyState()
	 */
	public  int getReadyState() {
		synchronized(this) {
			this.notify();
		}
		return readyState;
	}

	/* (non-Javadoc)
	 * @see org.appcelerator.titanium.module.ITitaniumHttpClient#setReadyState(int)
	 */
	public void setReadyState(final int readyState) {
		setReadyState(readyState, null);
	}
	public void setReadyState(final int readyState, final String syncId) {
		Log.d(LCAT, "Setting ready state to " + readyState);
		this.readyState = readyState;
		final TitaniumWebView webView = softWebView.get();
		if (webView != null) {
			final String cb = getOnReadyStateChangeCallback();
			if (cb != null) {
				webView.evalJS(cb, null, syncId);
			}
			if (readyState == ITitaniumHttpClient.READY_STATE_COMPLETE) {
				// Fire onload callback
				final String cbOnLoad = onLoadCallback;
				if (cbOnLoad != null) {
					webView.evalJS(cbOnLoad, null, syncId);
				}
			}
		}
	}

	/* (non-Javadoc)
	 * @see org.appcelerator.titanium.module.ITitaniumHttpClient#getResponseText()
	 */
	public  String getResponseText() {
		return responseText;
	}

	/* (non-Javadoc)
	 * @see org.appcelerator.titanium.module.ITitaniumHttpClient#setResponseText(java.lang.String)
	 */
	public  void setResponseText(String responseText) {
		this.responseText = responseText;
	}

	/* (non-Javadoc)
	 * @see org.appcelerator.titanium.module.ITitaniumHttpClient#getStatus()
	 */
	public  int getStatus() {
		return status;
	}

	/* (non-Javadoc)
	 * @see org.appcelerator.titanium.module.ITitaniumHttpClient#setStatus(int)
	 */
	public  void setStatus(int status) {
		this.status = status;
	}

	/* (non-Javadoc)
	 * @see org.appcelerator.titanium.module.ITitaniumHttpClient#getStatusText()
	 */
	public  String getStatusText() {
		return statusText;
	}

	/* (non-Javadoc)
	 * @see org.appcelerator.titanium.module.ITitaniumHttpClient#setStatusText(java.lang.String)
	 */
	public  void setStatusText(String statusText) {
		this.statusText = statusText;
	}

	public void setOnLoadCallback(String callback) {
		this.onLoadCallback = callback;
	}

	/* (non-Javadoc)
	 * @see org.appcelerator.titanium.module.ITitaniumHttpClient#abort()
	 */
	public void abort() {
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
	public String getAllResponseHeaders() {
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
	public void setRequestHeader(String header, String value)
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
	public String getResponseHeader(String header) {
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
	public void open(String method, String url) throws MethodNotSupportedException
	{
		if (DBG) {
			Log.d(LCAT, "open request method=" + method + " url=" + url);
		}
		TitaniumWebView wv = softWebView.get();
		if (wv != null) {
			me.syncId = wv.registerLock();
		}

		request = new DefaultHttpRequestFactory().newHttpRequest(method, url);
		Uri uri = Uri.parse(url);
		host = new HttpHost(uri.getHost(), uri.getPort(), uri.getScheme());
		setReadyState(READY_STATE_LOADING, syncId);
		setRequestHeader("User-Agent",userAgent);
		setRequestHeader("X-Requested-With","XMLHttpRequest");
	}

	public void addStringData(String data) {
		this.data = data;
	}

	public void addPostData(String name, String value) {
		if (value == null) {
			value = "";
		}
		try {
			parts.put(name, new StringBody(value));
		} catch (UnsupportedEncodingException e) {
			nvPairs.add(new BasicNameValuePair(name,value));
		}
	}

	public void addTitaniumFileAsPostData(String name, ITitaniumFile value) {
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
	public void send()
	{

		// TODO consider using task manager
		final TitaniumHttpClient me = this;
		Thread t = new Thread(new Runnable(){

			public void run() {
				try {

					Thread.sleep(10);
					if (DBG) {
						Log.d(LCAT, "send()");
					}
					/*
					Header[] h = request.getAllHeaders();
					for(int i=0; i < h.length; i++) {
						Header hdr = h[i];
						//Log.e(LCAT, "HEADER: " + hdr.toString());
					}
					 */
					final LocalResponseHandler handler = new LocalResponseHandler(me);
					client = new DefaultHttpClient();

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
							if (data!=null)
							{
								try
								{
									StringEntity requestEntity = new StringEntity(data, "UTF-8");
									Header header = request.getFirstHeader("contentType");
									if(header == null) {
										requestEntity.setContentType("application/x-www-form-urlencoded");
									} else {
										requestEntity.setContentType(header.getValue());
									}
									HttpEntityEnclosingRequest e = (HttpEntityEnclosingRequest)request;
									e.setEntity(requestEntity);
								}
								catch(Exception ex)
								{
									//FIXME
									Log.e(LCAT, "Exception, implement recovery: ", ex);
								}
							} else {
								HttpEntityEnclosingRequest e = (HttpEntityEnclosingRequest) request;
								e.setEntity(form);
							}
						}
					}
					if (DBG) {
						Log.d(LCAT, "Preparing to execute request");
					}
					String result = client.execute(me.host, me.request, handler);
					if(result != null) {
						Log.d(LCAT, "Have result back from request len=" + result.length());
					}
					me.setResponseText(result);
					me.setReadyState(READY_STATE_COMPLETE, syncId);
				} catch(Exception e) {
					Log.e(LCAT, "HTTP Error: " + e.getMessage(), e);
				} finally {
					TitaniumWebView wv = softWebView.get();
					if (wv != null) {
						wv.unregisterLock(syncId);
						wv = null;
					}
					syncId = null;
				}
			}});
		t.setPriority(Thread.MIN_PRIORITY);

		t.start();

		if (DBG) {
			Log.d(LCAT, "Leaving send()");
		}
	}
}

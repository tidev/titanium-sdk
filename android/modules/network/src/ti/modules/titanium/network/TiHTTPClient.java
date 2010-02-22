/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.network;
 
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.lang.ref.WeakReference;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.apache.http.Header;
import org.apache.http.HttpEntity;
import org.apache.http.HttpEntityEnclosingRequest;
import org.apache.http.HttpHost;
import org.apache.http.HttpRequest;
import org.apache.http.HttpResponse;
import org.apache.http.HttpVersion;
import org.apache.http.MethodNotSupportedException;
import org.apache.http.NameValuePair;
import org.apache.http.ParseException;
import org.apache.http.StatusLine;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.Credentials;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.HttpResponseException;
import org.apache.http.client.ResponseHandler;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.entity.StringEntity;
import org.apache.http.entity.mime.MultipartEntity;
import org.apache.http.entity.mime.content.ContentBody;
import org.apache.http.entity.mime.content.InputStreamBody;
import org.apache.http.entity.mime.content.StringBody;
import org.apache.http.impl.DefaultHttpRequestFactory;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.message.BasicHttpEntityEnclosingRequest;
import org.apache.http.message.BasicNameValuePair;
import org.apache.http.params.HttpProtocolParams;
import org.apache.http.protocol.HTTP;
import org.apache.http.util.EntityUtils;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;

import android.net.Uri;
 
public class TiHTTPClient
{
	private static final String LCAT = "TiHttpClient";
	private static final boolean DBG = TiConfig.LOGD;
 
	private static AtomicInteger httpClientThreadCounter;
	public static final int READY_STATE_UNSENT = 0; // Unsent, open() has not yet been called
	public static final int READY_STATE_OPENED = 1; // Opened, send() has not yet been called
	public static final int READY_STATE_HEADERS_RECEIVED = 2; // Headers received, headers have returned and the status is available
	public static final int READY_STATE_LOADING = 3; // Loading, responseText is being loaded with data
	public static final int READY_STATE_DONE = 4; // Done, all operations have finished
    
	private static final String ON_READY_STATE_CHANGE = "onreadystatechange";
	private static final String ON_LOAD = "onload";
	private static final String ON_ERROR = "onerror";
	private static final String ON_DATA_STREAM = "ondatastream";
    
	private TiProxy proxy;
	private int readyState;
	private String responseText;
	private int status;
	private String statusText;
 
	private HttpRequest request;
	private HttpResponse response;
	private String method;
	private HttpHost host;
	private DefaultHttpClient client;
	private LocalResponseHandler handler;
	private Credentials credentials;
 
	private TiBlob responseData;
	private String charset;
 
	private ArrayList<NameValuePair> nvPairs;
	private HashMap<String, ContentBody> parts;
	private String data;
 
	Thread clientThread;
	private boolean aborted;
 
	class LocalResponseHandler implements ResponseHandler<String>
	{
		public WeakReference<TiHTTPClient> client;
		public InputStream is;
		public HttpEntity entity;
 
		public LocalResponseHandler(TiHTTPClient client) {
			this.client = new WeakReference<TiHTTPClient>(client);
		}
 
		public String handleResponse(HttpResponse response)
				throws HttpResponseException, IOException
		{
	        String clientResponse = null;
 
			if (client != null) {
				TiHTTPClient c = client.get();
				if (c != null) {
					c.response = response;
					c.setReadyState(READY_STATE_HEADERS_RECEIVED);
					c.setStatus(response.getStatusLine().getStatusCode());
					c.setStatusText(response.getStatusLine().getReasonPhrase());
					c.setReadyState(READY_STATE_LOADING);
				}
 
				if (DBG) {
					try {
						Log.w(LCAT, "Entity Type: " + response.getEntity().getClass());
						Log.w(LCAT, "Entity Content Type: " + response.getEntity().getContentType().getValue());
						Log.w(LCAT, "Entity isChunked: " + response.getEntity().isChunked());
						Log.w(LCAT, "Entity isStreaming: " + response.getEntity().isStreaming());
					} catch (Throwable t) {
						// Ignore
					}
				}
 
				StatusLine statusLine = response.getStatusLine();
		        if (statusLine.getStatusCode() >= 300) {
					setResponseText(response.getEntity());
					throw new HttpResponseException(statusLine.getStatusCode(), statusLine.getReasonPhrase());
				}
				
				entity = response.getEntity();
 
				KrollCallback onDataStreamCallback = c.getCallback(ON_DATA_STREAM);
				if (onDataStreamCallback != null) {
					is = entity.getContent();
 
					if (is != null) {
						final KrollCallback cb = onDataStreamCallback;
						long contentLength = entity.getContentLength();
						if (DBG) {
							Log.d(LCAT, "Content length: " + contentLength);
						}
						int count = 0;
						int totalSize = 0;
						byte[] buf = new byte[4096];
						if (DBG) {
							Log.d(LCAT, "Available: " + is.available());
						}
						if (aborted) {
							if (entity != null) {
								entity.consumeContent();
							}
						} else {
							while((count = is.read(buf)) != -1) {
								Log.d(LCAT, "Read " + count + " of " + contentLength + " bytes from HTTP stream");
								
								totalSize += count;
								TiDict o = new TiDict();
								o.put("totalCount", contentLength);
								o.put("totalSize", totalSize);
								o.put("size", count);
								
								byte[] newbuf = new byte[count];
								for (int i = 0; i < count; i++) {
									newbuf[i] = buf[i];
								}
 
								TiBlob blob = TiBlob.blobFromData(proxy.getTiContext(), newbuf);
								Log.d(LCAT, "data: " + new String(newbuf));
								o.put("blob", blob);
								o.put("progress", (((double)count)/((double)totalSize))*100);
								
								cb.callWithProperties(o);
								//if(!entity.isStreaming()) {
								//	break;
								//}
							}
							if (entity != null) {
								try {
									entity.consumeContent();
								} catch (IOException e) {
									e.printStackTrace();
								}
							}
						}
					}
				} else {
					setResponseData(entity);
				}
			}
			return clientResponse;
		}
 
		private void setResponseData(HttpEntity entity)
			throws IOException, ParseException
		{
			if (entity != null) {
				responseData = TiBlob.blobFromData(proxy.getTiContext(), EntityUtils.toByteArray(entity));
				charset = EntityUtils.getContentCharSet(entity);
			}
		}
 
		private void setResponseText(HttpEntity entity)
			throws IOException, ParseException
		{
			if (entity != null) {
				responseText = EntityUtils.toString(entity);
			}
		}
	}
 
	public TiHTTPClient(TiProxy proxy)
	{
		this.proxy = proxy;
 
		if (httpClientThreadCounter == null) {
			httpClientThreadCounter = new AtomicInteger();
		}
		readyState = 0;
		responseText = "";
		credentials = null;
		this.nvPairs = new ArrayList<NameValuePair>();
		this.parts = new HashMap<String,ContentBody>();
	}
 
	public int getReadyState() {
		synchronized(this) {
			this.notify();
		}
		return readyState;
	}
 
	public KrollCallback getCallback(String name)
	{
		Object value = proxy.getDynamicValue(name);
		if (value != null && value instanceof KrollCallback)
		{
			return (KrollCallback) value;
		}
		return null;
	}
 
	public void fireCallback(String name)
	{
		fireCallback(name, new Object[0]);
	}
 
	public void fireCallback(String name, Object[] args)
	{
		KrollCallback cb = getCallback(name);
		if (cb != null)
		{
			cb.call(args);
		}
	}
 
	public void setReadyState(int readyState) {
		Log.d(LCAT, "Setting ready state to " + readyState);
		this.readyState = readyState;
 
		fireCallback(ON_READY_STATE_CHANGE);
		if (readyState == READY_STATE_DONE) {
			// Fire onload callback
			fireCallback(ON_LOAD);
		}
	}
 
	public void sendError(String error) {
		Log.i(LCAT, "Sending error " + error);
		fireCallback(ON_ERROR, new Object[] {"\"" + error + "\""});
	}
 
	public String getResponseText()
	{
		if (responseData != null && responseText == null) {
			if (charset == null) {
				charset = HTTP.DEFAULT_CONTENT_CHARSET;
			}
 
			try {
				responseText = new String(responseData.getBytes(), charset);
			} catch (UnsupportedEncodingException e) {
				Log.e(LCAT, "Unable to convert to String using charset: " + charset);
			}
		}
 
		return responseText;
	}
 
	public TiBlob getResponseData()
	{
		return responseData;
	}
 
	public void setResponseText(String responseText) {
		this.responseText = responseText;
	}
 
	public int getStatus() {
		return status;
	}
 
	public  void setStatus(int status) {
		this.status = status;
	}
 
	public  String getStatusText() {
		return statusText;
	}
 
	public  void setStatusText(String statusText) {
		this.statusText = statusText;
	}
 
	public void abort() {
		if (readyState > READY_STATE_UNSENT && readyState < READY_STATE_DONE) {
			if (client != null) {
				if (DBG) {
					Log.d(LCAT, "Calling shutdown on clientConnectionManager");
				}
				aborted = true;
				if(handler != null) {
					handler.client = null;
					if (handler.is != null) {
						try {
							if (handler.entity.isStreaming()) {
								handler.entity.consumeContent();
							}
							handler.is.close();
						} catch (IOException e) {
							Log.i(LCAT, "Force closing HTTP content input stream", e);
						} finally {
							handler.is = null;
						}
					}
				}
				if (client != null) {
					client.getConnectionManager().shutdown();
					client = null;
				}
			}
		}
	}
 
	public String getAllResponseHeaders() {
		String result = "";
		if (readyState >= READY_STATE_HEADERS_RECEIVED)
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
 
	protected HashMap<String,String> headers = new HashMap<String,String>();
	private Uri uri;
	public void setRequestHeader(String header, String value)
	{
		if (readyState == READY_STATE_OPENED) {
			headers.put(header, value);
		} else {
			throw new IllegalStateException("setRequestHeader can only be called before invoking send.");
		}
	}
 
	public String getResponseHeader(String header) {
		String result = "";
 
		if (readyState > READY_STATE_OPENED) {
			Header h = response.getFirstHeader(header);
			if (h != null) {
				result = h.getValue();
			} else {
				if (DBG) {
					Log.w(LCAT, "No value for respose header: " + header);
				}
			}
		} else {
			throw new IllegalStateException("getResponseHeader can only be called when readyState > 1");
		}
 
		return result;
	}
 
	public void open(String method, String url)
	{
		if (DBG) {
			Log.d(LCAT, "open request method=" + method + " url=" + url);
		}
 
		this.method = method;
		uri = Uri.parse(url);
		host = new HttpHost(uri.getHost(), uri.getPort(), uri.getScheme());
		if (uri.getUserInfo() != null) {
			credentials = new UsernamePasswordCredentials(uri.getUserInfo());
		}
		setReadyState(READY_STATE_OPENED);
		setRequestHeader("User-Agent", (String) proxy.getDynamicValue("userAgent"));
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
 
	public void addTitaniumFileAsPostData(String name, Object value) {
		try {
			if (value instanceof TiBaseFile) {
				TiBaseFile baseFile = (TiBaseFile) value;
				InputStreamBody body = new InputStreamBody(baseFile.getInputStream(), name);
				parts.put(name, body);
			} else if (value instanceof TiBlob) {
				TiBlob blob = (TiBlob) value;
				InputStreamBody body = new InputStreamBody(new ByteArrayInputStream(blob.getBytes()), name);
				parts.put(name, body);
			} else {
				if (value != null) {
					Log.e(LCAT, name + " is a " + value.getClass().getSimpleName());
				} else {
					Log.e(LCAT, name + " is null");
				}
			}
		} catch (IOException e) {
			Log.e(LCAT, "Error adding post data ("+name+"): " + e.getMessage());
		}
	}
 
	public void send(Object userData)
		throws MethodNotSupportedException
	{
		// TODO consider using task manager
		final TiHTTPClient me = this;
		if (userData != null)
		{
			if (userData instanceof TiDict) {
				TiDict data = (TiDict)userData;
 
				for (String key : data.keySet()) {
					Object value = data.get(key);
 
					if (method.equals("POST")) {
						if (value instanceof TiBaseFile) {
							addTitaniumFileAsPostData(key, value);
						} else {
							addPostData(key, TiConvert.toString(value));
						}
					} else if (method.equals("GET")) {
						uri = uri.buildUpon().appendQueryParameter(
							key, TiConvert.toString(value)).build();
					}
				}
			} else {
				addStringData(TiConvert.toString(userData));
			}
		}
 
		request = new DefaultHttpRequestFactory().newHttpRequest(method, uri.toString());
 
		clientThread = new Thread(new Runnable(){
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
					handler = new LocalResponseHandler(me);
					client = new DefaultHttpClient();
 
					if (credentials != null) {
						client.getCredentialsProvider().setCredentials(
								new AuthScope(null, -1), credentials);
						credentials = null;
					}
 
					HttpProtocolParams.setUseExpectContinue(client.getParams(), false);
					HttpProtocolParams.setVersion(client.getParams(), HttpVersion.HTTP_1_1);
 
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
					me.setReadyState(READY_STATE_DONE);
				} catch(Exception e) {
					Log.e(LCAT, "HTTP Error: " + e.getMessage(), e);
					me.sendError(e.getMessage());
				}
			}}, "TiHttpClient-" + httpClientThreadCounter.incrementAndGet());
		clientThread.setPriority(Thread.MIN_PRIORITY);
 
		clientThread.start();
 
		if (DBG) {
			Log.d(LCAT, "Leaving send()");
		}
	}
}

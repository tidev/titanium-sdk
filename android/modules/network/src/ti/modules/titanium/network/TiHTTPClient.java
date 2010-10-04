/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.network;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FilterOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
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
import org.apache.http.conn.scheme.PlainSocketFactory;
import org.apache.http.conn.scheme.Scheme;
import org.apache.http.conn.scheme.SchemeRegistry;
import org.apache.http.conn.scheme.SocketFactory;
import org.apache.http.conn.ssl.SSLSocketFactory;
import org.apache.http.entity.AbstractHttpEntity;
import org.apache.http.entity.StringEntity;
import org.apache.http.entity.mime.MultipartEntity;
import org.apache.http.entity.mime.content.ContentBody;
import org.apache.http.entity.mime.content.FileBody;
import org.apache.http.entity.mime.content.StringBody;
import org.apache.http.impl.DefaultHttpRequestFactory;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.impl.conn.tsccm.ThreadSafeClientConnManager;
import org.apache.http.message.BasicHttpEntityEnclosingRequest;
import org.apache.http.message.BasicNameValuePair;
import org.apache.http.params.BasicHttpParams;
import org.apache.http.params.HttpConnectionParams;
import org.apache.http.params.HttpParams;
import org.apache.http.params.HttpProtocolParams;
import org.apache.http.protocol.HTTP;
import org.apache.http.util.EntityUtils;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiMimeTypeHelper;

import ti.modules.titanium.xml.DocumentProxy;
import ti.modules.titanium.xml.XMLModule;
import android.net.Uri;

public class TiHTTPClient
{
	private static final String LCAT = "TiHttpClient";
	private static final boolean DBG = TiConfig.LOGD;
	private static final int IS_BINARY_THRESHOLD = 30;

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
	private static final String ON_SEND_STREAM = "onsendstream";

	private TiProxy proxy;
	private int readyState;
	private String responseText;
	private DocumentProxy responseXml;
	private int status;
	private String statusText;
	private boolean connected;

	private HttpRequest request;
	private HttpResponse response;
	private String method;
	private HttpHost host;
	private DefaultHttpClient client;
	private LocalResponseHandler handler;
	private Credentials credentials;

	private TiBlob responseData;
	private String charset;
	private String contentType;

	private ArrayList<NameValuePair> nvPairs;
	private HashMap<String, ContentBody> parts;
	private String data;
	private boolean needMultipart;
	
	Thread clientThread;
	private boolean aborted;
	private int timeout = -1;
	
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
			connected = true;
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
				if (entity.getContentType() != null) {
					contentType = entity.getContentType().getValue();
				}
				KrollCallback onDataStreamCallback = c.getCallback(ON_DATA_STREAM);
				if (onDataStreamCallback != null) {
					is = entity.getContent();
					charset = EntityUtils.getContentCharSet(entity);

					responseData = null;

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
								totalSize += count;
								TiDict o = new TiDict();
								o.put("totalCount", contentLength);
								o.put("totalSize", totalSize);
								o.put("size", count);

								byte[] newbuf = new byte[count];
								System.arraycopy(buf, 0, newbuf, 0, count);
								if (responseData == null) {
									responseData = TiBlob.blobFromData(proxy.getTiContext(), newbuf, contentType);
								} else {
									responseData.append(TiBlob.blobFromData(proxy.getTiContext(), newbuf));
								}

								TiBlob blob = TiBlob.blobFromData(proxy.getTiContext(), newbuf);
								o.put("blob", blob);
								o.put("progress", ((double)totalSize)/((double)contentLength));

								cb.callWithProperties(o);
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

	private interface ProgressListener {
		public void progress(int progress);
	}

	private class ProgressEntity implements HttpEntity
	{
		private HttpEntity delegate;
		private ProgressListener listener;
		public ProgressEntity(HttpEntity delegate, ProgressListener listener)
		{
			this.delegate = delegate;
			this.listener = listener;
		}

		public void consumeContent() throws IOException {
			delegate.consumeContent();
		}

		public InputStream getContent() throws IOException,
				IllegalStateException {
			return delegate.getContent();
		}

		public Header getContentEncoding() {
			return delegate.getContentEncoding();
		}

		public long getContentLength() {
			return delegate.getContentLength();
		}

		public Header getContentType() {
			return delegate.getContentType();
		}

		public boolean isChunked() {
			return delegate.isChunked();
		}

		public boolean isRepeatable() {
			return delegate.isRepeatable();
		}

		public boolean isStreaming() {
			return delegate.isStreaming();
		}

		public void writeTo(OutputStream stream) throws IOException {
			OutputStream progressOut = new ProgressOutputStream(stream, listener);
			delegate.writeTo(progressOut);
		}
	}

	private class ProgressOutputStream extends FilterOutputStream
	{
		private ProgressListener listener;
		private int transferred = 0, lastTransferred = 0;

		public ProgressOutputStream(OutputStream delegate, ProgressListener listener)
		{
			super(delegate);
			this.listener = listener;
		}

		private void fireProgress() {
			// filter to 512 bytes of granularity
			if (transferred - lastTransferred >= 512) {
				lastTransferred = transferred;
				new Thread(new Runnable() {
					public void run() {
						proxy.getTiContext().getActivity().runOnUiThread(new Runnable() {
							public void run() {
								listener.progress(transferred);
							}
						});
					}
				}).start();
			}
		}

		@Override
		public void write(byte[] b, int off, int len) throws IOException {
			super.write(b, off, len);
			transferred += len;
			fireProgress();
		}

		@Override
		public void write(int b) throws IOException {
			super.write(b);
			transferred++;
			fireProgress();
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
		connected = false;
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

	public boolean validatesSecureCertificate() {
		if (proxy.hasDynamicValue("validatesSecureCertificate")) {
			return TiConvert.toBoolean(proxy.getDynamicValue("validatesSecureCertificate"));
		} else {
			if (proxy.getTiContext().getTiApp().getDeployType().equals(
					TiApplication.DEPLOY_TYPE_PRODUCTION)) {
				return true;
			}
		}
		return false;
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
		TiDict event = new TiDict();
		event.put("error", error);
		event.put("source", proxy);
		fireCallback(ON_ERROR, new Object[] {event});
	}

	public String getResponseText()
	{
		if (responseData != null && responseText == null)
		{
			byte[] data = responseData.getBytes();
			if (charset == null) {
				// Detect binary
				int binaryCount = 0;
				int len = data.length;

				if (len > 0) {
					for (int i = 0; i < len; i++) {
						byte b = data[i];
						if (b < 32 || b > 127 ) {
							if (b != '\n' && b != '\r' && b != '\t' && b != '\b') {
								binaryCount++;
							}
						}
					}

					if ((binaryCount * 100)/len >= IS_BINARY_THRESHOLD) {
						return null;
					}
				}

				charset = HTTP.DEFAULT_CONTENT_CHARSET;
			}

			try {
				responseText = new String(data, charset);
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

	public DocumentProxy getResponseXML()
	{
		// avoid eating up tons of memory if we have a large binary data blob
		if (TiMimeTypeHelper.isBinaryMimeType(contentType))
		{
			return null;
		}
		if (responseXml == null && (responseData != null || responseText != null)) {
			try {
				String text = getResponseText();
				if (charset != null && charset.length() > 0) {
					responseXml = XMLModule.parse(proxy.getTiContext(), text, charset);
				} else {
					responseXml = XMLModule.parse(proxy.getTiContext(), text);
				}
			} catch (Exception e) {
				Log.e(LCAT, "Error parsing XML", e);
			}
		}

		return responseXml;
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
	private String url;
	
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

	private Uri getCleanUri(String uri)
    {
    	Uri base = Uri.parse(uri);
    	
    	Uri.Builder builder = base.buildUpon();
		builder.encodedQuery(Uri.encode(Uri.decode(base.getQuery()), "&="));
    	builder.encodedAuthority(Uri.encode(Uri.decode(base.getAuthority()),"/:@"));
    	builder.encodedPath(Uri.encode(Uri.decode(base.getPath()), "/"));
    	
    	return builder.build();
    }
	
	public void open(String method, String url)
	{
		if (DBG) {
			Log.d(LCAT, "open request method=" + method + " url=" + url);
		}
		this.uri = getCleanUri(url);
		
		// If the original url does not contained any
		// escaped query string (i.e., does not look
		// pre-encoded), go ahead and reset it to the 
		// clean uri. Else keep it as is so the user's
		// escaping stays in effect.  The users are on their own
		// at that point.
		if (!url.matches(".*\\?.*\\%\\d\\d.*$")) {
			this.url = this.uri.toString();
		} else {
			this.url = url;
		}

		this.method = method;
		
		host = new HttpHost(uri.getHost(), uri.getPort(), uri.getScheme());
		if (uri.getUserInfo() != null) {
			credentials = new UsernamePasswordCredentials(uri.getUserInfo());
		}
		setReadyState(READY_STATE_OPENED);
		setRequestHeader("User-Agent", (String) proxy.getDynamicValue("userAgent"));
		// Causes Auth to Fail with twitter and other size apparently block X- as well
		// Ticket #729, ignore twitter for now
		if (!uri.getHost().contains("twitter.com")) {
			setRequestHeader("X-Requested-With","XMLHttpRequest");
		} else {
			Log.i(LCAT, "Twitter: not sending X-Requested-With header");
		}
	}

	public void addStringData(String data) {
		this.data = data;
	}

	public void addPostData(String name, String value) {
		if (value == null) {
			value = "";
		}
		try {
			if (needMultipart) {
				parts.put(name, new StringBody(value));
			} else {
				nvPairs.add(new BasicNameValuePair(name, value.toString()));
			}
		} catch (UnsupportedEncodingException e) {
			nvPairs.add(new BasicNameValuePair(name, value.toString()));
		}
	}

	public int addTitaniumFileAsPostData(String name, Object value) {
		try {
			if (value instanceof TiBaseFile) {
				TiBaseFile baseFile = (TiBaseFile) value;
				FileBody body = new FileBody(baseFile.getNativeFile(), TiMimeTypeHelper.getMimeType(baseFile.nativePath()));
				parts.put(name, body);
				return (int)baseFile.getNativeFile().length();
			} else if (value instanceof TiBlob) {
				TiBlob blob = (TiBlob) value;
				String mimeType = blob.getMimeType();
				File tmpFile = File.createTempFile("tixhr", TiMimeTypeHelper.getFileExtensionFromMimeType(mimeType, ".txt"));
				FileOutputStream fos = new FileOutputStream(tmpFile);
				fos.write(blob.getBytes());
				fos.close();
				
				FileBody body = new FileBody(tmpFile, mimeType);
				parts.put(name, body);
				return blob.getLength();
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
		return 0;
	}

	public void send(Object userData)
		throws MethodNotSupportedException
	{
		// TODO consider using task manager
		final TiHTTPClient me = this;
		double totalLength = 0;
		needMultipart = false;
		
		if (userData != null)
		{
			if (userData instanceof TiDict) {
				TiDict data = (TiDict)userData;
				
				// first time through check if we need multipart for POST
				for (String key : data.keySet()) {
					Object value = data.get(key);
					if (value instanceof TiBaseFile || value instanceof TiBlob) {
						needMultipart = true;
					}
				}
				
				boolean queryStringAltered = false;
				for (String key : data.keySet()) {
					Object value = data.get(key);

					if (method.equals("POST") || method.equals("PUT")) {
						if (value instanceof TiBaseFile || value instanceof TiBlob) {
							totalLength += addTitaniumFileAsPostData(key, value);
						} else {
							String str = TiConvert.toString(value);
							addPostData(key, str);
							totalLength += str.length();
						}
					} else if (method.equals("GET")) {
						uri = uri.buildUpon().appendQueryParameter(
							key, TiConvert.toString(value)).build();
						queryStringAltered = true;
					}
				}
				if (queryStringAltered) {
					this.url = uri.toString();
				}
			} else {
				addStringData(TiConvert.toString(userData));
			}
		}

		request = new DefaultHttpRequestFactory().newHttpRequest(method, this.url);
		for (String header : headers.keySet()) {
			request.setHeader(header, headers.get(header));
		}
		
		clientThread = new Thread(new ClientRunnable(totalLength), "TiHttpClient-" + httpClientThreadCounter.incrementAndGet());
		clientThread.setPriority(Thread.MIN_PRIORITY);
		clientThread.start();
		if (DBG) {
			Log.d(LCAT, "Leaving send()");
		}
	}
	
	private class ClientRunnable implements Runnable {
		private double totalLength;
		public ClientRunnable(double totalLength) {
			this.totalLength = totalLength;
		}
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
				handler = new LocalResponseHandler(TiHTTPClient.this);
				SchemeRegistry registry = new SchemeRegistry();
				registry.register(new Scheme("http", PlainSocketFactory.getSocketFactory(), 80));
				SocketFactory sslFactory;
				if (validatesSecureCertificate()) {
					sslFactory = SSLSocketFactory.getSocketFactory();
				} else {
					sslFactory = new NonValidatingSSLSocketFactory();
				}
				registry.register(new Scheme("https", sslFactory, 443));
				HttpParams params = new BasicHttpParams();
				
				if (timeout != -1) {
					HttpConnectionParams.setConnectionTimeout(params, timeout);
					HttpConnectionParams.setSoTimeout(params, timeout);
				}
				
				
				ThreadSafeClientConnManager manager = new ThreadSafeClientConnManager(params, registry);
				client = new DefaultHttpClient(manager, params);
				
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

					if(parts.size() > 0 && needMultipart) {
						mpe = new MultipartEntity();
						for(String name : parts.keySet()) {
							Log.d(LCAT, "adding part " + name + ", part type: " + parts.get(name).getMimeType() + ", len: " + parts.get(name).getContentLength());
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
						Log.d(LCAT, "totalLength="+totalLength);

						/*ProgressEntity progressEntity = new ProgressEntity(mpe, new ProgressListener() {
							public void progress(int progress) {
								KrollCallback cb = getCallback(ON_SEND_STREAM);
								if (cb != null) {
									TiDict data = new TiDict();
									data.put("progress", ((double)progress)/fTotalLength);
									data.put("source", proxy);
									cb.callWithProperties(data);
								}
							}
						});*/
						//e.setEntity(progressEntity);

						e.setEntity(mpe);
						e.addHeader("Length", totalLength+"");
					} else {
						handleURLEncodedData(form);
					}
				}
				if (DBG) {
					Log.d(LCAT, "Preparing to execute request");
				}
				String result = client.execute(host, request, handler);
				if(result != null) {
					Log.d(LCAT, "Have result back from request len=" + result.length());
				}
				connected = false;
				setResponseText(result);
				setReadyState(READY_STATE_DONE);
			} catch(Throwable t) {
				Log.e(LCAT, "HTTP Error (" + t.getClass().getName() + "): " + t.getMessage(), t);
				sendError(t.getMessage());
			}
		}
	}
	
	private void handleURLEncodedData(UrlEncodedFormEntity form) {
		AbstractHttpEntity entity = null;
		if (data != null) {
			try
			{
				entity = new StringEntity(data, "UTF-8");
			}
			catch(Exception ex)
			{
				//FIXME
				Log.e(LCAT, "Exception, implement recovery: ", ex);
			}
		} else {
			entity = form;
		}
		
		Header header = request.getFirstHeader("Content-Type");
		if(header == null) {
			entity.setContentType("application/x-www-form-urlencoded");
		} else {
			entity.setContentType(header.getValue());
		}
		
		HttpEntityEnclosingRequest e = (HttpEntityEnclosingRequest)request;
		e.setEntity(entity);
	}
	
	public String getLocation() {
		return url;
	}

	public String getConnectionType() {
		return method;
	}

	public boolean isConnected() {
		return connected;
	}
	
	public void setTimeout(int millis) {
		timeout = millis;
	}
}

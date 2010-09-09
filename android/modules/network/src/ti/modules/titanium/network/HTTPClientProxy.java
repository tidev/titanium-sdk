/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.network;

import org.apache.http.MethodNotSupportedException;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;

import ti.modules.titanium.xml.DocumentProxy;

@Kroll.proxy(creatableInModule=NetworkModule.class)
public class HTTPClientProxy extends KrollProxy {
	
	@Kroll.constant public static final int UNSENT = TiHTTPClient.READY_STATE_UNSENT;
	@Kroll.constant public static final int OPENED = TiHTTPClient.READY_STATE_OPENED;
	@Kroll.constant public static final int HEADERS_RECEIVED = TiHTTPClient.READY_STATE_HEADERS_RECEIVED;
	@Kroll.constant public static final int LOADING = TiHTTPClient.READY_STATE_LOADING;
	@Kroll.constant public static final int DONE = TiHTTPClient.READY_STATE_DONE;
	
	private TiHTTPClient client;
	public HTTPClientProxy(TiContext context)
	{
		super(context);
		this.client = new TiHTTPClient(this);
	}
	
	@Kroll.method
	public void abort() {
		client.abort();
	}

	@Kroll.getProperty @Kroll.method
	public String getAllResponseHeaders() {
		return client.getAllResponseHeaders();
	}

	@Kroll.getProperty @Kroll.method
	public int getReadyState() {
		return client.getReadyState();
	}

	@Kroll.getProperty @Kroll.method
	public TiBlob getResponseData() {
		return client.getResponseData();
	}

	@Kroll.method
	public String getResponseHeader(String header) {
		return client.getResponseHeader(header);
	}

	@Kroll.getProperty @Kroll.method
	public String getResponseText() {
		return client.getResponseText();
	}
	
	@Kroll.getProperty @Kroll.method
	public DocumentProxy getResponseXML() {
		return client.getResponseXML();
	}

	@Kroll.getProperty @Kroll.method
	public int getStatus() {
		return client.getStatus();
	}

	@Kroll.getProperty @Kroll.method
	public String getStatusText() {
		return client.getStatusText();
	}

	@Kroll.method
	public void open(String method, String url)
	{
		client.open(method, url);
	}

	@Kroll.method
	public void send(Object data) 
		throws MethodNotSupportedException
	{
		client.send(data);
	}

	@Kroll.method
	public void setRequestHeader(String header, String value) {
		client.setRequestHeader(header, value);
	}
	
	@Kroll.getProperty @Kroll.method
	public String getLocation() {
		return client.getLocation();
	}

	@Kroll.getProperty @Kroll.method
	public String getConnectionType() {
		return client.getConnectionType();
	}
	
	@Kroll.getProperty @Kroll.method
	public boolean getConnected() {
		return client.isConnected();
	}
}

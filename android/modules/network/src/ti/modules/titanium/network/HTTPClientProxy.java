/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.network;

import org.apache.http.MethodNotSupportedException;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;

import ti.modules.titanium.xml.DocumentProxy;

public class HTTPClientProxy extends KrollProxy {
	
	public static KrollDict constants;
	
	private TiHTTPClient client;
	public HTTPClientProxy(TiContext context, Object[] args)
	{
		super(context);
		
		this.client = new TiHTTPClient(this);
	}
	
	@Override
	public KrollDict getConstants() {
		if (constants == null) {
			constants = new KrollDict();
			constants.put("UNSENT", TiHTTPClient.READY_STATE_UNSENT);
			constants.put("OPENED", TiHTTPClient.READY_STATE_OPENED);
			constants.put("HEADERS_RECEIVED", TiHTTPClient.READY_STATE_HEADERS_RECEIVED);
			constants.put("LOADING", TiHTTPClient.READY_STATE_LOADING);
			constants.put("DONE", TiHTTPClient.READY_STATE_DONE);
		}
		return constants;
	}

	public void abort() {
		client.abort();
	}

	public String getAllResponseHeaders() {
		return client.getAllResponseHeaders();
	}

	public int getReadyState() {
		return client.getReadyState();
	}

	public TiBlob getResponseData() {
		return client.getResponseData();
	}

	public String getResponseHeader(String header) {
		return client.getResponseHeader(header);
	}

	public String getResponseText() {
		return client.getResponseText();
	}
	
	public DocumentProxy getResponseXML() {
		return client.getResponseXML();
	}

	public int getStatus() {
		return client.getStatus();
	}

	public String getStatusText() {
		return client.getStatusText();
	}

	public void open(String method, String url)
	{
		client.open(method, url);
	}

	public void send(Object data) 
		throws MethodNotSupportedException
	{
		client.send(data);
	}

	public void setRequestHeader(String header, String value) {
		client.setRequestHeader(header, value);
	}
	
	public String getLocation() {
		return client.getLocation();
	}

	public String getConnectionType() {
		return client.getConnectionType();
	}
	
	public boolean getConnected() {
		return client.isConnected();
	}
}

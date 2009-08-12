/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.api;

import org.apache.http.MethodNotSupportedException;

public interface ITitaniumHttpClient {

	public static final int READY_STATE_UNINITIALIZED = 0; // Uninitialized, open() has not yet been called
	public static final int READY_STATE_LOADING = 1; // Loading, send() has not yet been called
	public static final int READY_STATE_LOADED = 2; // Loaded, headers have returned and the status is available
	public static final int READY_STATE_INTERACTIVE = 3; // Interactive, responseText is being loaded with data
	public static final int READY_STATE_COMPLETE = 4; // Complete, all operations have finished

	public String getOnReadyStateChangeCallback();

	public void setOnReadyStateChangeCallback(
			String onReadyStateChangeCallback);

	public int getReadyState();

	public void setReadyState(int readyState);

	public String getResponseText();

	public void setResponseText(String responseText);

	public int getStatus();

	public void setStatus(int status);

	public String getStatusText();

	public void setStatusText(String statusText);

	public void abort();

	public String getAllResponseHeaders();

	public void setRequestHeader(String header, String value);

	public String getResponseHeader(String header);

	public void open(String method, String url)
			throws MethodNotSupportedException;

	public void send();

	// Internal method

	public void addPostData(String name, String value);
	public void addTitaniumFileAsPostData(String name, ITitaniumFile value);
	public void addStringData(String data);
}
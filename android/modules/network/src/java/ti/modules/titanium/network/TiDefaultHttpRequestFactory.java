/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.network;

import org.apache.http.HttpRequest;
import org.apache.http.impl.DefaultHttpRequestFactory;
import org.apache.http.MethodNotSupportedException;
import org.apache.http.RequestLine;
import org.apache.http.message.BasicHttpEntityEnclosingRequest;
import org.apache.http.message.BasicHttpRequest;


public class TiDefaultHttpRequestFactory extends DefaultHttpRequestFactory {

	private static final String  PATCH_METHOD = "PATCH";


	public TiDefaultHttpRequestFactory() {
		super();
	}

	@Override
	public HttpRequest newHttpRequest(final RequestLine requestline)
			throws MethodNotSupportedException {

		if (requestline == null) {
			throw new IllegalArgumentException("Request line may not be null");
		}
		
		String method = requestline.getMethod();


		if (PATCH_METHOD.equalsIgnoreCase(method)){
			return new BasicHttpEntityEnclosingRequest(requestline);
		}

		return super.newHttpRequest(requestline);
	}

	@Override
	public HttpRequest newHttpRequest(final String method, final String uri)
			throws MethodNotSupportedException {

		if (PATCH_METHOD.equalsIgnoreCase(method)){
			return new BasicHttpEntityEnclosingRequest(method, uri);
		}

		return super.newHttpRequest(method, uri);
	}

}

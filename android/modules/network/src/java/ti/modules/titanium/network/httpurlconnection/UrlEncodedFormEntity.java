/*
 * ====================================================================
 *
 *  Licensed to the Apache Software Foundation (ASF) under one or more
 *  contributor license agreements.  See the NOTICE file distributed with
 *  this work for additional information regarding copyright ownership.
 *  The ASF licenses this file to You under the Apache License, Version 2.0
 *  (the "License"); you may not use this file except in compliance with
 *  the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 * ====================================================================
 *
 * This software consists of voluntary contributions made by many
 * individuals on behalf of the Apache Software Foundation.  For more
 * information on the Apache Software Foundation, please see
 * <http://www.apache.org/>.
 *
 */
// org.apache.http.client.entity.UrlEncodedFormEntity
/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.network.httpurlconnection;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.util.List;

public class UrlEncodedFormEntity extends Entity {

	protected final byte[] content;

	public UrlEncodedFormEntity(final List<? extends NameValuePair> parameters, final String encoding) throws UnsupportedEncodingException {
		this(HttpUrlConnectionUtils.format(parameters, encoding), encoding);
		setContentType(HttpUrlConnectionUtils.CONTENT_TYPE_X_WWW_FORM_URLENCODED + HttpUrlConnectionUtils.CHARSET_PARAM
				+ (encoding != null ? encoding : HttpUrlConnectionUtils.DEFAULT_CONTENT_CHARSET));
	}

	public UrlEncodedFormEntity(final List<? extends NameValuePair> parameters) throws UnsupportedEncodingException {
		this(parameters, HttpUrlConnectionUtils.DEFAULT_CONTENT_CHARSET);
	}

	public UrlEncodedFormEntity(final String s, String charset) throws UnsupportedEncodingException {
		super();
		if (s == null) {
			throw new IllegalArgumentException("Source string may not be null");
		}
		if (charset == null) {
			charset = HttpUrlConnectionUtils.DEFAULT_CONTENT_CHARSET;
		}
		this.content = s.getBytes(charset);
		setContentType(HttpUrlConnectionUtils.PLAIN_TEXT_TYPE + HttpUrlConnectionUtils.CHARSET_PARAM + charset);
	}

	public UrlEncodedFormEntity(final String s) throws UnsupportedEncodingException {
		this(s, null);
	}

	public long getContentLength() {
		return this.content.length;
	}

	public InputStream getContent() throws IOException {
		return new ByteArrayInputStream(this.content);
	}

	public void writeTo(final OutputStream outstream) throws IOException {
		if (outstream == null) {
			throw new IllegalArgumentException("Output stream may not be null");
		}
		outstream.write(this.content);
		outstream.flush();
	}

}

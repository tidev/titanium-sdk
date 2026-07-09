/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 * 
 * Copied and modified from Apache's HTTPClient implementation (APL2 license):
 * org.apache.http.client.entity.UrlEncodedFormEntity
 */
package ti.modules.titanium.network.httpurlconnection;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.util.List;

public class UrlEncodedFormEntity extends Entity
{

	protected final byte[] content;

	public UrlEncodedFormEntity(final List<? extends NameValuePair> parameters, final String encoding)
		throws UnsupportedEncodingException
	{
		this(HttpUrlConnectionUtils.format(parameters, encoding), encoding);
		setContentType(HttpUrlConnectionUtils.CONTENT_TYPE_X_WWW_FORM_URLENCODED + HttpUrlConnectionUtils.CHARSET_PARAM
					   + (encoding != null ? encoding : HttpUrlConnectionUtils.DEFAULT_CONTENT_CHARSET));
	}

	public UrlEncodedFormEntity(final List<? extends NameValuePair> parameters) throws UnsupportedEncodingException
	{
		this(parameters, HttpUrlConnectionUtils.DEFAULT_CONTENT_CHARSET);
	}

	public UrlEncodedFormEntity(final String s, String charset) throws UnsupportedEncodingException
	{
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

	public UrlEncodedFormEntity(final String s) throws UnsupportedEncodingException
	{
		this(s, null);
	}

	public long getContentLength()
	{
		return this.content.length;
	}

	public InputStream getContent() throws IOException
	{
		return new ByteArrayInputStream(this.content);
	}

	public void writeTo(final OutputStream outstream) throws IOException
	{
		if (outstream == null) {
			throw new IllegalArgumentException("Output stream may not be null");
		}
		outstream.write(this.content);
		outstream.flush();
	}
}

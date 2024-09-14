/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 * 
 * Copied and modified from Apache's HTTPClient implementation (APL2 license):
 * org.apache.http.entity.StringEntity
 */

package ti.modules.titanium.network.httpurlconnection;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;

public class StringEntity extends Entity
{

	protected final byte[] content;

	public StringEntity(final String s, String mimeType, String charset) throws UnsupportedEncodingException
	{
		super();
		if (s == null) {
			throw new IllegalArgumentException("Source string may not be null");
		}
		if (mimeType == null) {
			mimeType = HttpUrlConnectionUtils.PLAIN_TEXT_TYPE;
		}
		if (charset == null) {
			charset = HttpUrlConnectionUtils.DEFAULT_CONTENT_CHARSET;
		}
		this.content = s.getBytes(charset);
		setContentType(mimeType + HttpUrlConnectionUtils.CHARSET_PARAM + charset);
	}

	public StringEntity(final String s, String charset) throws UnsupportedEncodingException
	{
		this(s, null, charset);
	}

	public StringEntity(final String s) throws UnsupportedEncodingException
	{
		this(s, null);
	}

	public boolean isRepeatable()
	{
		return true;
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

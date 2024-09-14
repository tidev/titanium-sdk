/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 * 
 * Copied and modified from Apache's HTTPClient implementation (APL2 license):
 * org.apache.http.entity.mime.content.StringBody
 */
package ti.modules.titanium.network.httpurlconnection;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.Reader;
import java.io.UnsupportedEncodingException;
import java.nio.charset.Charset;
import java.util.HashMap;
import java.util.Map;

public class StringBody extends AbstractContentBody
{

	private final byte[] content;
	private final Charset charset;

	public StringBody(final String text, final String mimeType, Charset charset) throws UnsupportedEncodingException
	{
		super(mimeType);
		if (text == null) {
			throw new IllegalArgumentException("Text may not be null");
		}
		if (charset == null) {
			charset = Charset.defaultCharset();
		}
		this.content = text.getBytes(charset.name());
		this.charset = charset;
	}

	public StringBody(final String text, Charset charset) throws UnsupportedEncodingException
	{
		this(text, "text/plain", charset);
	}

	public StringBody(final String text) throws UnsupportedEncodingException
	{
		this(text, "text/plain", null);
	}

	public Reader getReader()
	{
		return new InputStreamReader(new ByteArrayInputStream(this.content), this.charset);
	}

	@Override
	public void writeTo(final OutputStream out) throws IOException
	{
		if (out == null) {
			throw new IllegalArgumentException("Output stream may not be null");
		}
		InputStream in = new ByteArrayInputStream(this.content);
		byte[] tmp = new byte[4096];
		int l;
		while ((l = in.read(tmp)) != -1) {
			out.write(tmp, 0, l);
		}
		out.flush();
	}

	public String getTransferEncoding()
	{
		return "8bit";
	}

	public String getCharset()
	{
		return this.charset.name();
	}

	@Override
	public Map<String, String> getContentTypeParameters()
	{
		Map<String, String> map = new HashMap<String, String>();
		map.put("charset", this.charset.name());
		return map;
	}

	public long getContentLength()
	{
		return this.content.length;
	}

	@Override
	public String getFilename()
	{
		return null;
	}
}

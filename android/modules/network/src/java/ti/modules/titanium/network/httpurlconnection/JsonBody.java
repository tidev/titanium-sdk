/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.network.httpurlconnection;

import java.io.IOException;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;

import org.json.JSONObject;

public class JsonBody extends AbstractContentBody
{

	private static final String CONTENT_TYPE = "application/json";

	private String filename;
	private String value;
	private byte[] data;

	public JsonBody(JSONObject jsonObject, String filename)
	{
		super(CONTENT_TYPE);
		this.value = jsonObject.toString();
		this.filename = filename;
		try {
			this.data = value.getBytes(HttpUrlConnectionUtils.UTF_8);
		} catch (UnsupportedEncodingException e) {
			this.data = value.getBytes();
		}
	}

	@Override
	public String getFilename()
	{
		return filename;
	}

	@Override
	public String getCharset()
	{
		return HttpUrlConnectionUtils.UTF_8;
	}

	@Override
	public long getContentLength()
	{
		return data.length;
	}

	@Override
	public String getTransferEncoding()
	{
		return "8bit";
	}

	@Override
	public void writeTo(OutputStream out) throws IOException
	{
		out.write(data);
		out.flush();
	}
}

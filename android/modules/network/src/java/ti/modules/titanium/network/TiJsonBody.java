/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.network;

import java.io.IOException;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;

import org.apache.http.entity.mime.MIME;
import org.apache.http.entity.mime.content.AbstractContentBody;
import org.apache.http.protocol.HTTP;
import org.apache.james.mime4j.MimeException;
import org.json.JSONObject;

public class TiJsonBody extends AbstractContentBody {

	private static final String CONTENT_TYPE = "application/json";

	private String filename;
	private String value;
	private byte[] data;

	public TiJsonBody(JSONObject jsonObject, String filename) {
		super(CONTENT_TYPE);
		this.value = jsonObject.toString();
		this.filename = filename;
		try {
			this.data = value.getBytes(HTTP.UTF_8);
		} catch (UnsupportedEncodingException e) {
			this.data = value.getBytes();
		}
	}

	@Override
	public String getFilename() {
		return filename;
	}

	@Override
	public void writeTo(OutputStream out, int mode) throws IOException,
	MimeException {
		out.write(data);
		out.flush();
	}

	@Override
	public String getCharset() {
		return HTTP.UTF_8;
	}

	@Override
	public long getContentLength() {
		return data.length;
	}

	@Override
	public String getTransferEncoding() {
		return MIME.ENC_8BIT;
	}
}

/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 * 
 * Copied and modified from Apache's HTTPClient implementation (APL2 license):
 * org.apache.http.entity.FileEntity
 */
package ti.modules.titanium.network.httpurlconnection;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public class FileEntity extends Entity
{
	protected final File file;

	public FileEntity(final File file, final String contentType)
	{
		super();
		if (file == null) {
			throw new IllegalArgumentException("File may not be null");
		}
		this.file = file;
		setContentType(contentType);
	}

	public boolean isRepeatable()
	{
		return true;
	}

	public long getContentLength()
	{
		return this.file.length();
	}

	public InputStream getContent() throws IOException
	{
		return new FileInputStream(this.file);
	}

	public void writeTo(final OutputStream outstream) throws IOException
	{
		if (outstream == null) {
			throw new IllegalArgumentException("Output stream may not be null");
		}
		InputStream instream = new FileInputStream(this.file);
		try {
			byte[] tmp = new byte[4096];
			int l;
			while ((l = instream.read(tmp)) != -1) {
				outstream.write(tmp, 0, l);
			}
			outstream.flush();
		} finally {
			instream.close();
		}
	}

	public boolean isStreaming()
	{
		return false;
	}
}

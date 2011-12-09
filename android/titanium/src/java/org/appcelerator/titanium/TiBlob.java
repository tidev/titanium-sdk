/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;

import org.apache.commons.codec.binary.Base64;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.kroll.util.KrollStreamHelper;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.util.TiMimeTypeHelper;

import android.graphics.Bitmap;
import android.graphics.Bitmap.CompressFormat;

@Kroll.proxy
public class TiBlob extends KrollProxy
{
	private static final String LCAT = "TiBlob";
	private static final boolean DBG = TiConfig.LOGD;

	public static final int TYPE_IMAGE = 0;
	public static final int TYPE_FILE = 1;
	public static final int TYPE_DATA = 2;
	public static final int TYPE_STRING = 3;

	private int type;
	private Object data;
	private String mimetype;
	private int width, height;

	private TiBlob(int type, Object data, String mimetype)
	{
		super();
		this.type = type;
		this.data = data;
		this.mimetype = mimetype;
		this.width = 0;
		this.height = 0;
	}

	public static TiBlob blobFromString(String data)
	{
		return new TiBlob(TYPE_STRING, data, "text/plain");
	}

	public static TiBlob blobFromFile(TiBaseFile file)
	{
		return blobFromFile(file, TiMimeTypeHelper.getMimeType(file.nativePath()));
	}

	public static TiBlob blobFromFile(TiBaseFile file, String mimeType)
	{
		if (mimeType == null) {
			mimeType = TiMimeTypeHelper.getMimeType(file.nativePath());
		}
		return new TiBlob(TYPE_FILE, file, mimeType);
	}

	public static TiBlob blobFromImage(Bitmap image)
	{
		ByteArrayOutputStream bos = new ByteArrayOutputStream();
		byte data[] = new byte[0];
		if (image.compress(CompressFormat.PNG, 100, bos)) {
			data = bos.toByteArray();
		}

		TiBlob blob = new TiBlob(TYPE_IMAGE, data, "image/bitmap");
		blob.width = image.getWidth();
		blob.height = image.getHeight();
		return blob;
	}

	public static TiBlob blobFromData(byte[] data)
	{
		return blobFromData(data, "application/octet-stream");
	}

	public static TiBlob blobFromData(byte[] data, String mimetype)
	{
		if (mimetype == null || mimetype.length() == 0) {
			return new TiBlob(TYPE_DATA, data, "application/octet-stream");
		}
		return new TiBlob(TYPE_DATA, data, mimetype);
	}

	public byte[] getBytes()
	{
		byte[] bytes = new byte[0];

		switch(type) {
			case TYPE_STRING :
				try {
					bytes = ((String) data).getBytes("utf-8");
				} catch (UnsupportedEncodingException e) {
					Log.w(LCAT, e.getMessage(), e);
				}
				break;
			case TYPE_DATA:
			case TYPE_IMAGE:
				//TODO deal with mimetypes.
				bytes = (byte[]) data;
				break;
			case TYPE_FILE:	
				InputStream stream = getInputStream();
				if (stream != null) {
					try {
						bytes = KrollStreamHelper.toByteArray(stream, getLength());
					} finally {
						try {
							stream.close();
						} catch (IOException e) {
							Log.w(LCAT, e.getMessage(), e);
						}
					}
				}
				break;
			default :
				throw new IllegalArgumentException("Unknown Blob type id " + type);
		}

		return bytes;
	}

	@Kroll.getProperty @Kroll.method
	public int getLength()
	{
		switch (type) {
			case TYPE_FILE:
				return (int) ((TiBaseFile)data).size();
			case TYPE_DATA:
			case TYPE_IMAGE:
				return ((byte[])data).length;
			default:
				// this is probably overly expensive.. is there a better way?
				return getBytes().length;
		}
	}

	public InputStream getInputStream()
	{
		switch (type) {
			case TYPE_FILE:
			try {
				return ((TiBaseFile)data).getInputStream();
			} catch (IOException e) {
				Log.e(LCAT, e.getMessage(), e);
				return null;
			}
			default:
				return new ByteArrayInputStream(getBytes());
		}
	}

	@Kroll.method
	public void append(TiBlob blob)
	{
		switch(type) {
			case TYPE_STRING :
				try {
					String dataString = (String)data;
					dataString += new String(blob.getBytes(), "utf-8");
				} catch (UnsupportedEncodingException e) {
					Log.w(LCAT, e.getMessage(), e);
				}
				break;
			case TYPE_IMAGE:
			case TYPE_DATA :
				byte[] dataBytes = (byte[]) data;
				byte[] appendBytes = blob.getBytes();
				byte[] newData = new byte[dataBytes.length + appendBytes.length];
				System.arraycopy(dataBytes, 0, newData, 0, dataBytes.length);
				System.arraycopy(appendBytes, 0, newData, dataBytes.length, appendBytes.length);

				data = newData;
				break;
			case TYPE_FILE :
				throw new IllegalStateException("Not yet implemented. TYPE_FILE");
				// break;
			default :
				throw new IllegalArgumentException("Unknown Blob type id " + type);
		}
	}

	@Kroll.getProperty @Kroll.method
	public String getText()
	{
		String result = null;

		// Only support String and Data. Same as iPhone
		switch(type) {
			case TYPE_STRING :
				result = (String) data;
			case TYPE_DATA:
			case TYPE_FILE:
				// Don't try to return a string if we can see the 
				// mimetype is binary, unless it's application/octet-stream, which means
				// we don't really know what it is, so assume the user-developer knows
				// what she's doing.
				if (mimetype != null && TiMimeTypeHelper.isBinaryMimeType(mimetype) && mimetype != "application/octet-stream") {
					return null;
				}
				try {
					result = new String(getBytes(), "utf-8");
				} catch (UnsupportedEncodingException e) {
					Log.w(LCAT, "Unable to convert to string.");
				}
				break;
		}

		return result;
	}

	@Kroll.getProperty @Kroll.method
	public String getMimeType()
	{
		return mimetype;
	}

	public Object getData()
	{
		return data;
	}
	
	@Kroll.getProperty @Kroll.method
	public int getType()
	{
		return type;
	}

	@Kroll.getProperty @Kroll.method
	public int getWidth()
	{
		return width;
	}

	@Kroll.getProperty @Kroll.method
	public int getHeight()
	{
		return height;
	}

	@Kroll.method
	public String toString()
	{
		// blob should return the text value on toString 
		// if it's not null
		String text = getText();
		if (text != null) {
			return text;
		}
		return "[object TiBlob]";
	}

	@Kroll.getProperty @Kroll.method
	public String getNativePath()
	{
		if (data == null) {
			return null;
		}
		if (this.type != TYPE_FILE) {
			Log.w(LCAT, "getNativePath not supported for non-file blob types.");
			return null;
		} else if (!(data instanceof TiBaseFile)) {
			Log.w(LCAT, "getNativePath unable to return value: underlying data is not file, rather " + data.getClass().getName());
			return null;
		} else {
			String path = ((TiBaseFile)data).nativePath();
			if (path != null && path.startsWith("content://")) {
				File f = ((TiBaseFile)data).getNativeFile();
				if (f != null) {
					path = f.getAbsolutePath();
					if (path != null && path.startsWith("/")) {
						path = "file://" + path;
					}
				}
			}
			return path;
		}
	}

	@Kroll.getProperty @Kroll.method
	public TiFileProxy getFile()
	{
		if (data == null) {
			return null;
		}
		if (this.type != TYPE_FILE) {
			Log.w(LCAT, "getFile not supported for non-file blob types.");
			return null;
		} else if (!(data instanceof TiBaseFile)) {
			Log.w(LCAT, "getFile unable to return value: underlying data is not file, rather " + data.getClass().getName());
			return null;
		} else {
			return new TiFileProxy((TiBaseFile)data);
		}
	}

	@Kroll.method
	public String toBase64()
	{
		return new String(Base64.encodeBase64(getBytes()));
	}
}

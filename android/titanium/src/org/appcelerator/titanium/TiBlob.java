/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;

import org.apache.commons.codec.binary.Base64;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiMimeTypeHelper;

import android.graphics.Bitmap;
import android.graphics.Bitmap.CompressFormat;


public class TiBlob extends TiProxy
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

	private TiBlob(TiContext tiContext, int type, Object data, String mimetype)
	{
		super(tiContext);
		this.type = type;
		this.data = data;
		this.mimetype = mimetype;
		this.width = 0;
		this.height = 0;
	}

	public static TiBlob blobFromString(TiContext tiContext, String data)
	{
		return new TiBlob(tiContext, TYPE_STRING, data, "text/plain");
	}

	public static TiBlob blobFromFile(TiContext tiContext, TiBaseFile file)
	{
		return blobFromFile(tiContext, file, TiMimeTypeHelper.getMimeType(file.nativePath()));
	}

	public static TiBlob blobFromFile(TiContext tiContext, TiBaseFile file, String mimeType)
	{
		return new TiBlob(tiContext, TYPE_FILE, file, mimeType);
	}

	public static TiBlob blobFromImage(TiContext tiContext, Bitmap image) {
		ByteArrayOutputStream bos = new ByteArrayOutputStream();
		byte data[] = new byte[0];
		if (image.compress(CompressFormat.PNG, 100, bos)) {
			data = bos.toByteArray();
		}

		TiBlob blob = new TiBlob(tiContext, TYPE_IMAGE, data, "image/bitmap");
		blob.width = image.getWidth();
		blob.height = image.getHeight();
		return blob;
	}

	public static TiBlob blobFromData(TiContext tiContext, byte[] data) {
		return blobFromData(tiContext, data, "application/octet-stream");
	}

	public static TiBlob blobFromData(TiContext tiContext, byte[] data, String mimetype) {
		return new TiBlob(tiContext, TYPE_DATA, data, mimetype);
	}

	public byte[] getBytes() {
		byte[] bytes = null;

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
						bytes = new byte[getLength()];
						stream.read(bytes);
					} catch(IOException e) {
						Log.w(LCAT, e.getMessage(), e);
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

	public int getLength() {
		switch (type) {
			case TYPE_FILE:
				return (int) ((TiBaseFile)data).getNativeFile().length();
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

	public void append(TiBlob blob) {
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

	public String getText() {
		String result = null;

		// Only support String and Data. Same as iPhone
		switch(type) {
			case TYPE_STRING :
				result = (String) data;
			case TYPE_DATA:
			case TYPE_FILE:
				try {
					result = new String(getBytes(), "utf-8");
				} catch (UnsupportedEncodingException e) {
					Log.w(LCAT, "Unable to convert to string.");
				}
				break;
		}

		return result;
	}

	public String getMimeType() {
		return mimetype;
	}

	public Object getData() {
		return data;
	}

	public int getType() {
		return type;
	}

	public int getWidth() {
		return width;
	}

	public int getHeight() {
		return height;
	}

	public String toString()
	{
		// blob should return the text value on toString 
		// if it's not null
		String text = getText();
		if (text!=null)
		{
			return text;
		}
		return "[object TiBlob]";
	}

	public String toBase64()
	{
		return new String(Base64.encodeBase64(getBytes()));
	}
}

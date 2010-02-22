/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.io.UnsupportedEncodingException;

import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiMimeTypeHelper;

import android.graphics.Bitmap;


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


	private TiBlob(TiContext tiContext, int type, Object data, String mimetype)
	{
		super(tiContext);
		this.type = type;
		this.data = data;
		this.mimetype = mimetype;
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
		return new TiBlob(tiContext, TYPE_IMAGE, image, "image/bitmap");
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
			case TYPE_DATA :
				//TODO deal with mimetypes.
				bytes = (byte[]) data;
				break;
			case TYPE_FILE :
				throw new IllegalStateException("Not yet implemented. TYPE_FILE");
				//break;
			case TYPE_IMAGE :
				throw new IllegalStateException("Not yet implemented TYPE_IMAGE");
				// break;
			default :
				throw new IllegalArgumentException("Unknown Blob type id " + type);
		}

		return bytes;
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
				//break;
			case TYPE_IMAGE :
				throw new IllegalStateException("Not yet implemented TYPE_IMAGE");
				// break;
			default :
				throw new IllegalArgumentException("Unknown Blob type id " + type);
		}
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
}

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
import org.appcelerator.titanium.io.TitaniumBlob;
import org.appcelerator.titanium.util.TiMimeTypeHelper;

import android.graphics.Matrix;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Bitmap.CompressFormat;

/** 
 * A Titanium Blob object. A Blob can represent any opaque data or input stream.
 */
@Kroll.proxy
public class TiBlob extends KrollProxy
{
	private static final String LCAT = "TiBlob";
	private static final boolean DBG = TiConfig.LOGD;

	/**
	 * Represents a Blob that contains image data.
	 * @module.api
	 */
	public static final int TYPE_IMAGE = 0;
	
	/**
	 * Represents a Blob that contains file data.
	 * @module.api
	 */
	public static final int TYPE_FILE = 1;
	
	/**
	 * Represents a Blob that contains data.
	 * @module.api
	 */
	public static final int TYPE_DATA = 2;
	
	/**
	 * Represents a Blob that contains String data.
	 * @module.api
	 */
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

	/**
	 * Creates a new TiBlob object from String data.
	 * @param data the data used to create blob.
	 * @return new instance of TiBlob.
	 * @module.api
	 */
	public static TiBlob blobFromString(String data)
	{
		return new TiBlob(TYPE_STRING, data, "text/plain");
	}

	/**
	 * Creates a blob from a file and sets a mimeType based on the file name.
	 * @param file the file used to create blob.
	 * @return new instane of TiBlob.
	 * @module.api
	 */
	public static TiBlob blobFromFile(TiBaseFile file)
	{
		return blobFromFile(file, TiMimeTypeHelper.getMimeType(file.nativePath()));
	}

	/**
	 * Creates a blob from a file with the specified mimeType. If the passed mimeType is null, 
	 * the mimeType will be determined using the file name.
	 * @param file the file used to create blob.
	 * @param mimeType the mimeType used to create blob.
	 * @return new instance of TiBlob.
	 * @module.api
	 */
	public static TiBlob blobFromFile(TiBaseFile file, String mimeType)
	{
		if (mimeType == null) {
			mimeType = TiMimeTypeHelper.getMimeType(file.nativePath());
		}
		return new TiBlob(TYPE_FILE, file, mimeType);
	}

	/**
	 * Creates a blob from a bitmap.
	 * @param image the image used to create blob.
	 * @return new instance of TiBlob.
	 * @module.api
	 */
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

	/**
	 * Creates a blob from binary data, with mimeType as "application/octet-stream".
	 * @param data data used to create blob.
	 * @return new instance of TiBlob.
	 * @module.api
	 */
	public static TiBlob blobFromData(byte[] data)
	{
		return blobFromData(data, "application/octet-stream");
	}
	
	/**
	 * Creates a blob from binary data with the specified mimetype.
	 * If the passed mimetype is null, "application/octet-stream" will be used instead.
	 * @param data  binary data used to create blob.
	 * @param mimetype mimetype used to create blob.
	 * @return a new instance of TiBlob.
	 * @module.api
	 */
	public static TiBlob blobFromData(byte[] data, String mimetype)
	{
		if (mimetype == null || mimetype.length() == 0) {
			return new TiBlob(TYPE_DATA, data, "application/octet-stream");
		}

		return new TiBlob(TYPE_DATA, data, mimetype);
	}

	/**
	 * Returns the content of blob in form of binary data. Exception will be thrown
	 * if blob's type is unknown.
	 * @return binary data.
	 * @module.api
	 */
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
				long fileSize;
				if (data instanceof TitaniumBlob) {
					fileSize = ((TitaniumBlob) data).getFile().length();
				} else {
					fileSize = ((TiBaseFile) data).size();
				}
				return (int) fileSize;
			case TYPE_DATA:
			case TYPE_IMAGE:
				return ((byte[])data).length;
			default:
				// this is probably overly expensive.. is there a better way?
				return getBytes().length;
		}
	}

	/**
	 * @return An InputStream for reading the data of this blob.
	 * @module.api
	 */
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

	/**
	 * @return the blob's data.
	 * @module.api
	 */
	public Object getData()
	{
		return data;
	}

	/**
	 * @return The type of this Blob.
	 * @see TiBlob#TYPE_DATA
	 * @see TiBlob#TYPE_FILE
	 * @see TiBlob#TYPE_IMAGE
	 * @see TiBlob#TYPE_STRING
	 * @module.api
	 */
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
    public TiBlob toImage()
    {
        byte[] bytes = getBytes();
        BitmapFactory.Options options = new BitmapFactory.Options();
        options.inJustDecodeBounds = true;
        BitmapFactory.decodeByteArray(bytes, 0, bytes.length, options);
        this.width = options.outWidth;
        this.height = options.outHeight;
        return this;
    }

    private int sampleSize(int outWidth, int outHeight, int newWidth, int newHeight) {
        int sample = 1;

        int width = outWidth;
        int height = outHeight;

        while (true) {
            if (width / 2 < newWidth || height / 2 < newHeight) {
                break;
            }
            width /= 2;
            height /= 2;
            sample *= 2;
        }
        return sample;
    }

    @Kroll.method
    public TiBlob imageAsResized(int width, int height)
    {
        byte[] image_data = this.getBytes();

        try{
            BitmapFactory.Options opts = new BitmapFactory.Options();
            opts.inJustDecodeBounds = true;

            BitmapFactory.decodeByteArray(image_data, 0, image_data.length, opts);

            opts.inSampleSize = sampleSize(opts.outWidth, opts.outHeight, width, height);
            opts.inJustDecodeBounds = false;
            opts.inScaled = true;
            opts.inPurgeable = true;

            Bitmap image_base = BitmapFactory.decodeByteArray(image_data, 0, image_data.length, opts);
            Bitmap scaled_image = Bitmap.createScaledBitmap(image_base, width, height, true);
            TiBlob blob = TiBlob.blobFromImage(scaled_image);
            image_base.recycle();
            image_base = null;
            scaled_image.recycle();
            scaled_image = null;
            return blob;
        }catch(NullPointerException e){
            return null;
        }
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

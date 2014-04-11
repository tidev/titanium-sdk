/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
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
import java.net.URLConnection;
import java.util.Arrays;
import java.util.HashMap;

import org.apache.commons.codec.binary.Base64;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.util.KrollStreamHelper;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TitaniumBlob;
import org.appcelerator.titanium.util.TiImageHelper;
import org.appcelerator.titanium.util.TiMimeTypeHelper;

import android.graphics.Bitmap;
import android.graphics.Bitmap.CompressFormat;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Path;
import android.graphics.Path.Direction;
import android.graphics.RectF;
import android.media.ThumbnailUtils;

/** 
 * A Titanium Blob object. A Blob can represent any opaque data or input stream.
 */
@Kroll.proxy
public class TiBlob extends KrollProxy
{
	private static final String TAG = "TiBlob";

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
	private Bitmap image;
	private int width, height;

	private TiBlob(int type, Object data, String mimetype)
	{
		super();
		this.type = type;
		this.data = data;
		this.mimetype = mimetype;
		this.image = null;
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
		TiBlob blob = new TiBlob(TYPE_FILE, file, mimeType);
		blob.loadBitmapInfo();
		return blob;
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
		if (image.hasAlpha()) {
			if (image.compress(CompressFormat.PNG, 100, bos)) {
				data = bos.toByteArray();
			}
		}
		else {
			if (image.compress(CompressFormat.JPEG, 100, bos)) {
				data = bos.toByteArray();
			}
		}

		TiBlob blob = new TiBlob(TYPE_IMAGE, data, "image/bitmap");
		blob.image = image;
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
		TiBlob blob = new TiBlob(TYPE_DATA, data, mimetype);
		blob.loadBitmapInfo();
		return blob;
	}

	/**
	 * Determines the MIME-type by reading first few characters from the given input stream.
	 * @return the guessed MIME-type or null if the type could not be determined.
	 */
	public String guessContentTypeFromStream()
	{
		String mt = null;
		InputStream is = getInputStream();
		if (is != null) {
			try {
				mt = URLConnection.guessContentTypeFromStream(is);
			} catch (Exception e) {
				Log.e(TAG, e.getMessage(), e, Log.DEBUG_MODE);
			}
		}
		return mt;
	}

	/**
	 * Update width and height if the file / data can be decoded into a bitmap successfully.
	 */
	public void loadBitmapInfo()
	{
		String mt = guessContentTypeFromStream();
		// Update mimetype based on the guessed MIME-type.
		if (mt != null && mt != mimetype) {
			mimetype = mt;
		}

		// If the MIME-type is "image/*" or undetermined, try to decode the file / data into a bitmap.
		if (mt == null || mt.startsWith("image/")) {
			// Query the dimensions of a bitmap without allocating the memory for its pixels
			BitmapFactory.Options opts = new BitmapFactory.Options();
			opts.inJustDecodeBounds = true;

			switch (type) {
				case TYPE_FILE:
					BitmapFactory.decodeStream(getInputStream(), null, opts);
					break;
				case TYPE_DATA:
					byte[] byteArray = (byte[]) data;
					BitmapFactory.decodeByteArray(byteArray, 0, byteArray.length, opts);
					break;
			}

			// Update width and height after the file / data is decoded successfully
			if (opts.outWidth != -1 && opts.outHeight != -1) {
				width = opts.outWidth;
				height = opts.outHeight;
			}
		}
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
					Log.w(TAG, e.getMessage(), e);
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
							Log.w(TAG, e.getMessage(), e);
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
				Log.e(TAG, e.getMessage(), e);
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
					Log.w(TAG, e.getMessage(), e);
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
					Log.w(TAG, "Unable to convert to string.");
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
			Log.w(TAG, "getNativePath not supported for non-file blob types.");
			return null;
		} else if (!(data instanceof TiBaseFile)) {
			Log.w(TAG, "getNativePath unable to return value: underlying data is not file, rather " + data.getClass().getName());
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
			Log.w(TAG, "getFile not supported for non-file blob types.");
			return null;
		} else if (!(data instanceof TiBaseFile)) {
			Log.w(TAG, "getFile unable to return value: underlying data is not file, rather " + data.getClass().getName());
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

	public Bitmap getImage()
	{
		// If the image is not available but the width and height of the image are successfully fetched, the image can
		// be created by decoding the data.
		return getImage(null);
	}
	
	private Bitmap getImage(BitmapFactory.Options opts) {
		if (image == null && (width > 0 && height > 0)) {
			if (opts == null) {
				opts = new BitmapFactory.Options();
				opts.inPreferredConfig = Bitmap.Config.RGB_565;
			}
			try {
				switch (type) {
					case TYPE_FILE:
						return BitmapFactory.decodeStream(getInputStream(),null,opts);
					case TYPE_DATA:
						byte[] byteArray = (byte[]) data;
						return BitmapFactory.decodeByteArray(byteArray, 0, byteArray.length,opts);
				}
			} catch (OutOfMemoryError e) {
				Log.e(TAG, "Unable to get the image. Not enough memory: " + e.getMessage(), e);
				return null;
			}
		}
		return image;
	}

	@Kroll.method
	public TiBlob imageAsCropped(Object params)
	{
		Bitmap img = getImage();
		if (img == null) {
			return null;
		}
		if (!(params instanceof HashMap)) {
			Log.e(TAG, "Argument for imageAsCropped must be a dictionary");
			return null;
		}

		int rotation = 0;
		if (type == TYPE_FILE) {
			rotation = TiImageHelper.getOrientation(getNativePath());
		}
		
		KrollDict options = new KrollDict((HashMap) params);
		int widthCropped = options.optInt(TiC.PROPERTY_WIDTH, width);
		int heightCropped = options.optInt(TiC.PROPERTY_HEIGHT, height);
		int x = options.optInt(TiC.PROPERTY_X, (width - widthCropped) / 2);
		int y = options.optInt(TiC.PROPERTY_Y, (height - heightCropped) / 2);
		try {
			Matrix matrix = new Matrix();
			//rotate
			matrix.postRotate(rotation);
			Bitmap imageCropped = Bitmap.createBitmap(img, x, y, widthCropped, heightCropped, matrix, true);
			if(img != image && img != imageCropped) {
				img.recycle();
				img = null;
			}
			
			return blobFromImage(imageCropped);
		} catch (OutOfMemoryError e) {
			Log.e(TAG, "Unable to crop the image. Not enough memory: " + e.getMessage(), e);
			return null;
		} catch (IllegalArgumentException e) {
			Log.e(TAG, "Unable to crop the image. Illegal Argument: " + e.getMessage(), e);
			return null;
		} catch (Throwable t) {
			Log.e(TAG, "Unable to crop the image. Unknown exception: " + t.getMessage());
			return null;
		}
	}

	@Kroll.method
	public TiBlob imageAsResized(Number width, Number height)
	{
		boolean valid =  (image == null && (this.width > 0 && this.height > 0));
		if(!valid) {
			return null;
		}
		
		int dstWidth = width.intValue();
		int dstHeight = height.intValue();
		int imgWidth = this.width;
		int imgHeight = this.height;
		
		BitmapFactory.Options opts = null;
		boolean scaleDown = ((image == null) && (dstWidth < imgWidth) && (dstHeight < imgHeight));
		if (scaleDown) {
			int scaleWidth = imgWidth/dstWidth;
			int scaleHeight = imgHeight/dstHeight;
			
			int targetScale = (scaleWidth < scaleHeight) ? scaleWidth : scaleHeight;
			int sampleSize = 1;
			while(targetScale >= 2) {
				sampleSize *= 2;
				targetScale /= 2;
			}
			
			opts = new BitmapFactory.Options();
			opts.inSampleSize = sampleSize;
			opts.inPreferredConfig = Bitmap.Config.RGB_565;
		}
		
		
		
		Bitmap img = getImage(opts);
		if (img == null) {
			return null;
		}

		int rotation = 0;
		if (type == TYPE_FILE) {
			rotation = TiImageHelper.getOrientation(getNativePath());
		}
		
		try {
			Bitmap imageResized = null;
			imgWidth = img.getWidth();
			imgHeight = img.getHeight();
			if (rotation != 0) {
				float scaleWidth = (float)dstWidth/imgWidth;
				float scaleHeight = (float)dstHeight/imgHeight;
				Matrix matrix = new Matrix();
				//resize
				matrix.postScale(scaleWidth, scaleHeight);
				//rotate
				matrix.postRotate(rotation);
				imageResized = Bitmap.createBitmap(img, 0, 0, img.getWidth(), img.getHeight(), matrix, true);
			} else {
				imageResized = Bitmap.createScaledBitmap(img, dstWidth, dstHeight, true);
			}
			if(img != image && img != imageResized) {
				img.recycle();
				img = null;
			}
			return blobFromImage(imageResized);
		} catch (OutOfMemoryError e) {
			Log.e(TAG, "Unable to resize the image. Not enough memory: " + e.getMessage(), e);
			return null;
		} catch (IllegalArgumentException e) {
			Log.e(TAG, "Unable to resize the image. Illegal Argument: " + e.getMessage(), e);
			return null;
		} catch (Throwable t) {
			Log.e(TAG, "Unable to crop the image. Unknown exception: " + t.getMessage());
			return null;
		}
	}

	@Kroll.method
	public TiBlob imageAsThumbnail(Number size, @Kroll.argument(optional = true) Number borderSize,
		@Kroll.argument(optional = true) Number cornerRadius)
	{
		Bitmap img = getImage();
		if (img == null) {
			return null;
		}
		
		int rotation = 0;
		if (type == TYPE_FILE) {
			rotation = TiImageHelper.getOrientation(getNativePath());
		}

		int thumbnailSize = size.intValue();

		float border = 1f;
		if (borderSize != null) {
			border = borderSize.floatValue();
		}
		float radius = 0f;
		if (cornerRadius != null) {
			radius = cornerRadius.floatValue();
		}

		try {
			Bitmap imageFinal = null;
			Bitmap imageThumbnail = ThumbnailUtils.extractThumbnail(img, thumbnailSize, thumbnailSize);
			if(img != image && img != imageThumbnail) {
				img.recycle();
				img = null;
			}

			if (border == 0 && radius == 0) {
				imageFinal = imageThumbnail;
			} else {
				imageFinal = TiImageHelper.imageWithRoundedCorner(imageThumbnail, radius, border);
				if(imageThumbnail != image && imageThumbnail != imageFinal) {
					imageThumbnail.recycle();
					imageThumbnail = null;
				}
			}
			
			if (rotation != 0) {
				return blobFromImage(TiImageHelper.rotateImage(imageFinal, rotation));
			}
			return blobFromImage(imageFinal);

		} catch (OutOfMemoryError e) {
			Log.e(TAG, "Unable to get the thumbnail image. Not enough memory: " + e.getMessage(), e);
			return null;
		} catch (IllegalArgumentException e) {
			Log.e(TAG, "Unable to get the thumbnail image. Illegal Argument: " + e.getMessage(), e);
			return null;
		} catch (Throwable t) {
			Log.e(TAG, "Unable to get the thumbnail image. Unknown exception: " + t.getMessage());
			return null;
		}
	}

	@Kroll.method
	public TiBlob imageWithAlpha()
	{
		Bitmap img = getImage();
		if (img == null) {
			return null;
		}
		int rotation = 0;
		if (type == TYPE_FILE) {
			rotation = TiImageHelper.getOrientation(getNativePath());
		}
		
		try {
			Bitmap imageWithAlpha = TiImageHelper.imageWithAlpha(img);
			if(img != image && img != imageWithAlpha) {
				img.recycle();
				img = null;
			}
			if (rotation != 0) {
			    return blobFromImage(TiImageHelper.rotateImage(imageWithAlpha, rotation));
			}
			return blobFromImage(imageWithAlpha);
		} catch (OutOfMemoryError e) {
			Log.e(TAG, "Unable to get the image with alpha. Not enough memory: " + e.getMessage(), e);
			return null;
		} catch (IllegalArgumentException e) {
			Log.e(TAG, "Unable to get the image with alpha. Illegal Argument: " + e.getMessage(), e);
			return null;
		} catch (Throwable t) {
			Log.e(TAG, "Unable to get the image with alpha. Unknown exception: " + t.getMessage());
			return null;
		}
	}

	@Kroll.method
	public TiBlob imageWithRoundedCorner(Number cornerRadius, @Kroll.argument(optional = true) Number borderSize)
	{
		Bitmap img = getImage();
		if (img == null) {
			return null;
		}

		int rotation = 0;
		if (type == TYPE_FILE) {
			rotation = TiImageHelper.getOrientation(getNativePath());
		}
		
		float radius = cornerRadius.floatValue();
		float border = 1f;
		if (borderSize != null) {
			border = borderSize.floatValue();
		}

		try {
			Bitmap imageRoundedCorner = TiImageHelper.imageWithRoundedCorner(img, radius, border);
			if(img != image && img != imageRoundedCorner) {
				img.recycle();
				img = null;
			}
			if (rotation != 0) {
			    return blobFromImage(TiImageHelper.rotateImage(imageRoundedCorner, rotation));
			}
			return blobFromImage(imageRoundedCorner);
		} catch (OutOfMemoryError e) {
			Log.e(TAG, "Unable to get the image with rounded corner. Not enough memory: " + e.getMessage(), e);
			return null;
		} catch (IllegalArgumentException e) {
			Log.e(TAG, "Unable to get the image with rounded corner. Illegal Argument: " + e.getMessage(), e);
			return null;
		} catch (Throwable t) {
			Log.e(TAG, "Unable to get the image with rounded corner. Unknown exception: " + t.getMessage());
			return null;
		}
	}

	@Kroll.method
	public TiBlob imageWithTransparentBorder(Number size)
	{
		Bitmap img = getImage();
		if (img == null) {
			return null;
		}

		int rotation = 0;
		if (type == TYPE_FILE) {
			rotation = TiImageHelper.getOrientation(getNativePath());
		}
		
		int borderSize = size.intValue();
		try {
			Bitmap imageWithBorder = TiImageHelper.imageWithTransparentBorder(img, borderSize);
			if(img != image && img != imageWithBorder) {
				img.recycle();
				img = null;
			}
			if (rotation != 0) {
				return blobFromImage(TiImageHelper.rotateImage(imageWithBorder, rotation));
			}
			return blobFromImage(imageWithBorder);
		} catch (OutOfMemoryError e) {
			Log.e(TAG, "Unable to get the image with transparent border. Not enough memory: " + e.getMessage(), e);
			return null;
		} catch (IllegalArgumentException e) {
			Log.e(TAG, "Unable to get the image with transparent border. Illegal Argument: " + e.getMessage(), e);
			return null;
		} catch (Throwable t) {
			Log.e(TAG, "Unable to get the image with transparent border. Unknown exception: " + t.getMessage());
			return null;
		}
	}

	@Override
	public String getApiName()
	{
		return "Ti.Blob";
	}
}

/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.view;

import java.io.IOException;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiBackgroundImageLoadTask;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;

import android.graphics.Bitmap;
import android.webkit.URLUtil;

public class TiDrawableReference
{
	
	public enum DrawableReferenceType {
		NULL, URL, RESOURCE_ID, BLOB, FILE
	}
	
	private static final String LCAT = "TiDrawableReference";
	
	private int resourceId;
	private String url;
	private TiBlob blob;
	private TiBaseFile file;
	private DrawableReferenceType type;
	
	private boolean raKeyChecked = false;
	
	public TiDrawableReference(DrawableReferenceType type)
	{
		this.type = type;
	}
	
	public static TiDrawableReference fromResourceId(int resourceId) 
	{
		TiDrawableReference ref = new TiDrawableReference(DrawableReferenceType.RESOURCE_ID);
		ref.resourceId = resourceId;
		return ref;
	}
	
	public static TiDrawableReference fromBlob(TiBlob blob)
	{
		TiDrawableReference ref = new TiDrawableReference(DrawableReferenceType.BLOB);
		ref.blob = blob;
		return ref;
	}
	
	public static TiDrawableReference fromUrl(String url)
	{
		TiDrawableReference ref = new TiDrawableReference(DrawableReferenceType.URL);
		ref.url = url;
		return ref;
	}
	
	public static TiDrawableReference fromFile(TiBaseFile file)
	{
		TiDrawableReference ref = new TiDrawableReference(DrawableReferenceType.FILE);
		ref.file = file;
		return ref;
	}
	
	public static TiDrawableReference fromDictionary(KrollDict dict)
	{
		if (dict.containsKey("media")) {
			return fromBlob(TiConvert.toBlob(dict, "media"));
		} else {
			Log.w(LCAT, "Unknown drawable reference inside dictionary.  Expected key 'media' to be a blob.  Returning null drawable reference");
			return fromObject(null);
		}
	}
	
	public static TiDrawableReference fromObject(Object object)
	{
		if (object == null) {
			return new TiDrawableReference(DrawableReferenceType.NULL);
		}
		
		if (object instanceof String) {
			return fromUrl(TiConvert.toString(object));
		} else if (object instanceof KrollDict) {
			return fromDictionary((KrollDict)object);
		} else if (object instanceof TiBaseFile) {
			return fromFile((TiBaseFile)object);
		} else if (object instanceof TiBlob) {
			return fromBlob(TiConvert.toBlob(object));
		} else if (object instanceof Number) {
			return fromResourceId(((Number)object).intValue());
		} else {
			Log.w(LCAT, "Unknown image reesource type: " + object.getClass().getSimpleName() + ". Returning null drawable reference");
			return fromObject(null);
		}
	}
	
	public boolean isNetworkUrl()
	{
		return (type == DrawableReferenceType.URL && URLUtil.isNetworkUrl(this.url));
	}
	
	public boolean isTypeUrl() {
		return type == DrawableReferenceType.URL;
	}
	
	public boolean isTypeFile() {
		return type == DrawableReferenceType.FILE;
	}
	
	public boolean isTypeBlob() {
		return type == DrawableReferenceType.BLOB;
	}
	
	public boolean isTypeResourceId() {
		return type == DrawableReferenceType.RESOURCE_ID;
	}
	
	public Bitmap getBitmap(TiContext context)
	{
		if (type == DrawableReferenceType.NULL) {
			return null;
			
		} else if (type == DrawableReferenceType.RESOURCE_ID) {
			return TiUIHelper.getResourceBitmap(context, resourceId);
			
		} else if (type == DrawableReferenceType.URL) {
			// Could still be a resource with an RA.java key
			if (!raKeyChecked) {
				raKeyChecked = true;
				int id =  TiUIHelper.getResourceId(url);
				if (id != 0) {
					// This is a resource so handle it as such
					this.type = DrawableReferenceType.RESOURCE_ID;
					this.resourceId = id;
					return getBitmap(context);
				}
			}
			if (isNetworkUrl()) {
				Log.w(LCAT, "getBitmap called for network-based image url.  Use getBitmapAsync instead.");
				return null;
			} else {
				// Lifted from TiUIImageView.createBitmap
				TiBaseFile tempfile = TiFileFactory.createTitaniumFile(context, new String[] { context.resolveUrl(null, this.url) }, false);
				try {
					return TiUIHelper.createBitmap(tempfile.getInputStream());
				} catch (IOException e) {
					Log.e(LCAT, "Error creating drawable from path: " + url, e);
					return null;
				}
			}
			
		} else if (type == DrawableReferenceType.BLOB) {
			return TiUIHelper.createBitmap(blob.getInputStream());
			
		} else if (type == DrawableReferenceType.FILE) {
			if (file == null) {
				return null;
			}
			try {
				return TiUIHelper.createBitmap(file.getInputStream());
			} catch (IOException e) {
				Log.e(LCAT, "Error creating drawable from file: " + file.name(), e);
				return null;
			}
		}
		return null;
	}
	
	public void getBitmapAsync(TiBackgroundImageLoadTask asyncTask)
	{
		if (!isNetworkUrl()) {
			Log.w(LCAT, "getBitmapAsync called on non-network url.  Will attempt load.");
		}
		asyncTask.load(url);
	}
	
}

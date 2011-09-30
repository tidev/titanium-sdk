/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.view;

import java.io.IOException;
import java.io.InputStream;
import java.lang.ref.SoftReference;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.TiFastDev;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiBackgroundImageLoadTask;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiDownloadListener;
import org.appcelerator.titanium.util.TiDownloadManager;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiUIHelper;

import android.content.Context;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.view.View;
import android.webkit.URLUtil;

public class TiDrawableReference
{
	private static Map<Integer, Bounds> boundsCache;
	static
	{
		boundsCache = Collections.synchronizedMap(new HashMap<Integer, Bounds>());
	}

	public enum DrawableReferenceType
	{
		NULL, URL, RESOURCE_ID, BLOB, FILE
	}

	public static class Bounds
	{
		public static final int UNKNOWN = TiDrawableReference.UNKNOWN;
		private int height = UNKNOWN, width = UNKNOWN;
		public int getHeight() { return height; }
		public int getWidth() { return width; }
	}

	private static final String LCAT = "TiDrawableReference";
	private static final boolean DBG = TiConfig.LOGD;
	private static final int UNKNOWN = -1;
	private static final int DEFAULT_SAMPLE_SIZE = 1;
	private int resourceId = UNKNOWN;
	private String url;
	private TiBlob blob;
	private TiBaseFile file;
	private DrawableReferenceType type;
	private boolean oomOccurred = false;

	private SoftReference<TiContext> softContext = null;

	private TiFileHelper fileHelper = null;

	public TiDrawableReference(TiContext context, DrawableReferenceType type)
	{
		this.type = type;
		softContext = new SoftReference<TiContext>(context);
	}

	/**
	 * A very primitive implementation based on org.apache.commons.lang3.builder.HashCodeBuilder,
	 * which is licensed under Apache 2.0 license.
	 * @see <a href="http://svn.apache.org/viewvc/commons/proper/lang/trunk/src/main/java/org/apache/commons/lang3/builder/HashCodeBuilder.java?view=markup">HashCodeBuilder</a>
	 */
	@Override
	public int hashCode()
	{
		int total = 17;
		final int constant = 37;
		total = total * constant + type.ordinal();
		total = total * constant + (url == null ? 0 : url.hashCode());
		total = total * constant + (blob == null ? 0 : blob.hashCode());
		total = total * constant + (file == null ? 0 : file.hashCode());
		total = total * constant + resourceId;
		return total;
	}
	@Override
	public boolean equals(Object object)
	{
		if (!(object instanceof TiDrawableReference)) {
			return super.equals(object);
		}
		return (this.hashCode() == ((TiDrawableReference)object).hashCode());
	}
	public static TiDrawableReference fromResourceId(TiContext context, int resourceId)
	{
		TiDrawableReference ref = new TiDrawableReference(context, DrawableReferenceType.RESOURCE_ID);
		ref.resourceId = resourceId;
		return ref;
	}

	public static TiDrawableReference fromBlob(TiContext context, TiBlob blob)
	{
		TiDrawableReference ref = new TiDrawableReference(context, DrawableReferenceType.BLOB);
		ref.blob = blob;
		return ref;
	}

	public static TiDrawableReference fromUrl(TiContext context, String url)
	{
		TiDrawableReference ref = new TiDrawableReference(context, DrawableReferenceType.URL);
		ref.url = url;
		
		// Could still be a resource image file in android/images/medium|high|low. Check once.
		if (url != null) {
			int id =  TiUIHelper.getResourceId(context.resolveUrl(null, url));
			if (id != 0) {
				// This is a resource so handle it as such.  Is it evil to switch up the type on someone like this? Maybe...
				ref.type = DrawableReferenceType.RESOURCE_ID;
				ref.resourceId = id;
			}
		}
		return ref;
	}

	public static TiDrawableReference fromFile(TiContext context, TiBaseFile file)
	{
		TiDrawableReference ref = new TiDrawableReference(context, DrawableReferenceType.FILE);
		ref.file = file;
		return ref;
	}

	public static TiDrawableReference fromDictionary(TiContext context, KrollDict dict)
	{
		if (dict.containsKey("media")) {
			return fromBlob(context, TiConvert.toBlob(dict, "media"));
		} else {
			Log.w(LCAT, "Unknown drawable reference inside dictionary.  Expected key 'media' to be a blob.  Returning null drawable reference");
			return fromObject(context, null);
		}
	}
	/**
	 * Does its best to determine the type of reference (url, blob, etc) based on object parameter.
	 * @param context
	 * @param object
	 * @return A ready instance of TiDrawableReference
	 */
	public static TiDrawableReference fromObject(TiContext context, Object object)
	{
		if (object == null) {
			return new TiDrawableReference(context, DrawableReferenceType.NULL);
		}
		
		if (object instanceof String) {
			return fromUrl(context, TiConvert.toString(object));
		} else if (object instanceof KrollDict) {
			return fromDictionary(context, (KrollDict)object);
		} else if (object instanceof TiBaseFile) {
			return fromFile(context, (TiBaseFile)object);
		} else if (object instanceof TiBlob) {
			return fromBlob(context, TiConvert.toBlob(object));
		} else if (object instanceof Number) {
			return fromResourceId(context, ((Number)object).intValue());
		} else {
			Log.w(LCAT, "Unknown image resource type: " + object.getClass().getSimpleName() + ". Returning null drawable reference");
			return fromObject(context, null);
		}
	}

	public boolean isNetworkUrl()
	{
		return (type == DrawableReferenceType.URL && url != null && URLUtil.isNetworkUrl(this.url));
	}

	public boolean isTypeUrl()
	{
		return type == DrawableReferenceType.URL;
	}

	public boolean isTypeFile()
	{
		return type == DrawableReferenceType.FILE;
	}
	
	public boolean isTypeBlob()
	{
		return type == DrawableReferenceType.BLOB;
	}

	public boolean isTypeResourceId()
	{
		return type == DrawableReferenceType.RESOURCE_ID;
	}
	public boolean isTypeNull()
	{
		return type == DrawableReferenceType.NULL;
	}

	/**
	 * Get the bitmap from the resource without respect to sampling/scaling.
	 * @return Bitmap, or null if any problem getting it.  Check logcat if null.
	 */
	public Bitmap getBitmap()
	{
		InputStream is = getInputStream();
		if (is == null) {
			Log.w(LCAT, "Could not open stream to get bitmap");
			return null;
		}

		Bitmap b = null;

		try {
			BitmapFactory.Options opts = new BitmapFactory.Options();
			opts.inInputShareable = true;
			opts.inPurgeable = true;

			try {
				oomOccurred = false;
				b = BitmapFactory.decodeStream(is, null, opts);
			} catch (OutOfMemoryError e) {
				oomOccurred = true;
				Log.e(LCAT, "Unable to load bitmap. Not enough memory: " + e.getMessage(), e);
			}
		
		} finally {
			try {
				is.close();
			} catch (IOException e) {
				Log.e(LCAT, "Problem closing stream: " + e.getMessage(), e);
			}
		}
		return b;
	}
	private Resources getResources()
	{
		TiContext tiContext = softContext.get();
		if (tiContext != null) {
			Context context = tiContext.getAndroidContext();
			if (context != null) {
				return context.getResources();
			}
		}
		return null;
	}
	private Drawable getResourceDrawable()
	{
		if (!isTypeResourceId()) {
			return null;
		}
		Drawable drawable = null;
		Resources resources = getResources();
		if (resources != null && resourceId > 0) {
			try {
				drawable = resources.getDrawable(resourceId);
			} catch (Resources.NotFoundException e) {
				drawable = null;
			}
		}
		return drawable;
	}
	/**
	 * Gets a resource drawable directly if the reference is to a resource, else
	 * makes a BitmapDrawable with the given attributes.
	 */
	public Drawable getDrawable(View parent, TiDimension destWidthDimension, TiDimension destHeightDimension)
	{
		Drawable drawable = getResourceDrawable();
		if (drawable == null) {
			Bitmap b = getBitmap(parent, destWidthDimension, destHeightDimension);
			if (b != null) {
				drawable = new BitmapDrawable(b);
			}
		}
		return drawable;
	}
	/**
	 * Gets a resource drawable directly if the reference is to a resource, else
	 * makes a BitmapDrawable with the given attributes.
	 */
	public Drawable getDrawable(int destWidth, int destHeight)
	{
		Drawable drawable = getResourceDrawable();
		if (drawable == null) {
			Bitmap b = getBitmap(destWidth, destHeight);
			if (b != null) {
				drawable = new BitmapDrawable(b);
			}
		}
		return drawable;
	}
	/**
	 * Gets a resource drawable directly if the reference is to a resource, else
	 * makes a BitmapDrawable with default attributes.
	 */
	public Drawable getDrawable()
	{
		Drawable drawable = getResourceDrawable();
		if (drawable == null) {
			Bitmap b = getBitmap();
			if (b != null) {
				drawable = new BitmapDrawable(b);
			}
		}
		return drawable;
	}
	/**
	 * Gets the bitmap, scaled to a specific width & height.
	 * @param destWidth Width in pixels of resulting scaled bitmap
	 * @param destHeight Height in pixels of resulting scaled bitmap
	 * @return Bitmap, or null if any problem getting it.  Check logcat if null.
	 */
	public Bitmap getBitmap(int destWidth, int destHeight)
	{
		return getBitmap(null,
			TiConvert.toTiDimension(new Integer(destWidth), TiDimension.TYPE_WIDTH),
			TiConvert.toTiDimension(new Integer(destHeight), TiDimension.TYPE_HEIGHT));
	}
	/**
	 * Gets the bitmap, scaled to a specific width, with the height matching the
	 * original aspect ratio.
	 * @param destWidth Width in pixels of resulting bitmap
	 * @return Bitmap, or null if any problem getting it.  Check logcat if null.
	 */
	public Bitmap getBitmap(int destWidth)
	{
		int srcWidth, srcHeight, destHeight;
		Bounds orig = peekBounds();
		srcWidth = orig.width;
		srcHeight = orig.height;
		if (srcWidth <= 0 || srcHeight <= 0) {
			Log.w(LCAT, "Bitmap bounds could not be determined.  If bitmap is loaded, it won't be scaled.");
			return getBitmap(); // fallback
		}
		double aspectRatio = (double)srcWidth/(double)srcHeight;
		destHeight = (int) ((double)destWidth / aspectRatio);
		return getBitmap(destWidth, destHeight);
	}

	private Bounds calcDestSize(int srcWidth, int srcHeight, TiDimension destWidthDimension,
			TiDimension destHeightDimension, View parent)
	{
		Bounds bounds = new Bounds();
		int destWidth, destHeight, containerWidth, containerHeight,
			parentWidth, parentHeight;
		destWidth = destHeight = parentWidth = parentHeight =
			containerWidth = containerHeight = TiDrawableReference.UNKNOWN;

		if (parent != null) {
			parentWidth = parent.getWidth();
			parentHeight = parent.getHeight();
		}

		// Width to fit into
		if (destWidthDimension != null) {
			if (destWidthDimension.isUnitAuto()) {
				containerWidth = srcWidth;
			} else {
				containerWidth = destWidthDimension.getAsPixels(parent);
			}
		} else {
			if (parentWidth >= 0) {
				containerWidth = parentWidth;
			}
		}
		if (containerWidth < 0) {
			Log.w(LCAT, "Could not determine container width for image. Defaulting to source width. This shouldn't happen.");
			containerWidth = srcWidth;
		}

		// Height to fit into
		if (destHeightDimension != null) {
			if (destHeightDimension.isUnitAuto()) {
				containerHeight = srcHeight;
			} else {
				containerHeight = destHeightDimension.getAsPixels(parent);
			}
		} else {
			if (parentHeight >= 0) {
				containerHeight = parentHeight;
			}
		}

		if (containerHeight < 0) {
			Log.w(LCAT, "Could not determine container height for image. Defaulting to source height. This shouldn't happen.");
			containerHeight = srcHeight;
		}

		float origAspectRatio = (float) srcWidth / (float) srcHeight;

		if (origAspectRatio > 1f) {
			destWidth = containerWidth;
			destHeight = (int) ((float) destWidth / origAspectRatio);
		} else {
			destHeight = containerHeight;
			destWidth = (int) ((float) destHeight * origAspectRatio);
		}

		bounds.width = destWidth;
		bounds.height = destHeight;
		return bounds;
	}

	/**
	 * Gets the bitmap, scaled to a width & height specified in TiDimension params.
	 * @param destWidthDimension (null-ok) TiDimension specifying the desired width.  If .isUnitAuto()
	 * then the width will be the source width.  If destWidthDimension is null, then the TiContext
	 * will be used to determine the activity window's decor width and use that.
	 * @param destHeightDimension (null-ok) TiDimension specifying the desired height.  If .isUnitAuto()
	 * then the height will be the source height.  If destHeightDimension is null, then resulting height will
	 * be at same ratio to the resulting width as the original height:width.
	 * @return Bitmap, or null if any problem getting it.  Check logcat if null.
	 */
	public Bitmap getBitmap(View parent, TiDimension destWidthDimension, TiDimension destHeightDimension)
	{
		int srcWidth, srcHeight, destWidth, destHeight;

		Bounds bounds = peekBounds();
		srcWidth = bounds.width;
		srcHeight = bounds.height;

		if (srcWidth <= 0 || srcHeight <= 0) {
			Log.w(LCAT, "Bitmap bounds could not be determined.  If bitmap is loaded, it won't be scaled.");
			return getBitmap(); // fallback
		}

		if (parent == null) {
			TiContext context = softContext.get();
			if (context != null && context.getActivity() != null && context.getActivity().getWindow() != null) {
				parent = context.getActivity().getWindow().getDecorView();
			}
		}

		Bounds destBounds = calcDestSize(srcWidth, srcHeight, destWidthDimension, destHeightDimension, parent);
		destWidth = destBounds.width;
		destHeight = destBounds.height;

		if (destWidth <= 0 || destHeight <= 0) {
			// calcDestSize() should actually prevent this from happening, but just in case...
			Log.w(LCAT, "Bitmap final bounds could not be determined.  If bitmap is loaded, it won't be scaled.");
			return getBitmap();
		}

		InputStream is = getInputStream();
		if (is == null) {
			Log.w(LCAT, "Could not open stream to get bitmap");
			return null;
		}

		Bitmap b = null;
		try {
			BitmapFactory.Options opts = new BitmapFactory.Options();
			opts.inInputShareable = true;
			opts.inPurgeable = true;
			opts.inSampleSize =  calcSampleSize(srcWidth, srcHeight, destWidth, destHeight);

			Bitmap bTemp = null;
			try {
				oomOccurred = false;
				bTemp = BitmapFactory.decodeStream(is, null, opts);
				if (bTemp == null) {
					Log.w(LCAT, "Decoded bitmap is null");
					return null;
				}
				if (DBG) {
					StringBuilder sb = new StringBuilder();
					sb.append("Bitmap sampling results: inSampleSize=");
					sb.append(opts.inSampleSize);
					sb.append("; srcWidth=");
					sb.append(srcWidth);
					sb.append("; srcHeight=");
					sb.append(srcHeight);
					sb.append("; finalWidth=");
					sb.append(opts.outWidth);
					sb.append("; finalHeight=");
					sb.append(opts.outHeight);
					Log.d(LCAT, sb.toString());
				}
				if (bTemp.getNinePatchChunk() != null) {
					// Don't scale nine-patches
					b = bTemp;
					bTemp = null;
				} else {
					b = Bitmap.createScaledBitmap(bTemp, destWidth, destHeight, true);
				}
			} catch (OutOfMemoryError e) {
				oomOccurred = true;
				Log.e(LCAT, "Unable to load bitmap. Not enough memory: " + e.getMessage(), e);
			} finally {
				if (bTemp != null) {
					bTemp.recycle();
					bTemp = null;
				}
			}
		} finally {
			try {
				is.close();
			} catch (IOException e) {
				Log.e(LCAT, "Problem closing stream: " + e.getMessage(), e);
			}
		}
		return b;
	}

	/**
	 * Just runs TiDownloadManager.download(URI, listener) giving it the passed listener.
	 */
	public void getBitmapAsync(TiDownloadListener listener)
	{
		if (!isNetworkUrl()) {
			Log.w(LCAT, "getBitmapAsync called on non-network url.  Will attempt load.");
		}
		
		try {
			TiDownloadManager.getInstance().download(new URI(url), listener);
		} catch (URISyntaxException e) {
			Log.e(LCAT, "URI Invalid: " + url, e);
		}
	}
	/**
	 * Just runs .load(url) on the passed TiBackgroundImageLoadTask.
	 * @param asyncTask
	 */
	public void getBitmapAsync(TiBackgroundImageLoadTask asyncTask)
	{
		if (!isNetworkUrl()) {
			Log.w(LCAT, "getBitmapAsync called on non-network url.  Will attempt load.");
		}
		asyncTask.load(url);
	}
	/**
	 * Uses BitmapFactory.Options' 'inJustDecodeBounds' to peak at the bitmap's bounds
	 * (height & width) so we can do some sampling and scaling.
	 * @return Bounds object with .getWidth() and .getHeight() available on it.
	 */
	public Bounds peekBounds()
	{
		int hash = this.hashCode();
		if (boundsCache.containsKey(hash)) {
			return boundsCache.get(hash);
		}
		Bounds bounds = new Bounds();
		if (isTypeNull()) { return bounds; }

		InputStream stream = getInputStream();

		try {
			if (stream != null) {
				BitmapFactory.Options bfo = new BitmapFactory.Options();
				bfo.inJustDecodeBounds = true;
				BitmapFactory.decodeStream(stream, null, bfo);
				bounds.height = bfo.outHeight;
				bounds.width = bfo.outWidth;
			} else {
				Log.w(LCAT, "Could not open stream for drawable, therefore bounds checking could not be completed");
			}
		} finally {
			try {
				if (stream != null) {
					stream.close();
				}
			} catch (IOException e) {
				Log.e(LCAT, "problem closing stream: " + e.getMessage(), e);
			}
		}
		boundsCache.put(hash, bounds);
		return bounds;
	}

	/**
	 * Based on the underlying type of reference this is, figures out how to get
	 * an InputStream for it.  E.g., if a blob, calls blob.getInputStream, if 
	 * a resource id, calls context.getTiApp().getResources().openRawResource(resourceId).
	 * @return InputStream or null if problem getting it (check logcat in that case)
	 */
	public InputStream getInputStream()
	{
		TiContext context = softContext.get();
		if (context == null) {
			// Some of the types will require a context, so show a warning.
			Log.w(LCAT, "TiContext has been GC'd, so opening stream may not be possible.");
		}
		InputStream stream = null;

		if (isTypeUrl() && url != null) {
			if (context != null) {
				try {
					String resolved = context.resolveUrl(null, url);
					if (resolved.startsWith(TiC.URL_ANDROID_ASSET_RESOURCES)
						&& TiFastDev.isFastDevEnabled()) {
						TiBaseFile tbf = TiFileFactory.createTitaniumFile(context, new String[] { resolved }, false);
						stream = tbf.getInputStream();
					} else {
						stream = getTiFileHelper().openInputStream(resolved, false);
					}
				} catch (IOException e) {
					Log.e(LCAT, "Problem opening stream with url " + url + ": " + e.getMessage(), e);
				}
			}
			
		} else if (isTypeFile() && file != null) {
			try {
				stream = file.getInputStream();
			} catch (IOException e) {
				Log.e(LCAT, "Problem opening stream from file " + file.name() + ": " + e.getMessage(), e);
			}

		} else if (isTypeBlob() && blob != null) {
			stream = blob.getInputStream();
			
		} else if (isTypeResourceId() && resourceId != UNKNOWN && context != null) {
			try {
				stream = context.getTiApp().getResources().openRawResource(resourceId);
			} catch (Resources.NotFoundException e) {
				Log.e(LCAT, "Drawable resource could not be opened. Are you sure you have the resource for the current device configuration (orientation, screen size, etc.)?");
				throw e;
			}
		}

		return stream;
	}

	/**
	 * Calculates a value for the BitmapFactory.Options .inSampleSize property.
	 * 
	 * @see <a href="http://developer.android.com/reference/android/graphics/BitmapFactory.Options.html#inSampleSize">BitmapFactory.Options.inSampleSize</a>
	 * @param srcWidth int
	 * @param srcHeight int
	 * @param destWidth int
	 * @param destHeight int
	 * @return max of srcWidth/destWidth or srcHeight/destHeight
	 */
	public int calcSampleSize(int srcWidth, int srcHeight, int destWidth, int destHeight)
	{
		if (srcWidth <= 0 || srcHeight <= 0 || destWidth <= 0 || destHeight <= 0) {
			return DEFAULT_SAMPLE_SIZE;
		}
		return Math.max(srcWidth / destWidth, srcHeight / destHeight);
	}

	/**
	 * Calculates a value for the BitmapFactory.Options .inSampleSize property by first calling peakBounds() 
	 * to determine the original width & height.
	 * 
	 * @see #calcSampleSize(int, int, int, int)
	 * @param destWidth int
	 * @param destHeight int
	 * @return max of srcWidth/destWidth or srcHeight/destHeight
	 */
	public int calcSampleSize(int destWidth, int destHeight)
	{
		Bounds bounds = peekBounds();
		return calcSampleSize(bounds.width, bounds.height, destWidth, destHeight);
		
	}

	/**
	 * Calculates a value for the BitmapFactory.Options .inSampleSize property.
	 * 
	 * @see <a href="http://developer.android.com/reference/android/graphics/BitmapFactory.Options.html#inSampleSize">BitmapFactory.Options.inSampleSize</a>
	 * @param srcWidth int
	 * @param srcHeight int
	 * @param destWidthDimension TiDimension holding the destination width. If null, the TiContext's Activity's Window's decor width is used
	 * as the destWidth.
	 * @param destHeightDimension TiDimension holding the destination height.  If null, the destHeight will be proportional to destWidth as srcHeight
	 * is to srcWidth.
	 * @return max of srcWidth/destWidth or srcHeight/destHeight
	 */
	public int calcSampleSize(View parent, int srcWidth, int srcHeight, TiDimension destWidthDimension, TiDimension destHeightDimension) 
	{
		int destWidth, destHeight;
		destWidth = destHeight = TiDrawableReference.UNKNOWN;
		Bounds destBounds = calcDestSize(srcWidth, srcHeight, destWidthDimension, destHeightDimension, parent);
		destWidth = destBounds.width;
		destHeight = destBounds.height;
		return calcSampleSize(srcWidth, srcHeight, destWidth, destHeight);
	}

	/**
	 * Calculates a value for the BitmapFactory.Options .inSampleSize property by first calling peakBounds() 
	 * to determine the source width & height.
	 * 
	 * @see #calcSampleSize(int, int, int, int)
	 * @param destWidthDimension TiDimension holding the destination width. If null, the TiContext's Activity's Window's decor width is used
	 * as the destWidth.
	 * @param destHeightDimension TiDimension holding the destination height.  If null, the destHeight will be proportional to destWidth as srcHeight
	 * is to srcWidth.
	 * @return max of srcWidth/destWidth or srcHeight/destHeight
	 */
	public int calcSampleSize(View parent, TiDimension destWidthDimension, TiDimension destHeightDimension) 
	{
		Bounds bounds = peekBounds();
		int srcWidth = bounds.width;
		int srcHeight = bounds.height;

		return calcSampleSize(parent, srcWidth, srcHeight, destWidthDimension, destHeightDimension);

	}

	private TiFileHelper getTiFileHelper()
	{
		if (fileHelper == null) {
			TiContext context = softContext.get();
			if (context != null) {
				fileHelper = context.getTiFileHelper();
			}
		}
		return fileHelper;
	}

	/**
	 * @return true if most recent attempt to getBitmap caused an OutOfMemoryError
	 */
	public boolean outOfMemoryOccurred()
	{
		return oomOccurred;
	}

	public String getUrl()
	{
		return url;
	}
}

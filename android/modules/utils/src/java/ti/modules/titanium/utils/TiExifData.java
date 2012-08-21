/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.utils;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollPropertyChange;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.KrollProxyListener;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiFileProxy;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.view.TiDrawableReference;

import android.media.ExifInterface;

public class TiExifData implements KrollProxyListener
{
	private static final String FILE_PREFIX = "file://";
	private static final String TAG = "TiExifData";
	private ExifInterface exifInterface;
	protected KrollProxy proxy;

	public TiExifData(KrollProxy proxy)
	{
		this.proxy = proxy;
	}

	public String getAttribute(String attribute)
	{
		if (exifInterface != null) {
			// We need handle orientation values differently. Android returns constants for the orientation, and we want to return actual orientation values.
			if (UtilsModule.TAG_ORIENTATION.equals(attribute)) {
				int orientation = exifInterface.getAttributeInt(ExifInterface.TAG_ORIENTATION, 0);
				
				if(orientation == ExifInterface.ORIENTATION_ROTATE_90) {
					orientation = 90;
				} else if(orientation == ExifInterface.ORIENTATION_ROTATE_180) {
					orientation = 180;
				} else if(orientation == ExifInterface.ORIENTATION_ROTATE_270) {
					orientation = 270;
				} else {
					orientation = 0;
				}

				return Integer.toString(orientation);
			}

			return exifInterface.getAttribute(attribute);
		}

		return null;
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (TiC.PROPERTY_IMAGE.equals(key)) {
			setExifInterface(newValue);
		}
	}

	@Override
	public void processProperties(KrollDict d)
	{
		if (d.containsKey(TiC.PROPERTY_IMAGE)) {
			setExifInterface(d.get(TiC.PROPERTY_IMAGE));
		}
	}

	@Override
	public void propertiesChanged(List<KrollPropertyChange> changes, KrollProxy proxy)
	{
		for (KrollPropertyChange change : changes) {
			propertyChanged(change.getName(), change.getOldValue(), change.getNewValue(), proxy);
		}
	}

	@Override
	public void listenerAdded(String type, int count, KrollProxy proxy)
	{
	}

	@Override
	public void listenerRemoved(String type, int count, KrollProxy proxy)
	{
	}

	private TiDrawableReference makeImageSource(Object object)
	{
		if (object instanceof TiFileProxy) {
			return TiDrawableReference.fromFile(proxy.getActivity(), ((TiFileProxy) object).getBaseFile());
		} else if (object instanceof String) {
			return TiDrawableReference.fromUrl(proxy, (String) object);
		} else {
			return TiDrawableReference.fromObject(proxy.getActivity(), object);
		}
	}

	private void setExifInterface(Object image)
	{
		TiDrawableReference source = makeImageSource(image);
		String path = null;

		if (source.isTypeBlob()) {
			TiBlob blob = source.getBlob();
			if (blob != null) {
				path = blob.getNativePath();
			}
		} else if (source.isTypeFile()) {
			TiBaseFile file = source.getFile();
			if (file != null) {
				path = file.getNativeFile().getAbsolutePath();
			}
		} else {
			InputStream is = source.getInputStream();
			if (is != null) {
				File file = TiFileHelper.getInstance().getTempFileFromInputStream(is, "EXIF-TMP", true);
				path = file.getAbsolutePath();
			}
		}

		try {
			if (path == null) {
				Log.e(TAG,
					"Path of image file could not determined. Could not create an exifInterface from an invalid path.");
				return;
			}

			// Remove path prefix
			if (path.startsWith(FILE_PREFIX)) {
				path = path.replaceFirst(FILE_PREFIX, "");
			}

			exifInterface = new ExifInterface(path);

		} catch (IOException e) {
			Log.e(TAG, "Error creating exifInterface");
		}
	}
}

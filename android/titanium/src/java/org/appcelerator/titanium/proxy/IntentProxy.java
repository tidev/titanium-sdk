/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Arrays;
import java.util.List;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;

import android.content.Intent;
import android.net.Uri;
import android.text.TextUtils;

@Kroll.proxy(propertyAccessors = {
	TiC.PROPERTY_CLASS_NAME,
	TiC.PROPERTY_PACKAGE_NAME,
	TiC.PROPERTY_URL
})
/**
 * This is a proxy representation of the Android Intent type.
 * Refer to <a href="http://developer.android.com/reference/android/content/Intent.html">Android Intent</a>
 * for more details.
 */
public class IntentProxy extends KrollProxy 
{
	private static final String TAG = "TiIntent";

	public static final int TYPE_ACTIVITY = 0;
	public static final int TYPE_SERVICE = 1;
	public static final int TYPE_BROADCAST = 2;

	protected Intent intent;
	protected int type = TYPE_ACTIVITY;

	public IntentProxy()
	{	
	}

	public IntentProxy(Intent intent)
	{
		this.intent = intent;
	}

	protected static char[] escapeChars = new char[] {
		'\\', '/', ' ', '.', '$', '&', '@'
	};

	protected static String getURLClassName(String url, int type)
	{
		switch (type) {
			case TYPE_ACTIVITY: return getURLClassName(url, "Activity");
			case TYPE_SERVICE: return getURLClassName(url, "Service");
			case TYPE_BROADCAST: return getURLClassName(url, "Broadcast");
		}
		return null;
	}

	protected static String getURLClassName(String url, String appendage)
	{
		List<String> parts = Arrays.asList(url.split("/"));
		if (parts.size() == 0) return null;
		
		int start = 0;
		if (parts.get(0).equals("app:") && parts.size() >= 3) {
			start = 2;
		}
		
		String className = TextUtils.join("_", parts.subList(start, parts.size()));
		if (className.endsWith(".js")) {
			className = className.substring(0, className.length()-3);
		}
		
		if (className.length() > 1) {
			className = className.substring(0, 1).toUpperCase() + className.substring(1);
		} else {
			className = className.toUpperCase();
		}
		
		for (char escapeChar : escapeChars) {
			className = className.replace(escapeChar, '_');
		}
		
		return className+appendage;
	}

	public void handleCreationDict(KrollDict dict)
	{
		super.handleCreationDict(dict);
		intent = new Intent();
		
		// See which set of options we have to work with.
		String action = dict.getString(TiC.PROPERTY_ACTION);
		String url = dict.getString(TiC.PROPERTY_URL);
		String data = dict.getString(TiC.PROPERTY_DATA);
		String className = dict.getString(TiC.PROPERTY_CLASS_NAME);
		String packageName = dict.getString(TiC.PROPERTY_PACKAGE_NAME);
		String type = dict.getString(TiC.PROPERTY_TYPE);
		int flags = 0;

		if (dict.containsKey(TiC.PROPERTY_FLAGS)) {
			flags = TiConvert.toInt(dict, TiC.PROPERTY_FLAGS);
			Log.d(TAG, "Setting flags: " + Integer.toString(flags), Log.DEBUG_MODE);
			intent.setFlags(flags);
		} else {
			setProperty(TiC.PROPERTY_FLAGS, intent.getFlags());
		}

		if (action != null) {
			Log.d(TAG, "Setting action: " + action, Log.DEBUG_MODE);
			intent.setAction(action);
		}

		if (packageName != null) {
			Log.d(TAG, "Setting package: " + packageName, Log.DEBUG_MODE);
			intent.setPackage(packageName);
		}

		if (url != null) {
			Log.d(TAG, "Creating intent for JS Activity/Service @ " + url, Log.DEBUG_MODE);
			packageName = TiApplication.getInstance().getPackageName();
			className = packageName + "." + getURLClassName(url, this.type);
		}

		if (className != null) {
			if (packageName != null) {
				Log.d(TAG, "Both className and packageName set, using intent.setClassName(packageName, className",
					Log.DEBUG_MODE);
				intent.setClassName(packageName, className);
			} else {
				try {
					Class<?> c = getClass().getClassLoader().loadClass(className);
					intent.setClass(TiApplication.getInstance().getApplicationContext(), c);
				} catch (ClassNotFoundException e) {
					Log.e(TAG, "Unable to locate class for name: " + className);
					throw new IllegalStateException("Missing class for name: " + className, e);
				}
			}
		}


		if (type == null) {
			if (action != null && action.equals(Intent.ACTION_SEND)) {
				type = "text/plain";
			}
		}

		// setType and setData are inexplicably intertwined
		// calling setType by itself clears the type and vice-versa
		// if you have both you _must_ call setDataAndType
		if (type != null) {
			Log.d(TAG, "Setting type: " + type, Log.DEBUG_MODE);
			if (data != null) {
				intent.setDataAndType(Uri.parse(data), type);
			} else {
				intent.setType(type);
			}
		} else if (data != null) {
			intent.setData(Uri.parse(data));
		}
	}



	@Kroll.method
	public void putExtra(String key, Object value)
	{
		if (value instanceof String) {
			intent.putExtra(key, (String) value);
		} else if (value instanceof Boolean) {
			intent.putExtra(key, (Boolean) value);
		} else if (value instanceof Double) {
			intent.putExtra(key, (Double) value);
		} else if (value instanceof Integer) {
			intent.putExtra(key, (Integer) value);
		} else if (value instanceof Long) {
			intent.putExtra(key, (Long) value);
		}
		else {
			Log.w(TAG, "Warning unimplemented put conversion for " + value.getClass().getCanonicalName() + " trying String");
			intent.putExtra(key, TiConvert.toString(value));
		}
	}


	@Kroll.method
	public void addFlags(int flags)
	{
		intent.addFlags(flags);
	}

	@Kroll.setProperty @Kroll.method
	public void setFlags(int flags)
	{
		intent.setFlags(flags);
	}

	@Kroll.getProperty @Kroll.method
	public int getFlags()
	{
		return intent.getFlags();
	}

	@Kroll.method
	public void putExtraUri(String key, String uri)
	{
		intent.putExtra(key, Uri.parse(uri));
	}

	@Kroll.method
	public void addCategory(String category)
	{
		if (category != null) {
			Log.d(TAG, "Adding category: " + category, Log.DEBUG_MODE);
			intent.addCategory(category);
		}
	}

	@Kroll.method
	public String getStringExtra(String name)
	{
		if (!intent.hasExtra(name)) {
			return null;
		}

		String result = intent.getStringExtra(name);
		if (result == null) {
			// One more try as parcelable extra, such as when it's a Uri.
			// We can't really support getParcelableExtra(name) by itself,
			// since the type of object coming out of it is unknown and
			// might not make its way successfully over to Javascript.
			// By getting it as a string, we at least allow people to grab
			// Uris (Intent.STREAM) stored as parcelable extras, which is a
			// very common use case.
			Object parcelable = intent.getParcelableExtra(name);
			if (parcelable != null) {
				result = parcelable.toString();
			}
		}

		return result;
	}

	@Kroll.method
	public boolean getBooleanExtra(String name, boolean defaultValue)
	{
		return intent.getBooleanExtra(name, defaultValue);
	}

	@Kroll.method
	public int getIntExtra(String name, int defaultValue)
	{
		return intent.getIntExtra(name, defaultValue);
	}

	@Kroll.method
	public long getLongExtra(String name, long defaultValue)
	{
		return intent.getLongExtra(name, defaultValue);
	}

	@Kroll.method
	public double getDoubleExtra(String name, double defaultValue)
	{
		return intent.getDoubleExtra(name, defaultValue);
	}

	@Kroll.method
	public TiBlob getBlobExtra(String name)
	{
		try {
			Uri uri = (Uri) intent.getExtras().getParcelable(name);
			InputStream is = TiApplication.getInstance().getContentResolver().openInputStream(uri);

			ByteArrayOutputStream bos = new ByteArrayOutputStream();
			int len;
			int size = 4096;
			byte[] buf = new byte[size];
			while ((len = is.read(buf, 0, size)) != -1) {
				bos.write(buf, 0, len);
			}
			buf = bos.toByteArray();

			return TiBlob.blobFromData(buf);
		} catch (Exception e) {
			Log.e(TAG, "Error getting blob extra: " + e.getMessage(), e);
			return null;
		}
	}

	@Kroll.method @Kroll.getProperty
	public String getData()
	{
		return intent.getDataString();
	}

	/**
	 * @return the associated intent.
	 */
	public Intent getIntent()
	{ 
		return intent;
	}

	@Kroll.method @Kroll.getProperty
	public String getType()
	{
		return intent.getType();
	}

	@Kroll.method @Kroll.setProperty
	public void setType(String type)
	{
		intent.setType(type);
	}

	@Kroll.method @Kroll.getProperty
	public String getAction()
	{
		return intent.getAction();
	}

	@Kroll.method @Kroll.setProperty
	public void setAction(String action)
	{
		intent.setAction(action);
	}

	/**
	 * @return intent type for internal purposes (TYPE_ACTIVITY, etc.)
	 */
	public int getInternalType()
	{
		return type;
	}

	/**
	 * Sets the intent type.
	 * @param type the intent type for internal purposes (TYPE_ACTIVITY etc.)
	 */
	public void setInternalType(int type)
	{
		this.type = type;
	}

	@Kroll.method
	public boolean hasExtra(String name)
	{
		if (intent != null) {
			return intent.hasExtra(name);
		}
		return false;
	}
}

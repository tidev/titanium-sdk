/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;

/**
 * This class allows us to retrieve Android resource IDs
 * from the various Android R classes using
 * strings at runtime.
 */
public class TiRHelper
{
	private static final String TAG = "TiRHelper";

	private static Map<String, Class<?>> clsCache = Collections.synchronizedMap(new HashMap<String, Class<?>>());
	private static Map<String, Integer> valCache = Collections.synchronizedMap(new HashMap<String, Integer>());

	private static String clsPrefixAndroid = "android.R$";
	private static String clsPrefixApplication = null;

	/**
	 * The exception thrown by TiRHelper when a particular resource is not found.
	 * @module.api
	 */
	public static final class ResourceNotFoundException extends ClassNotFoundException
	{
		private static final long serialVersionUID = 119234857198273641L;

		public ResourceNotFoundException(String resource)
		{
			super("Resource not found: " + resource);
		}
	}

	private static Class<?> getClass(String classname) throws ClassNotFoundException
	{
		Class<?> cls = clsCache.get(classname);
		if (cls != null)
			return cls;

		cls = Class.forName(classname);
		clsCache.put(classname, cls);
		return cls;
	}

	protected static String[] getClassAndFieldNames(String path)
	{
		int lastDot = path.lastIndexOf('.');
		String className = lastDot < 0 ? "" : path.substring(0, lastDot < 0 ? 1 : lastDot).replace('.', '$');
		String fieldName = lastDot < 0 ? path : path.substring(lastDot + 1);
		return new String[] { className, fieldName };
	}

	protected static int getResource(String prefix, String path) throws ResourceNotFoundException
	{
		Integer i = valCache.get(path);
		if (i != null)
			return i;

		return lookupResource(prefix, path, getClassAndFieldNames(path));
	}

	protected static int lookupResource(String prefix, String path, String[] classAndFieldNames)
		throws ResourceNotFoundException
	{
		if (prefix != null && path != null && prefix.startsWith("android.R") && path.startsWith("drawable.")) {
			String message
				= "Using android.R.drawable is not recommended since they are changed/removed across Android versions."
				+ " Instead copy images to res folder.";
			Log.w(TAG, message);
		}

		// Get the clsPrefixApplication if this is the first time
		if (clsPrefixApplication == null)
			clsPrefixApplication = TiApplication.getInstance().getApplicationInfo().packageName + ".R$";
		if (prefix == null) {
			prefix = clsPrefixApplication;
		}

		Integer i = null;
		// Load the field
		try {
			i = getClass(prefix + classAndFieldNames[0]).getDeclaredField(classAndFieldNames[1]).getInt(null);
		} catch (Exception e) {
			Log.e(TAG, "Error looking up resource: " + e.getMessage(), e, Log.DEBUG_MODE);
			valCache.put(path, 0);
			throw new ResourceNotFoundException(path);
		}

		valCache.put(path, i);
		return i;
	}

	/**
	 * Searches for an Android compiled resource given its path. These resources are traditionally accessed via a resource ID
	 * (either from the application's resource bundle, or Android's internal resource bundle)
	 * @param path the resource's path.
	 * @param includeSystemResources indicates whether or not {@link #getResource(String, boolean)} will look in the system's (Android)
	 * resource bundle, if the resource is not found in the application's resource bundle.
	 * @return the resource, if found.
	 * @throws ResourceNotFoundException the exception thrown when the resource is not found in either location listed above.
	 * @module.api
	 */
	public static int getResource(String path, boolean includeSystemResources) throws ResourceNotFoundException
	{
		Integer i = valCache.get(path);
		if (i != null)
			return i;

		String[] classAndFieldNames = getClassAndFieldNames(path);

		try {
			int resid = lookupResource(clsPrefixApplication, path, classAndFieldNames);
			return resid;
		} catch (ResourceNotFoundException e) {
			if (!includeSystemResources) {
				throw e;
			}
			return lookupResource(clsPrefixAndroid, path, classAndFieldNames);
		}
	}

	/**
	 * Searches for an Android compiled resource given its path. Refer to {@link #getResource(String, boolean)} for more details.
	 * @param path the resource's path
	 * @return the resource, if found.
	 * @throws ResourceNotFoundException the exception thrown when the resource is not found in either
	 * the application's resource bundle, or Android's internal resource bundle.
	 * @module.api
	 */
	public static int getResource(String path) throws ResourceNotFoundException
	{
		return getResource(path, true);
	}

	/**
	 * Checks if the given resource path exists. Refer to {@link #getResource(String)} for more details.
	 * @param path the resource's path
	 * @return whether or not the resource exists in the application's resource bundle.
	 * @module.api
	 */
	public static boolean hasResource(String path)
	{
		try {
			int id = TiRHelper.getResource(path);
			return id != 0;
		} catch (ResourceNotFoundException e) {
			return false;
		}
	}

	/**
	 * @param path path of the resource.
	 * @return the application resource given its path.
	 * @throws ResourceNotFoundException
	 */
	public static int getApplicationResource(String path) throws ResourceNotFoundException
	{
		return getResource(clsPrefixApplication, path);
	}

	public static int getAndroidResource(String path) throws ResourceNotFoundException
	{
		return getResource(clsPrefixAndroid, path);
	}

	/**
	 * Clears the cache.  Should only be used in low memory situations
	 * as clearing the cache will adversely affect performance.
	 */
	public static void clearCache()
	{
		valCache.clear();
		clsCache.clear();
	}
}

package org.appcelerator.titanium.util;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.titanium.TiApplication;

/*
 * A Class which allows us to pull resource integers 
 * off of the various R class structures using
 * strings at runtime.
 */
public class TiRHelper {
	private static final String LCAT = "TiRHelper";
	private static final boolean DBG = TiConfig.LOGD;
	
	private static Map<String, Class<?>> clsCache = Collections.synchronizedMap(new HashMap<String, Class<?>>());
	private static Map<String, Integer> valCache = Collections.synchronizedMap(new HashMap<String, Integer>());
	
	private static String clsPrefixAndroid     = "android.R$";
	private static String clsPrefixApplication = null;
	
	public static final class ResourceNotFoundException extends ClassNotFoundException {
		private static final long serialVersionUID = 119234857198273641L;
		
		public ResourceNotFoundException(String resource) {
			super("Resource not found: " + resource);
		}
	}
	
	private static Class<?> getClass(String classname) throws ClassNotFoundException {
		Class<?> cls = clsCache.get(classname);
		if (cls != null) return cls;

		cls = Class.forName(classname);
		clsCache.put(classname, cls);
		return cls;
	}
	
	protected static String[] getClassAndFieldNames(String path) {
		int lastDot = path.lastIndexOf('.');
		String className = lastDot < 0 ? "" : path.substring(0, lastDot < 0 ? 1 : lastDot).replace('.', '$');
		String fieldName = lastDot < 0 ? path : path.substring(lastDot + 1);
		return new String[] { className, fieldName };
	}
	
	protected static int getResource(String prefix, String path) throws ResourceNotFoundException {
		Integer i = valCache.get(path);
		if (i != null) return i;
		
		return lookupResource(prefix, path, getClassAndFieldNames(path));
	}

	protected static int lookupResource(String prefix, String path, String[] classAndFieldNames) throws ResourceNotFoundException {
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
			if (DBG) {
				Log.e(LCAT, "Error looking up resource: " + e.getMessage(), e);
			}
			valCache.put(path, 0);
			throw new ResourceNotFoundException(path);
		}
		
		valCache.put(path, i);
		return i;
	}
	
	public static int getResource(String path, boolean includeSystemResources) throws ResourceNotFoundException {
		Integer i = valCache.get(path);
		if (i != null) return i;
		
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

	public static int getResource(String path) throws ResourceNotFoundException
	{
		return getResource(path, true);
	}
	
	public static int getApplicationResource(String path) throws ResourceNotFoundException {
		return getResource(clsPrefixApplication, path);
	}
	
	public static int getAndroidResource(String path) throws ResourceNotFoundException {
		return getResource(clsPrefixAndroid, path);
	}
	
	/*
	 * Clears the cache.  Should only be used in low memory situations
	 * as clearing the cache will adversely affect performance.
	 */
	public static void clearCache() {
		valCache.clear();
		clsCache.clear();
	}
}

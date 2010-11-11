package org.appcelerator.titanium.util;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import org.appcelerator.titanium.TiApplication;

import android.util.Log;

/*
 * A Class which allows us to pull resource integers 
 * off of the various R class structures using
 * strings at runtime.
 */
public class TiRHelper {
	private static final String LCAT = "TiRHelper";
	
	private static Map<String, Class<?>> clsCache = Collections.synchronizedMap(new HashMap<String, Class<?>>());
	private static Map<String, Integer>  valCache = Collections.synchronizedMap(new HashMap<String, Integer>());
	
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
	
	public static int getResource(String path) throws ResourceNotFoundException {
		// Check the cache for this value
		Integer i = valCache.get(path);
		if (i != null) return i;

		// Get the classname / fieldname
		int lastseg = path.lastIndexOf('.');
		String classname = lastseg < 0 ? ""   : path.substring(0, lastseg < 0 ? 1 : lastseg).replace('.', '$');
		String fieldname = lastseg < 0 ? path : path.substring(lastseg + 1);
		
		// Get the clsPrefixApplication if this is the first time
		if (clsPrefixApplication == null)
			clsPrefixApplication = TiApplication.getInstance().getApplicationInfo().packageName + ".R$";
		
		// Load the field
		try {
			i = getClass(clsPrefixApplication + classname).getDeclaredField(fieldname).getInt(null);
		} catch (Exception e) {
			try {
				i = getClass(clsPrefixAndroid + classname).getDeclaredField(fieldname).getInt(null);
			} catch (Exception ee) {
				Log.w(LCAT, "Unable to find resource: " + path);
				throw new TiRHelper.ResourceNotFoundException(path);
			}
		}
		
		valCache.put(path, i);
		return i;
	}
}
